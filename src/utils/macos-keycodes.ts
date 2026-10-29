import type {IKeycode} from './key';

// Native consumer keys require firmware support. Shortcut presets use macOS
// defaults; users can change those bindings in System Settings.
export const macOSKeycodes: IKeycode[] = [
  {
    name: 'Brightness − (F14)',
    shortName: 'F14 Dim',
    code: 'KC_F14',
    aliases: [
      'screen -',
      'brightness down',
      'display dimmer',
      'mac brightness',
    ],
    title: 'Send F14 — working brightness-down alternative on your Mac',
  },
  {
    name: 'Brightness + (F15)',
    shortName: 'F15 Bright',
    code: 'KC_F15',
    aliases: [
      'screen +',
      'brightness up',
      'display brighter',
      'mac brightness',
    ],
    title: 'Send F15 — working brightness-up alternative on your Mac',
  },

  {
    name: 'App Switcher',
    code: 'LGUI(KC_TAB)',
    aliases: ['cmd tab', 'command tab'],
    title: 'Switch to the previous app — Command-Tab',
  },
  {
    name: 'Full Screen',
    code: 'LCTL(LGUI(KC_F))',
    title: 'Toggle full screen — Control-Command-F',
  },
  {
    name: 'Hide App',
    code: 'LGUI(KC_H)',
    title: 'Hide the front app — Command-H',
  },
  {
    name: 'Minimize',
    code: 'LGUI(KC_M)',
    title: 'Minimize the front window — Command-M',
  },
  {
    name: 'Close Window',
    code: 'LGUI(KC_W)',
    title: 'Close window or tab — Command-W',
  },
  {
    name: 'Quit App',
    code: 'LGUI(KC_Q)',
    title: 'Quit the front app — Command-Q',
  },
  {name: 'Find', code: 'LGUI(KC_F)', title: 'Find — Command-F'},
  {name: 'Save', code: 'LGUI(KC_S)', title: 'Save — Command-S'},
  {
    name: 'Next Word',
    code: 'LALT(KC_RGHT)',
    title: 'Move forward one word — Option-Right',
  },
  {
    name: 'Previous Word',
    code: 'LALT(KC_LEFT)',
    title: 'Move backward one word — Option-Left',
  },
  {
    name: 'Delete Word',
    code: 'LALT(KC_BSPC)',
    title: 'Delete previous word — Option-Backspace',
  },
  {
    name: 'Line Start',
    code: 'LGUI(KC_LEFT)',
    title: 'Beginning of line — Command-Left',
  },
  {
    name: 'Line End',
    code: 'LGUI(KC_RGHT)',
    title: 'End of line — Command-Right',
  },

  {
    name: 'Mission Control',
    code: 'KC_MCTL',
    title: 'Mission Control (requires firmware support)',
  },
  {
    name: 'Launchpad',
    code: 'KC_LPAD',
    title: 'Launchpad (requires firmware and macOS support)',
  },
  {
    name: 'Brightness −',
    code: 'KC_BRID',
    title:
      'Display brightness down — requires firmware, OS and display support',
  },
  {
    name: 'Brightness +',
    code: 'KC_BRIU',
    title: 'Display brightness up — requires firmware, OS and display support',
  },
  {name: 'Volume −', code: 'KC_VOLD'},
  {name: 'Volume +', code: 'KC_VOLU'},
  {name: 'Mute', code: 'KC_MUTE'},
  {name: 'Previous', code: 'KC_MPRV'},
  {name: 'Play / Pause', code: 'KC_MPLY'},
  {name: 'Next', code: 'KC_MNXT'},
  {name: 'Eject', code: 'KC_EJCT'},
  {name: 'Command ⌘', code: 'KC_LGUI'},
  {name: 'Option ⌥', code: 'KC_LALT'},
  {
    name: 'Spotlight',
    code: 'LGUI(KC_SPC)',
    title: 'Spotlight — ⌘Space (macOS default)',
  },
  {
    name: 'Mission Control ⌃↑',
    code: 'LCTL(KC_UP)',
    title: 'Mission Control — ⌃↑ (macOS default)',
  },
  {
    name: 'App Windows',
    code: 'LCTL(KC_DOWN)',
    title: 'App Exposé — ⌃↓ (macOS default)',
  },
  {
    name: 'Desktop ←',
    code: 'LCTL(KC_LEFT)',
    title: 'Previous desktop — ⌃← (macOS default)',
  },
  {
    name: 'Desktop →',
    code: 'LCTL(KC_RGHT)',
    title: 'Next desktop — ⌃→ (macOS default)',
  },
  {name: 'Screenshot', code: 'LGUI(LSFT(KC_3))', title: 'Capture screen — ⇧⌘3'},
  {
    name: 'Capture Area',
    code: 'LGUI(LSFT(KC_4))',
    title: 'Capture selection — ⇧⌘4',
  },
  {
    name: 'Capture Options',
    code: 'LGUI(LSFT(KC_5))',
    title: 'Screenshot toolbar — ⇧⌘5',
  },
  {name: 'Lock Screen', code: 'LCTL(LGUI(KC_Q))', title: 'Lock screen — ⌃⌘Q'},
  {
    name: 'Force Quit',
    code: 'LALT(LGUI(KC_ESC))',
    title: 'Force Quit dialog — ⌥⌘Esc',
  },
  {
    name: 'Emoji',
    code: 'LCTL(LGUI(KC_SPC))',
    title: 'Character Viewer — ⌃⌘Space',
  },
  {name: 'Copy', code: 'LGUI(KC_C)'},
  {name: 'Paste', code: 'LGUI(KC_V)'},
  {name: 'Cut', code: 'LGUI(KC_X)'},
  {name: 'Undo', code: 'LGUI(KC_Z)'},
  {name: 'Redo', code: 'LGUI(LSFT(KC_Z))'},
  {name: 'Select All', code: 'LGUI(KC_A)'},
];
