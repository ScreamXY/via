import type {IKeycode} from './key';

export const modifierKeycodes: IKeycode[] = [
  {
    name: 'Hyper',
    code: 'HYPR(KC_NO)',
    aliases: ['KC_HYPR', 'hyper key', 'hypr'],
    title: 'Hold Control + Shift + Option + Command',
  },
  {
    name: 'Meh',
    code: 'MEH(KC_NO)',
    aliases: ['KC_MEH', 'meh key'],
    title: 'Hold Control + Shift + Option',
  },
  {
    name: 'Hyper / Esc',
    code: 'MT(MOD_HYPR,KC_ESC)',
    aliases: ['hyper escape', 'hyper tap', 'HYPR_T(KC_ESC)'],
    title: 'Tap Escape; hold Hyper (firmware tap/hold timing)',
  },
  {
    name: 'Meh / Esc',
    code: 'MT(MOD_MEH,KC_ESC)',
    aliases: ['meh escape', 'meh tap', 'MEH_T(KC_ESC)'],
    title: 'Tap Escape; hold Meh (firmware tap/hold timing)',
  },
  {
    name: 'Control / Esc',
    code: 'MT(MOD_LCTL,KC_ESC)',
    aliases: ['ctrl escape', 'CTL_T(KC_ESC)'],
    title: 'Tap Escape; hold Control (firmware tap/hold timing)',
  },
  {
    name: 'Shift / Enter',
    code: 'MT(MOD_LSFT,KC_ENT)',
    aliases: ['shift return', 'SFT_T(KC_ENT)'],
    title: 'Tap Enter; hold Shift (firmware tap/hold timing)',
  },
  ...[
    ['Hyper', 'MOD_HYPR'],
    ['Meh', 'MOD_MEH'],
    ['Shift', 'MOD_LSFT'],
    ['Control', 'MOD_LCTL'],
    ['Option', 'MOD_LALT'],
    ['Command', 'MOD_LGUI'],
  ].map(([name, mod]) => ({
    name: `One-shot ${name}`,
    code: `OSM(${mod})`,
    aliases: [`sticky ${name}`, `oneshot ${name}`],
    title: `Apply ${name} to the next key; requires firmware one-shot support`,
  })),
];
