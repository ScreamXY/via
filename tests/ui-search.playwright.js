// Run on a fresh isolated page served by npm run dev with playwright-cli run-code --filename=tests/ui-search.playwright.js
async (page) => {
  await page.evaluate(async () => {
    const {default: React} = await import('/node_modules/.vite/deps/react.js');
    const {
      default: {createRoot},
    } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const {Provider} = await import('/node_modules/.vite/deps/react-redux.js');
    const {store} = await import('/src/store/index.ts');
    const {KeycodePane} =
      await import('/src/components/panes/configure-panes/keycode.tsx');
    const def = await (await fetch('/definitions/v3/875422855.json')).json();
    const state = structuredClone(store.getState());
    const device = {
      path: 'test-only',
      vendorProductId: 875422855,
      protocol: 12,
      requiredDefinitionVersion: 'v3',
    };
    state.devices.selectedDevicePath = device.path;
    state.devices.connectedDevicePaths = {[device.path]: device};
    state.definitions.definitions = {875422855: {v3: def}};
    state.keymap.rawDeviceMap = {
      [device.path]: [{keymap: Array(90).fill(0), isLoaded: true}],
    };
    state.keymap.selectedKey = null;
    // UI-only Redux fixture. No thunks or HID APIs are executed.
    const fixture = (window.viaTestFixture = {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: () => {},
    });
    document.querySelector('#via-test-host')?.remove();
    const host = document.createElement('div');
    host.id = 'via-test-host';
    host.style.cssText =
      'position:fixed;inset:0;z-index:100;background:#222;display:grid;grid-template-columns:180px 1fr;color:white';
    document.body.append(host);
    createRoot(host).render(
      React.createElement(
        Provider,
        {store: fixture},
        React.createElement(KeycodePane),
      ),
    );
  });
  const search = page.getByRole('searchbox', {name: 'Search all keycodes'});
  await search.fill('hyper');
  await page
    .getByRole('button', {name: 'Hyper: HYPR(KC_NO)', exact: true})
    .waitFor();
  await search.fill('screen +');
  await page
    .getByRole('button', {name: 'Brightness + (F15): KC_F15', exact: true})
    .waitFor();
  await search.fill('zzzznomatch');
  await page
    .getByRole('status')
    .filter({hasText: 'No matching keys'})
    .waitFor();
  await page.getByRole('button', {name: 'Clear', exact: true}).click();
  // Mount the dialog with a mock confirmation callback; no keyboard writes.
  await page.evaluate(async () => {
    const {default: React} = await import('/node_modules/.vite/deps/react.js');
    const {
      default: {createRoot},
    } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const {Provider} = await import('/node_modules/.vite/deps/react-redux.js');
    const {KeycodeModal} =
      await import('/src/components/inputs/custom-keycode-modal.tsx');
    const host = document.createElement('div');
    document.body.append(host);
    host.style.cssText = 'position:fixed;inset:0;z-index:200';
    createRoot(host).render(
      React.createElement(
        Provider,
        {store: window.viaTestFixture},
        React.createElement(KeycodeModal, {
          onExit: () => {},
          onConfirm: (value) => {
            window.viaTestConfirmed = value;
          },
        }),
      ),
    );
  });
  const input = page.getByRole('combobox', {name: 'Keycode, name or alias'});
  await input.fill('hyper');
  await page
    .getByRole('option')
    .filter({hasText: 'Hold Control + Shift + Option + Command'})
    .waitFor();
  await page.getByRole('button', {name: 'Confirm', exact: true}).click();
  if ((await page.evaluate(() => window.viaTestConfirmed)) !== 0x0f00)
    throw new Error('Hyper encoded incorrectly');
  await input.fill('meh');
  await input.press('ArrowDown');
  await input.press('Enter');
  if ((await input.inputValue()) !== 'MEH(KC_NO)')
    throw new Error('Keyboard suggestion selection failed');
  await input.fill('KC_FAKE');
  if (
    await page.getByRole('button', {name: 'Confirm', exact: true}).isEnabled()
  )
    throw new Error('Invalid code accepted');
  await input.fill('brightness down');
  await page.getByRole('option').filter({hasText: 'KC_F14'}).waitFor();
  if (
    await page.getByRole('button', {name: 'Confirm', exact: true}).isEnabled()
  )
    throw new Error('Ambiguous brightness accepted');
  return 'Palette search, aliases, empty state, clear; Any Hyper confirmation, keyboard selection, invalid and ambiguous inputs passed (no HID)';
};
