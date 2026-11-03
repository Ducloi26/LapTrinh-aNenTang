const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

// Root defaults, backend-specific overrides, then explicit process environment.
function loadConfig(root = path.resolve(__dirname, '..'), env = process.env) {
  const read = (file) => fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
  return { ...read(path.join(root, '.env')), ...read(path.join(root, 'backend', '.env')), ...env };
}
module.exports = { loadConfig };
