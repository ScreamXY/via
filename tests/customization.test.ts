import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {getBasicKeyDict} from '../src/utils/key-to-byte/dictionary-store';
import {
  getByteForCode,
  getKeycodes,
  categoriesForKeycodeModule,
  keycodeInMaster,
} from '../src/utils/key';
import {macOSKeycodes} from '../src/utils/macos-keycodes';
const require = createRequire(import.meta.url);
const {overlayDefinitions} = require('../scripts/overlay-definitions');

test('macOS category is visible for V3 default keycodes', () => {
  assert.ok(categoriesForKeycodeModule('default').includes('macos'));
  assert.deepEqual(
    getKeycodes().find((c) => c.id === 'macos')?.keycodes,
    macOSKeycodes,
  );
});

test('Mac presets encode valid firmware keycodes in every supported dictionary', () => {
  for (const protocol of [9, 10, 11, 12, 13]) {
    const dict = getBasicKeyDict(protocol, protocol === 13 ? 0 : undefined);
    for (const key of macOSKeycodes) {
      assert.ok(keycodeInMaster(key.code, dict), key.code);
      const value = getByteForCode(key.code, dict);
      assert.ok(
        Number.isInteger(value) && value > 0 && value <= 0xffff,
        key.code,
      );
    }
    assert.equal(getByteForCode('KC_MCTL', dict), 0xc1);
    assert.equal(getByteForCode('KC_LPAD', dict), 0xc2);
    assert.equal(getByteForCode('LGUI(KC_SPC)', dict), 0x082c);
    assert.equal(getByteForCode('LGUI(LSFT(KC_4))', dict), 0x0a21);
    assert.equal(getByteForCode('LCTL(LGUI(KC_Q))', dict), 0x0914);
  }
});

test('bundled definitions include both exact R75 IDs, layouts and encoders', () => {
  const index = JSON.parse(
    fs.readFileSync('public/definitions/supported_kbs.json', 'utf8'),
  );
  for (const id of [0x342de484, 0x342de487, 0x34340311, 0x34340313]) {
    assert.ok(index.vendorProductIds.v3.includes(id));
    const def = JSON.parse(
      fs.readFileSync(`public/definitions/v3/${id}.json`, 'utf8'),
    );
    assert.equal(def.vendorProductId, id);
    assert.ok(def.layouts.keys.length > 60);
    // The wireless R75 encoder belongs to an optional layout.
    assert.match(JSON.stringify(def.layouts), /"ei":0/);
  }
});

