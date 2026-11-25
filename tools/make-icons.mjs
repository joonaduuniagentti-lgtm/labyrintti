// Kehitystyökalu: luo icons/-kansion PNG-ikonit.
// Vaatii Playwrightin ja Chromen. Aja repon juuresta: node tools/make-icons.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const p = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!p.startsWith(root)) throw new Error('forbidden');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome' });
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/tools/icon.html`);
await page.waitForFunction(() => window.iconReady);
await mkdir(join(root, 'icons'), { recursive: true });
const outputs = [
  ['icon-192.png', 192, true],
  ['icon-512.png', 512, true],
  ['icon-maskable-512.png', 512, false],
  ['apple-touch-icon.png', 180, false],
];
for (const [name, size, rounded] of outputs) {
  const url = await page.evaluate(([n, r]) => window.drawIcon(n, { rounded: r }), [size, rounded]);
  await writeFile(join(root, 'icons', name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('kirjoitettu', name);
}
await browser.close();
server.close();
