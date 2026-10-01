import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const nativePattern = /<el-(table|dialog|drawer|form|card|button|input|select|date-picker|upload|empty|dropdown|popover|tooltip|pagination|tag|tabs)\b/g;
const adapterPattern = /<Ui[A-Z][A-Za-z]+\b/g;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.name.endsWith('.vue')) files.push(path);
  }
  return files;
}

const files = await walk(root);
let nativeCount = 0;
let adapterCount = 0;
const nativeFiles = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const nativeMatches = source.match(nativePattern) || [];
  const adapterMatches = source.match(adapterPattern) || [];
  nativeCount += nativeMatches.length;
  adapterCount += adapterMatches.length;
  if (nativeMatches.length) nativeFiles.push({ file: relative(root, file).replaceAll('\\', '/'), count: nativeMatches.length });
}

console.log(`[animal-theme] Vue files scanned: ${files.length}`);
console.log(`[animal-theme] Native Element usage: ${nativeCount} tags in ${nativeFiles.length} files`);
console.log(`[animal-theme] UiKit usage: ${adapterCount} tags`);
if (nativeFiles.length) {
  console.log('[animal-theme] Migration inventory (high traffic pages first):');
  nativeFiles.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file)).slice(0, 30).forEach(item => console.log(`  ${item.count.toString().padStart(3)}  ${item.file}`));
}
