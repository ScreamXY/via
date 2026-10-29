async (page) => {
  await page.setViewportSize({width: 1440, height: 1000});
  await page.evaluate(async () => {
    const {default: React} = await import('/node_modules/.vite/deps/react.js');
    const {
      default: {createRoot},
    } = await import('/node_modules/.vite/deps/react-dom_client.js');
    const {Provider} = await import('/node_modules/.vite/deps/react-redux.js');
    const {store} = await import('/src/store/index.ts');
    const {ConfigurePane} = await import('/src/components/panes/configure.tsx');
    const {CanvasRouter} =
      await import('/src/components/two-string/canvas-router.tsx');
    const {UnconnectedGlobalMenu} =
      await import('/src/components/menus/global.tsx');
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
      [device.path]: Array.from({length: 4}, () => ({
        keymap: Array.from({length: 90}, (_, i) =>
          i < 15 ? 58 + i : 4 + (i % 26),
        ),
        isLoaded: true,
      })),
    };
    state.keymap.selectedKey = null;
    state.keymap.numberOfLayers = 4;
    const {HID} = await import('/src/shims/node-hid.ts');
    HID._cache['test-only'] = {
      ...device,
      _device: {
        opened: true,
        sendReport: () => {
          throw new Error('Unexpected HID write in UI test');
        },
      },
      productName: 'R75Pro',
    };
    const fixture = {
      getState: () => state,
      subscribe: () => () => {},
      dispatch: () => {},
    };
    document.querySelector('#root').style.display = 'none';
    document.querySelector('#design-fixture')?.remove();
    const host = document.createElement('div');
    host.id = 'design-fixture';
    host.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;background:var(--ui-canvas)';
    document.body.append(host);
    createRoot(host).render(
      React.createElement(
        Provider,
        {store: fixture},
        React.createElement(
          React.Fragment,
          null,
          React.createElement(UnconnectedGlobalMenu),
          React.createElement(CanvasRouter),
          React.createElement(ConfigurePane),
        ),
      ),
    );
  });
  await page.getByRole('searchbox', {name: 'Search all keycodes'}).waitFor();
  await page.getByRole('button', {name: 'Special', exact: true}).click();
  await page.screenshot({path: '/tmp/via-design-desktop.png'});
  const checks = [];
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({width, height: 900});
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    checks.push(
      await page.evaluate(() => {
        const cards = [
          ...document.querySelectorAll('#design-fixture button[aria-label]'),
        ];
        const clipped = cards
          .filter(
            (el) =>
              el.scrollWidth > el.clientWidth + 2 ||
              el.scrollHeight > el.clientHeight + 2,
          )
          .map((el) => el.getAttribute('aria-label'));
        return {width: innerWidth, cards: cards.length, clipped};
      }),
    );
  }
  await page.screenshot({path: '/tmp/via-design-compact.png'});
  if (checks.some((c) => c.clipped.length))
    throw new Error(JSON.stringify(checks));
  return checks;
};
