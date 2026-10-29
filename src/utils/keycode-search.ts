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

export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/⌘/g, ' command ')
    .replace(/⌥/g, ' option ')
    .replace(/⌃/g, ' control ')
    .replace(/⇧/g, ' shift ')
    .replace(/−/g, '-')
    .replace(/[_(),/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function searchKeycodes(items: IKeycode[], query: string): IKeycode[] {
  const q = normalizeSearch(query);
  const terms = q.split(' ');
  const unique = new Map<string, IKeycode>();
  for (const item of items) {
    const existing = unique.get(item.code);
    unique.set(
      item.code,
      existing
        ? {
            ...existing,
            aliases: [
              ...(existing.aliases || []),
              item.name,
              item.title || '',
              ...(item.aliases || []),
            ],
          }
        : item,
    );
  }
  return [...unique.values()]
    .map((item, index) => {
      const names = [
        item.name,
        item.code,
        ...(item.aliases || []),
        ...(aliases[item.code] || []),
      ].map(normalizeSearch);
      const fields = [...names, normalizeSearch(item.title || '')];
      const score = !q
        ? 0
        : names.includes(q)
          ? 0
          : names.some((n) => n.startsWith(q))
            ? 1
            : terms.every((term) =>
                  fields.some((field) => field.includes(term)),
                )
              ? 2
              : 100;
      return {item, score, index};
    })
    .filter(({score}) => score < 100)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map(({item}) => item);
}

export function withKeycodeAliases(
  items: IKeycode[],
  dict: Record<string, number>,
): IKeycode[] {
  return items.map((item) => ({
    ...item,
    aliases: [
      ...(item.aliases || []),
      ...(aliases[item.code] || []),
      ...Object.keys(dict).filter(
        (code) =>
          !code.startsWith('_') &&
          dict[item.code] !== undefined &&
          dict[code] === dict[item.code],
      ),
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
  let code = input.trim().toUpperCase();
  if (!code) {
    return null;
  }
  if (/^0X[0-9A-F]{1,4}$/.test(code)) {
    return {code, value: parseInt(code.slice(2), 16)};
  }
  if (!code.startsWith('_') && Object.hasOwn(dict, code)) {
    return {code, value: dict[code]};
  }
  const exact = items.filter((item) =>
    [
      item.name,
      item.code,
      ...(item.aliases || []),
      ...(aliases[item.code] || []),
    ].some((name) => normalizeSearch(name) === normalizeSearch(input)),
  );
  const codes = [...new Set(exact.map((item) => item.code))];
  if (codes.length === 1) {
    code = codes[0];
  }
  if (!code.startsWith('_') && Object.hasOwn(dict, code)) {
    return {code, value: dict[code]};
  }
  // Reject incomplete expressions and trailing input before calling VIA's parser.
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
  if (
    call &&
    ['MO', 'DF', 'TG', 'OSL', 'TT', 'TO', 'CUSTOM', 'MACRO'].includes(call[1])
  ) {
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
      (!Object.hasOwn(dict, args[1]) ||
        dict[args[1]] > 255 ||
        args[1].startsWith('_'))
    ) {
      return null;
    }
  }
  const value = advancedStringToKeycode(code, dict);
  return Number.isInteger(value) && value > 0 && value <= 0xffff
    ? {code, value}
    : null;
}
