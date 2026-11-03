import { existsSync, lstatSync, realpathSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = path.join(root, 'node_modules');
const uiSource = path.join(root, 'vendor/openchamber/packages/ui/src');
const uiModules = path.join(root, 'vendor/openchamber/packages/ui/node_modules');

if (!existsSync(uiSource)) {
  throw new Error('Pinned upstream source is missing. Run git submodule update --init --recursive.');
}

if (!existsSync(modules)) {
  throw new Error('Root node_modules is missing; run npm install first.');
}

if (existsSync(uiModules)) {
  const stats = lstatSync(uiModules);
  if (stats.isSymbolicLink()) {
    const currentTarget = realpathSync(uiModules);
    const expectedTarget = realpathSync(modules);
    if (currentTarget !== expectedTarget) {
      throw new Error(`Refusing to replace unexpected UI node_modules link: ${currentTarget}`);
    }
    process.exit(0);
  }

  throw new Error('Unexpected vendor UI node_modules directory already exists.');
}

symlinkSync(modules, uiModules, process.platform === 'win32' ? 'junction' : 'dir');