test('local definitions override upstream and invalidate its cache hash', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'via-definitions-'));
  try {
    fs.writeFileSync(
      path.join(root, 'supported_kbs.json'),
      JSON.stringify({vendorProductIds: {v2: [123], v3: [456, 0x342de487]}}),
    );
    fs.writeFileSync(path.join(root, 'hash.json'), '"upstream"');
    overlayDefinitions(path.resolve('keyboards'), root);
    const index = JSON.parse(
      fs.readFileSync(path.join(root, 'supported_kbs.json'), 'utf8'),
    );
    assert.deepEqual(index.vendorProductIds.v2, [123]);
    assert.ok(index.vendorProductIds.v3.includes(456));
    assert.equal(
      index.vendorProductIds.v3.filter((id: number) => id === 0x342de487)
        .length,
      1,
    );
    const first = fs.readFileSync(path.join(root, 'hash.json'), 'utf8');
    assert.notEqual(first, '"upstream"');
    fs.writeFileSync(path.join(root, 'hash.json'), '"upstream"');
    overlayDefinitions(path.resolve('keyboards'), root);
    assert.equal(fs.readFileSync(path.join(root, 'hash.json'), 'utf8'), first);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('invalid or duplicate local definitions fail before modifying output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'via-invalid-'));
  try {
    const source = path.join(root, 'source');
    fs.mkdirSync(path.join(source, 'v3'), {recursive: true});
    fs.writeFileSync(
      path.join(root, 'supported_kbs.json'),
      JSON.stringify({vendorProductIds: {v2: [], v3: []}}),
    );
    fs.writeFileSync(path.join(root, 'hash.json'), '"original"');
    fs.writeFileSync(path.join(source, 'v3', 'invalid.json'), '{}');
    assert.throws(() => overlayDefinitions(source, root));
    fs.rmSync(path.join(source, 'v3', 'invalid.json'));
    for (const file of ['one.json', 'two.json']) {
      fs.copyFileSync(
        'keyboards/v3/r75-wireless.json',
        path.join(source, 'v3', file),
      );
    }
    assert.throws(() => overlayDefinitions(source, root), /Duplicate/);
    assert.equal(
      fs.readFileSync(path.join(root, 'hash.json'), 'utf8'),
      '"original"',
    );
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});

test('modifier presets encode Hyper, Meh, tap-hold and one-shot values', async () => {
  const {modifierKeycodes} = await import('../src/utils/modifier-keycodes');
  const {resolveKeycodeInput, searchKeycodes, withKeycodeAliases} =
    await import('../src/utils/keycode-search');
  for (const protocol of [9, 10, 11, 12, 13]) {
    const dict = getBasicKeyDict(protocol, 0);
    const items = withKeycodeAliases(
      getKeycodes().flatMap((c) => c.keycodes),
      dict,
    );
    assert.equal(resolveKeycodeInput('hyper', dict, items)?.value, 0x0f00);
    assert.equal(resolveKeycodeInput('KC_HYPR', dict, items)?.value, 0x0f00);
    assert.equal(resolveKeycodeInput('meh', dict, items)?.value, 0x0700);
    assert.equal(
      resolveKeycodeInput('MT(MOD_HYPR,KC_ESC)', dict, items)?.value,
      dict._QK_MOD_TAP | 0x0f29,
    );
    assert.equal(
      resolveKeycodeInput('sticky hyper', dict, items)?.value,
      dict._QK_ONE_SHOT_MOD | 15,
    );
    for (const key of modifierKeycodes) {
      assert.ok(resolveKeycodeInput(key.code, dict, items), key.code);
    }
    assert.equal(searchKeycodes(items, 'hyper')[0].code, 'HYPR(KC_NO)');
    assert.equal(searchKeycodes(items, 'KC_HYPR')[0].code, 'HYPR(KC_NO)');
    assert.ok(
      searchKeycodes(items, 'brightness down').some((k) => k.code === 'KC_F14'),
    );
    assert.ok(
      searchKeycodes(items, 'screen +').some((k) => k.code === 'KC_F15'),
    );
    assert.ok(
      searchKeycodes(items, 'command').some((k) => k.code === 'KC_LGUI'),
    );
    assert.equal(
      new Set(searchKeycodes(items, '').map((k) => k.code)).size,
      searchKeycodes(items, '').length,
    );
    for (const input of [
      'hyp',
      'nonsense',
      '0x10000',
      '-1',
      'HYPR(KC_FAKE)',
      'MO(bogus)',
      'MO(999)',
      'MT(MOD_HYPR,KC_TILD)',
      'HYPR(KC_A',
      'HYPR(KC_A))',
      '_QK_MODS',
    ]) {
      assert.equal(resolveKeycodeInput(input, dict, items), null, input);
    }
    assert.equal(resolveKeycodeInput('0x0000', dict, items)?.value, 0);
    assert.equal(resolveKeycodeInput('KC_NO', dict, items)?.value, 0);
    assert.equal(
      resolveKeycodeInput('LGUI(LSFT(KC_4))', dict, items)?.value,
      0x0a21,
    );
  }
});

test('V3 Any suggestions include default keys even with only lighting modules', async () => {
  const {getKeycodesForKeyboard} = await import('../src/utils/key');
  const definition = JSON.parse(
    fs.readFileSync('public/definitions/v3/875422855.json', 'utf8'),
  );
  const codes = getKeycodesForKeyboard(definition, 12).map((key) => key.code);
  for (const code of [
    'KC_A',
    'HYPR(KC_NO)',
    'MEH(KC_NO)',
    'KC_F14',
    'KC_F15',
  ]) {
    assert.ok(codes.includes(code), code);
  }
});

test('search preserves aliases from duplicate keycodes', async () => {
  const {searchKeycodes} = await import('../src/utils/keycode-search');
  const keys = [
    {name: 'F14', code: 'KC_F14'},
    {name: 'Brightness down', code: 'KC_F14', aliases: ['screen -']},
  ];
  assert.equal(searchKeycodes(keys, 'screen -')[0]?.code, 'KC_F14');
  assert.equal(searchKeycodes(keys, 'brightness down').length, 1);
});
