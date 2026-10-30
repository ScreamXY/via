# Keyspace — personal VIA

A personal fork of [the VIA web app](https://github.com/the-via/app). It adds bundled keyboard definitions, a macOS key category, keycode search and a new UI style. The upstream GPL-3.0 license is kept in [LICENSE](LICENSE).

## Run

```sh
npm ci
npm run dev      # http://localhost:5173
npm run build    # production files in dist/
npm test         # needs the definitions from dev or build
npm run preview  # serve the production build
```

Open the app in Chrome or Edge, connect the keyboard by USB and allow access. Bundled keyboards do not need a Design-tab import. WebHID needs HTTPS or localhost, and the browser asks for access once per site.

Serve `dist/` at the root of the site. VIA loads its definitions from absolute paths, so a subpath does not work without more changes.

## Internal hosting

`make publish` builds and tests the committed source in Docker. It then pushes amd64 and arm64 images to `ghcr.io/screamxy/via` with the tags `latest` and the short commit hash. Docker uses the existing GHCR credential helper.

The image serves the static app with Caddy on port 8080 as UID 1000. Client routes return the app; missing files and definitions return 404. The server does not need access to any keyboard.

[ScreamXY/internal-apps](https://github.com/ScreamXY/internal-apps) owns the Compose setup and the portal link at <https://scream-server.story-ling.ts.net:10443/>. Tailscale Serve provides HTTPS on the private tailnet. Connect the keyboard to the computer that runs the browser.

## Bundled keyboards

| Keyboard                               | VID:PID     | Definition source                                                                                      |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Royal Kludge R75 Wired                 | `342D:E484` | `R75 Wired Windows QMK.json`                                                                           |
| Royal Kludge R75 Wireless / R75Pro     | `342D:E487` | `R75 Wireless Windows QMK.json`                                                                        |
| Keychron V1 ANSI Knob                  | `3434:0311` | `US Knob v1.7.json.zip`                                                                                |
| Keychron V1 ISO Knob                   | `3434:0313` | `ISO Knob v1.3.json.zip`                                                                               |
| Redragon K630W-RGB VS11K28A (QMK port) | `5244:0630` | [`via/k630-vs11k28a.json`](https://github.com/ScreamXY/K630W-RGB_VIA/blob/main/via/k630-vs11k28a.json) |

The files in `keyboards/v3/` are unchanged copies of the vendor downloads, or of [ScreamXY/K630W-RGB_VIA](https://github.com/ScreamXY/K630W-RGB_VIA) for the K630W-RGB. "Windows" in a file name only names the vendor download; the definitions also work on macOS. Saved `*.layout.json` keymaps are not definitions, and the app does not load them.

The R75 Wireless definition has an optional knob layout. Select it in VIA if your keyboard has the knob.

The K630W-RGB needs the experimental [K630W-RGB_VIA](https://github.com/ScreamXY/K630W-RGB_VIA) QMK firmware on a VS11K28A controller. Flash it with the guide in that repository first. This fork does not support the stock K630 firmware (`320F:5000`), which uses its own protocol. The firmware has no VIA lighting panel: use the Fn shortcuts or the custom keys. The custom keys also switch Windows/Mac mode and the U.S./EurKEY profile. The firmware has no tap-hold or one-shot support, so those **Modifiers** presets do nothing on this keyboard.

To add a keyboard, copy its definition into `keyboards/v3/` (or `keyboards/v2/` for an old definition) and build again. The build checks each file with VIA's reader, replaces upstream entries with the same ID and updates the cache hash. Invalid files and duplicate IDs stop the build. Each build starts from an empty definitions folder, so removed files do not stay in the output.

## macOS keys

The **macOS** category has native Mission Control and Launchpad keys, screen brightness, media keys, Command and Option. It also has shortcut presets: Spotlight, App Exposé, desktop switching, screenshots, Lock Screen, Force Quit, emoji, app switching, full screen, hide, minimize, close, quit, find, save, and word and line navigation.

Native keys only work if the keyboard firmware and macOS support them. Shortcut presets use the default macOS shortcuts, so they change if you change them in System Settings or an app. Mission Control also has a Control-Up preset. A key in this UI does not add features to the firmware.

**Brightness − (F14)** and **Brightness + (F15)** work on the owner's Mac. The standard brightness keys (`KC_BRID`, `KC_BRIU`) are still in the list, but they did not work there; the cause is not known.

References: [QMK basic keycodes](https://docs.qmk.fm/keycodes_basic), [Apple keyboard shortcuts](https://support.apple.com/en-us/102650).

## Search and modifier keys

The search field above the key list searches all enabled categories, including custom keys. It matches names, descriptions, QMK codes, modifier symbols and aliases such as `cmd`, `option`, `screen +` and `KC_HYPR`. Exact matches come first. Clear the search or choose a category to browse again.

The **+ Custom keycode** dialog uses the same search. Type `hyper` or `meh` for the hold-only modifier, or choose a tap-hold or one-shot preset with the arrow keys and Enter. The dialog shows the QMK code and hex value before you confirm. A partial or unclear name does not count: choose a result from the list.

**Modifiers** has Hyper, Meh, Escape-tap with Hyper or Meh hold, Control/Escape, Shift/Enter and one-shot modifiers. They use the encodings from QMK's [modifier keys](https://docs.qmk.fm/feature_advanced_keycodes), [Mod-Tap](https://docs.qmk.fm/mod_tap) and [One Shot Keys](https://docs.qmk.fm/one_shot_keys) docs. Timing and one-shot behavior depend on the firmware settings.

## Tests

`npm test` checks the bundled definitions (IDs, layouts, encoders, K630W-RGB custom keys), the definition overlay (cache hash, invalid and duplicate files), category visibility, keycode search and keycode encoding for all VIA protocol versions. Test USB connection, key writes and macOS behavior by hand on a real keyboard.
