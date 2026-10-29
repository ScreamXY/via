// Run on a fresh isolated page served by npm run dev with playwright-cli run-code --filename=tests/ui-library-hover.playwright.js
async (page) => {
  await page.setViewportSize({width: 1280, height: 900});
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
      'position:fixed;inset:400px 0 0;z-index:100;background:#222;display:grid;grid-template-columns:180px 1fr;color:white';
    document.body.append(host);
    createRoot(host).render(
      React.createElement(
        Provider,
        {store: fixture},
        React.createElement(KeycodePane),
      ),
    );
  });
  await page.getByRole('button', {name: 'Special', exact: true}).click();
  await page
    .locator('#via-test-host button[aria-label]')
    .last()
    .evaluate((el) => {
      let scroll = el.parentElement;
      while (scroll && getComputedStyle(scroll).overflowY !== 'auto') {
        scroll = scroll.parentElement;
      }
      scroll.setAttribute('data-library-scroll', '');
    });
  let checks = 0;
  const results = [];
  for (const width of [1280, 768]) {
    await page.setViewportSize({width, height: 900});
    for (const fraction of [0.5, 1]) {
      await page.mouse.move(0, 0);
      await page.locator('[data-library-scroll]').evaluate((el, fraction) => {
        el.scrollTop = (el.scrollHeight - el.clientHeight) * fraction;
      }, fraction);
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      const target = await page.evaluate(() => {
        const scroll = document.querySelector('[data-library-scroll]');
        const bounds = scroll.getBoundingClientRect();
        const el = [
          ...scroll.querySelectorAll('button[aria-label]:not(:disabled)'),
        ]
          .reverse()
          .find((el) => {
            const r = el.getBoundingClientRect();
            return r.top > bounds.top + 2 && r.bottom < bounds.bottom - 2;
          });
        if (!el) throw new Error('No visible card');
        document
          .querySelector('[data-hover-card]')
          ?.removeAttribute('data-hover-card');
        el.setAttribute('data-hover-card', '');
        const r = el.getBoundingClientRect();
        return {
          x: r.x,
          y: r.y,
          w: r.width,
          h: r.height,
          top: scroll.scrollTop,
          height: scroll.scrollHeight,
        };
      });
      for (const [x, y] of [
        [target.x + 1, target.y + target.h / 2],
        [target.x + target.w - 1, target.y + target.h / 2],
        [target.x + target.w / 2, target.y + 1],
        [target.x + target.w / 2, target.y + target.h - 1],
      ]) {
        await page.mouse.move(x, y);
        const stable = await page.evaluate(
          (target) =>
            new Promise((resolve) => {
              let frames = 0;
              let stable = true;
              const sample = () => {
                const scroll = document.querySelector('[data-library-scroll]');
                const r = document
                  .querySelector('[data-hover-card]')
                  .getBoundingClientRect();
                stable =
                  stable &&
                  scroll.scrollHeight === target.height &&
                  Math.abs(scroll.scrollTop - target.top) < 1 &&
                  Math.abs(r.y - target.y) < 1 &&
                  Math.abs(r.x - target.x) < 1;
                if (++frames < 20) {
                  requestAnimationFrame(sample);
                } else {
                  resolve(stable);
                }
              };
              requestAnimationFrame(sample);
            }),
          target,
        );
        if (!stable)
          throw new Error(
            `Library moved at width ${width}, scroll ${fraction}`,
          );
        checks++;
      }
      results.push({
        width,
        scrollFraction: fraction,
        scrollHeight: target.height,
      });
    }
  }
  return {checks, results};
};
