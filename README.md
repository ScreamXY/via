# Keyspace — personal VIA

A local customization of [the VIA web app](https://github.com/the-via/app), with bundled keyboard definitions and a macOS key category. The upstream GPL-3.0 license is retained in [LICENSE](LICENSE).

## Workspace design

Graphite and mint surfaces, system typography, labeled navigation and light/dark modes frame the keyboard preview. The preview scales with window height. The key library uses wrapping cards for names, QMK codes and descriptions; no fixed-height text clipping or ellipsis is used in these cards. In the 2D preview, a keycap legend too wide for its key shrinks to fit (down to 9 px), and hovering still shows the full name. Keyboard keycap themes remain independently selectable.

The custom-keycode dialog, search field, layer controls and device selectors follow the same visual style. UI-only browser fixtures in `tests/ui-design.playwright.js` and `tests/ui-search.playwright.js` check responsive card bounds and search/dialog behavior without physical keyboard writes.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:5173 in Chrome or Edge, connect the keyboard by USB, and authorize it. The bundled keyboards do not require a Design-tab import. Browser authorization is still required for each site origin.

```sh
npm run build  # production files in dist/
npm test      # run after building the definitions
npm run preview  # serve the production build locally
```

Host the contents of `dist/` at the root of an HTTPS origin. VIA currently uses absolute paths for its definition database; hosting under a repository subpath requires further changes. WebHID needs a supported browser and HTTPS or localhost.

## Internal hosting

`make publish` builds and tests the committed source, then publishes amd64 and
arm64 images to `ghcr.io/screamxy/via` with `latest`, a commit tag and revision
label. Docker uses the existing GHCR credential helper.

The runtime serves port 8080 as UID 1000 with a read-only root and writable
`/data` and `/config` tmpfs directories. Client routes are rewritten to the app;
missing assets and definitions return 404. Keyboard definitions are built into
the image, and no keyboard devices need to be attached to the server.

[ScreamXY/internal-apps](https://github.com/ScreamXY/internal-apps) owns Compose
and the portal link at <https://scream-server.story-ling.ts.net:10443/>.
Tailscale Serve provides HTTPS on the personal tailnet. Connect the keyboard
to the computer running Chrome or Edge and authorize it on this origin.

## Bundled keyboards

| Keyboard                               | VID:PID     | Definition source                                                                                      |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| Royal Kludge R75 Wired                 | `342D:E484` | `R75 Wired Windows QMK.json`                                                                           |
| Royal Kludge R75 Wireless / R75Pro     | `342D:E487` | `R75 Wireless Windows QMK.json`                                                                        |
| Keychron V1 ANSI Knob                  | `3434:0311` | `US Knob v1.7.json.zip`                                                                                |
| Keychron V1 ISO Knob                   | `3434:0313` | `ISO Knob v1.3.json.zip`                                                                               |
| Redragon K630W-RGB VS11K28A (QMK port) | `5244:0630` | [`via/k630-vs11k28a.json`](https://github.com/ScreamXY/K630W-RGB_VIA/blob/main/via/k630-vs11k28a.json) |

The original definition files are copied unchanged into `keyboards/v3/` from the owner's keyboard collection, or from [ScreamXY/K630W-RGB_VIA](https://github.com/ScreamXY/K630W-RGB_VIA) for the K630W-RGB. The Windows filenames identify the vendor downloads; these are keyboard definitions usable by the browser on macOS too. Saved `*.layout.json` keymaps are not definitions and are not automatically applied.

The R75 wireless definition includes a selectable knob layout. Choose the appropriate layout in VIA if needed.

The K630W-RGB definition requires the experimental [K630W-RGB_VIA](https://github.com/ScreamXY/K630W-RGB_VIA) QMK firmware on a VS11K28A controller; flash it using that repository's guide first. Stock K630 firmware (`320F:5000`) uses a vendor-specific protocol that this fork does not support. This firmware has no VIA lighting panel: use the Fn shortcuts or the definition's custom keys, which also switch Windows/Mac mode and the U.S./EurKEY profile. It has no tap-hold or one-shot support, so those **Modifiers** presets do nothing on this keyboard.

To bundle another keyboard, put its manufacturer definition in `keyboards/v3/` (or `keyboards/v2/` for an older definition) and rebuild. The build validates definitions using VIA's reader, overlays matching IDs in the upstream database, and updates the cache hash. Invalid definitions and duplicate local IDs fail the build. Every build starts with a fresh generated database, so removed definitions cannot remain accidentally bundled.

## macOS keys

The **macOS** category includes native Mission Control and Launchpad keycodes, screen brightness, media controls, Command and Option, plus shortcut presets for Spotlight, App Exposé, desktop switching, screenshots, Lock Screen, Force Quit, emoji and editing.

Native consumer keys need keyboard firmware and OS support. Shortcut presets use standard macOS bindings and can differ if System Settings or an app overrides them. Mission Control also has a Control-Up shortcut preset. Adding a key to VIA's UI does not add firmware capabilities or restore OS features removed by Apple.

References: [QMK basic keycodes](https://docs.qmk.fm/keycodes_basic), [Apple keyboard shortcuts](https://support.apple.com/en-us/102650).

## Search and modifier keys

Search above the key palette filters across all enabled categories, including custom keys. Names, descriptions, QMK codes, modifier symbols and aliases such as `cmd`, `option`, `screen +` and `KC_HYPR` are matched; exact matches rank first. Clear the search or choose a category to return to browsing.

The **Any** dialog uses the same search. Type `hyper` or `meh` to resolve the hold-only modifier, or select a tap/hold or one-shot variant with the arrow keys and Enter. The dialog shows the resolved QMK expression and hex value before confirmation. Partial or ambiguous names require selecting a result.

**Modifiers** includes Hyper, Meh, tap-Escape/hold-Hyper, tap-Escape/hold-Meh, Control/Escape, Shift/Enter and one-shot modifiers. These use the encodings documented in [QMK's modifier reference](https://docs.qmk.fm/feature_advanced_keycodes), [Mod-Tap](https://docs.qmk.fm/mod_tap) and [One Shot Keys](https://docs.qmk.fm/one_shot_keys). Timing and one-shot behavior depend on firmware settings.

The macOS category also includes app switching, full screen, hide/minimize/close/quit, find/save, word navigation/deletion and line navigation. **Brightness − (F14)** and **Brightness + (F15)** are alternatives confirmed working by the owner on their Mac. The standard consumer brightness codes remain available; their reported failure has not been diagnosed at the firmware/OS/display level.

## Validation

Production build and focused tests cover definition conversion, both R75 IDs, the K630W-RGB custom keycode mapping, encoder layout preservation, cache invalidation, invalid/duplicate definitions, category visibility and keycode encoding across VIA protocol dictionaries. USB connection, writes and macOS behavior on physical keyboards still need manual verification.
