// Baixa a base de ratings do FC (página pública https://www.ea.com/games/ea-sports-fc/ratings).
// Cada página (100 jogadores) é salva em data-raw/pages; rodar de novo só baixa o que falta.
// Uso: node scripts/fetch-ea.mjs [--force]
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PAGES_DIR = path.join(ROOT, 'data-raw', 'pages');
const RATINGS_URL = 'https://www.ea.com/games/ea-sports-fc/ratings';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const CONCURRENCY = 4;
const force = process.argv.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getText(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt >= 4) throw new Error(`${url}: ${err.message}`);
      await sleep(1000 * attempt);
    }
  }
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(PAGES_DIR, { recursive: true });

  const html = await getText(RATINGS_URL);
  const buildId = html.match(/"buildId":"([^"]+)"/)?.[1];
  const nextData = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!buildId || !nextData) throw new Error('Não achei buildId/__NEXT_DATA__ na página da EA');

  const pageProps = JSON.parse(nextData).props.pageProps;
  const total = pageProps.ratingDetails.totalItems;
  const pageCount = Math.ceil(total / 100);
  console.log(`buildId=${buildId} jogadores=${total} páginas=${pageCount}`);

  await writeFile(path.join(ROOT, 'data-raw', 'filters.json'), JSON.stringify(pageProps.ratingsFilters));
  await writeFile(path.join(PAGES_DIR, 'page-1.json'), JSON.stringify(pageProps.ratingDetails.items));

  const pending = [];
  for (let p = 2; p <= pageCount; p++) {
    if (force || !(await exists(path.join(PAGES_DIR, `page-${p}.json`)))) pending.push(p);
  }

  let done = 0;
  async function worker() {
    while (pending.length) {
      const p = pending.shift();
      const url = `https://www.ea.com/_next/data/${buildId}/games/ea-sports-fc/ratings.json?franchiseSlug=ea-sports-fc&page=${p}`;
      const json = JSON.parse(await getText(url));
      const items = json.pageProps.ratingDetails.items;
      await writeFile(path.join(PAGES_DIR, `page-${p}.json`), JSON.stringify(items));
      done++;
      if (done % 20 === 0) console.log(`  ${done} páginas baixadas`);
      await sleep(150);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  await writeFile(
    path.join(ROOT, 'data-raw', 'meta.json'),
    JSON.stringify({ buildId, total, pageCount, fetchedAt: new Date().toISOString() }),
  );
  console.log('ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
