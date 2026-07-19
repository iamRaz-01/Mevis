import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const type = process.argv[2];
const name = process.argv[3];

if (!type || !name) {
  console.error('Usage: node generate-project.js [service | app | package] <name>');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
let targetDir = '';
let packageName = '';

if (type === 'service') {
  targetDir = path.join(rootDir, 'services', name);
  packageName = `@mevis/${name}-service`;
} else if (type === 'app') {
  targetDir = path.join(rootDir, 'apps', name);
  packageName = `@mevis/${name}-app`;
} else if (type === 'package') {
  targetDir = path.join(rootDir, 'packages', name);
  packageName = `@mevis/${name}`;
} else {
  console.error(`Invalid project type: ${type}. Must be service, app, or package.`);
  process.exit(1);
}

if (fs.existsSync(targetDir)) {
  console.error(`Directory already exists: ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

// Create package.json
const pkgJson = {
  name: packageName,
  version: '1.0.0',
  private: true,
  description: `MEVIS generated ${type} stub for ${name}`,
  main: './dist/src/index.js',
  types: './dist/src/index.d.ts',
  scripts: {
    build: 'tsc',
    typecheck: 'tsc --noEmit',
  },
  dependencies: {
    '@mevis/core': '^1.0.0',
    '@mevis/shared-types': '^1.0.0',
  },
};
fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

// Create tsconfig.json
const tsconfig = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    outDir: './dist',
    rootDir: './',
  },
  include: ['src/**/*'],
  references: [{ path: '../../packages/shared-types' }, { path: '../../packages/core' }],
};
// Adjust relative path depth for package
if (type === 'package') {
  tsconfig.extends = '../../tsconfig.base.json';
  tsconfig.references = [{ path: '../shared-types' }, { path: '../core' }];
}
fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

// Create dummy source file src/index.ts
const srcCode = `import { validateEntity } from '@mevis/core';
import { Entity } from '@mevis/shared-types';

console.log('Successfully loaded generated module ${packageName}!');
`;
fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), srcCode);

console.log(`Successfully generated ${type} stub under ${targetDir}`);
console.log('To start, run: npm install && npm run build');
