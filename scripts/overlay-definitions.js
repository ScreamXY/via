const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {
  keyboardDefinitionV2ToVIADefinitionV2,
  keyboardDefinitionV3ToVIADefinitionV3,
} = require('@the-via/reader');

function overlayDefinitions(source, output) {
  const indexPath = path.join(output, 'supported_kbs.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const hash = createHash('sha256');
  hash.update(fs.readFileSync(path.join(output, 'hash.json')));
  // Validate everything before changing the generated database.
  const definitions = [];
  for (const [version, convert] of [
    ['v2', keyboardDefinitionV2ToVIADefinitionV2],
    ['v3', keyboardDefinitionV3ToVIADefinitionV3],
  ]) {
    const directory = path.join(source, version);
    const seen = new Set();
    if (!fs.existsSync(directory)) {
      continue;
    }
    for (const file of fs
      .readdirSync(directory)
      .filter((f) => f.endsWith('.json'))
      .sort()) {
      const definition = convert(
        JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')),
      );
      if (seen.has(definition.vendorProductId)) {
        throw new Error(`Duplicate ${version} keyboard ID in ${file}`);
      }
      seen.add(definition.vendorProductId);
      definitions.push({version, definition});
    }
  }
  for (const {version, definition} of definitions) {
    const json = JSON.stringify(definition);
    const id = definition.vendorProductId;
    fs.mkdirSync(path.join(output, version), {recursive: true});
    fs.writeFileSync(path.join(output, version, `${id}.json`), json);
    index.vendorProductIds[version] = [
      ...new Set([...index.vendorProductIds[version], id]),
    ].sort((a, b) => a - b);
    hash.update(version).update(json);
    console.log(`Bundled ${definition.name} (${version}, ${id})`);
  }
  fs.writeFileSync(indexPath, JSON.stringify(index));
  fs.writeFileSync(
    path.join(output, 'hash.json'),
    JSON.stringify(hash.digest('hex')),
  );
}
module.exports = {overlayDefinitions};
