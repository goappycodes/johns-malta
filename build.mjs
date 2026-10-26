import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
for (const file of ['home-1/app.js', 'home-1/navigation.js', 'home-2/js/app.js', 'home-2/js/data.js']) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}
fs.mkdirSync(output, { recursive: true });
for (const route of ['home-1', 'home-2']) {
  fs.cpSync(path.join(root, route), path.join(output, route), { recursive: true });
  if (!fs.existsSync(path.join(output, route, 'index.html'))) throw new Error(`Missing entry point: ${route}`);
}
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
console.log('Built both designs: /home-1/ (Codex) and /home-2/ (Claude).');
