const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {overlayDefinitions} = require('./overlay-definitions');

// Always rebuild so removed local definitions cannot survive in generated output.
const output = path.resolve('public/definitions');
fs.rmSync(output, {recursive: true, force: true});
execFileSync(
  process.execPath,
  [
    '--import',
    'tsx',
    'node_modules/via-keyboards/scripts/build-all.ts',
    output,
  ],
  {stdio: 'inherit'},
);
overlayDefinitions(path.resolve('keyboards'), output);
