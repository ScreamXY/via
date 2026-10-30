import type {VIADefinitionV2, VIADefinitionV3} from '@the-via/reader';
import {advancedStringToKeycode} from './advanced-keys';
import type {IKeycode} from './key';

const aliases: Record<string, string[]> = {
  KC_LGUI: ['command', 'cmd', 'left command', 'super', 'win', 'KC_LCMD'],
  KC_RGUI: ['right command', 'right cmd', 'KC_RCMD'],
  KC_LALT: ['option', 'alt', 'left option', 'KC_LOPT'],
  KC_RALT: ['right option', 'altgr', 'KC_ROPT'],
  KC_LCTL: ['control', 'ctrl'],
  KC_LSFT: ['shift'],
  KC_BRIU: [
    'screen +',
    'brightness up',
    'display brighter',
    'KC_BRIGHTNESS_UP',
  ],
  KC_BRID: [
    'screen -',
    'brightness down',
    'display dimmer',
    'KC_BRIGHTNESS_DOWN',
  ],
  KC_MCTL: ['mission control', 'expose', 'KC_MISSION_CONTROL'],
  KC_LPAD: ['launchpad', 'apps', 'KC_LAUNCHPAD'],
  KC_MPLY: ['play pause', 'KC_MEDIA_PLAY_PAUSE'],
  KC_VOLU: ['volume up', 'volume +', 'louder', 'KC_AUDIO_VOL_UP'],
  KC_VOLD: ['volume down', 'volume -', 'quieter', 'KC_AUDIO_VOL_DOWN'],
  KC_MUTE: ['mute audio', 'KC_AUDIO_MUTE'],
  KC_ENT: ['enter', 'return', 'KC_ENTER'],
  KC_ESC: ['escape', 'KC_ESCAPE'],
  KC_BSPC: ['backspace', 'delete backward', 'KC_BACKSPACE'],
  KC_DEL: ['delete forward', 'KC_DELETE'],
  KC_SPC: ['space', 'KC_SPACE'],
  KC_TRNS: ['transparent', 'pass through', 'KC_TRANSPARENT', '_______'],
  KC_NO: ['none', 'disabled', 'no key', 'XXXXXXX'],
};

// Functions whose single argument is a layer, custom key or macro index.
const indexFunctions = ['MO', 'DF', 'TG', 'OSL', 'TT', 'TO', 'CUSTOM', 'MACRO'];

const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/⌘/g, ' command ')
    .replace(/⌥/g, ' option ')
    .replace(/⌃/g, ' control ')
    .replace(/⇧/g, ' shift ')
    .replace(/−/g, '-')
    .replace(/[_(),/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const searchNames = (item: IKeycode) => [
  item.name,
  item.code,
  ...(item.aliases ?? []),
  ...(aliases[item.code] ?? []),
];

// Codes starting with "_" are internal range markers, not keycodes.
const isBasicKeycode = (code: string, dict: Record<string, number>) =>
  !code.startsWith('_') && Object.hasOwn(dict, code);

export const getCustomKeycodes = (
  definition: VIADefinitionV2 | VIADefinitionV3,
): IKeycode[] =>
  (definition.customKeycodes ?? []).map((key, index) => ({
    ...key,
    code: `CUSTOM(${index})`,
  }));

export function searchKeycodes(items: IKeycode[], query: string): IKeycode[] {
  const q = normalizeSearch(query);
  const terms = q.split(' ');
  const rank = (item: IKeycode): number | null => {
    const names = searchNames(item).map(normalizeSearch);
    if (!q || names.includes(q)) {
      return 0;
    }
    if (names.some((name) => name.startsWith(q))) {
      return 1;
    }
    const fields = [...names, normalizeSearch(item.title ?? '')];
    return terms.every((term) => fields.some((field) => field.includes(term)))
      ? 2
      : null;
  };
  // Merge duplicate codes so every category's names and titles stay searchable.
  const unique = items.reduce((merged, item) => {
    const existing = merged.get(item.code);
    return merged.set(
      item.code,
      existing
        ? {
            ...existing,
            aliases: [
              ...(existing.aliases ?? []),
              item.name,
              item.title ?? '',
              ...(item.aliases ?? []),
            ],
          }
        : item,
    );
  }, new Map<string, IKeycode>());
  return [...unique.values()]
    .map((item, index) => ({item, index, score: rank(item)}))
    .filter(({score}) => score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.index - b.index)
    .map(({item}) => item);
}

// Adds all dictionary names with the same value, e.g. KC_ENTER for KC_ENT.
export function withKeycodeAliases(
  items: IKeycode[],
  dict: Record<string, number>,
): IKeycode[] {
  const codesByValue = Object.keys(dict)
    .filter((code) => isBasicKeycode(code, dict))
    .reduce(
      (map, code) =>
        map.set(dict[code], [...(map.get(dict[code]) ?? []), code]),
      new Map<number, string[]>(),
    );
  return items.map((item) => ({
    ...item,
    aliases: [
      ...(item.aliases ?? []),
      ...(codesByValue.get(dict[item.code]) ?? []),
    ],
  }));
}

// Only exact, unambiguous names/aliases are accepted. Partial searches require
// choosing a suggestion; typing must never silently write the first match.
export function resolveKeycodeInput(
  input: string,
  dict: Record<string, number>,
  items: IKeycode[],
): {code: string; value: number} | null {
  const typed = input.trim().toUpperCase();
  if (!typed) {
    return null;
  }
  if (/^0X[0-9A-F]{1,4}$/.test(typed)) {
    return {code: typed, value: parseInt(typed.slice(2), 16)};
  }
  if (isBasicKeycode(typed, dict)) {
    return {code: typed, value: dict[typed]};
  }
  const query = normalizeSearch(input);
  const matches = new Set(
    items
      .filter((item) =>
        searchNames(item).some((name) => normalizeSearch(name) === query),
      )
      .map((item) => item.code),
  );
  const code = matches.size === 1 ? [...matches][0] : typed;
  if (isBasicKeycode(code, dict)) {
    return {code, value: dict[code]};
  }
  const value = parseKeycodeExpression(code, dict);
  return value === null ? null : {code, value};
}

// VIA's parser ignores unbalanced brackets and out-of-range arguments, so
// check those first.
function parseKeycodeExpression(
  code: string,
  dict: Record<string, number>,
): number | null {
  if (!/^[A-Z][A-Z0-9_]*\([A-Z0-9_(),|\s]+\)$/.test(code)) {
    return null;
  }
  let depth = 0;
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '(') {
      depth++;
    }
    if (code[i] === ')') {
      depth--;
      if (depth < 0 || (depth === 0 && i !== code.length - 1)) {
        return null;
      }
    }
  }
  if (depth !== 0) {
    return null;
  }
  const call = /^([A-Z]+)\((.*)\)$/.exec(code);
  if (call && indexFunctions.includes(call[1])) {
    if (!/^\d+$/.test(call[2]) || Number(call[2]) > 255) {
      return null;
    }
  }
  if (call && ['MT', 'LT', 'LM'].includes(call[1])) {
    const args = call[2].split(',').map((arg) => arg.trim());
    if (args.length !== 2) {
      return null;
    }
    if (call[1] !== 'MT' && (!/^\d+$/.test(args[0]) || Number(args[0]) > 15)) {
      return null;
    }
    if (
      call[1] !== 'LM' &&
      (!isBasicKeycode(args[1], dict) || dict[args[1]] > 255)
    ) {
      return null;
    }
  }
  const value = advancedStringToKeycode(code, dict);
  return Number.isInteger(value) && value > 0 && value <= 0xffff ? value : null;
}
