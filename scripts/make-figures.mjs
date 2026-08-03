// Собирает src/data/figures.json — крошечную выжимку из каталогов: только
// звёзды самой фигуры каждого объекта и линии между ними.
//
// Полные каталоги весят больше мегабайта на все 33 объекта, и грузить их
// при открытии страницы незачем: сразу нужны миниатюры ленты (это и есть
// фигуры) и первый объект. Приложение показывает фигуру из этой выжимки,
// а полный каталог подтягивает по требованию.
//
//   node scripts/make-figures.mjs

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/data/figures.json');

const round = (v, digits) => Number(v.toFixed(digits));

async function main() {
    const targets = JSON.parse(await readFile(join(ROOT, 'src/data/targets.json'), 'utf8'));
    const out = {};
    let stars = 0;

    for (const target of targets) {
        const catalogPath = join(ROOT, `src/data/catalogs/${target.id}.json`);
        if (!existsSync(catalogPath)) continue;
        const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
        const linesPath = join(ROOT, `src/data/lines/${target.id}.json`);
        const lines = existsSync(linesPath)
            ? JSON.parse(await readFile(linesPath, 'utf8'))
            : [];

        // фигура — вершины линий и всё именованное; каталог отсортирован
        // по яркости, значит и выжимка останется отсортированной
        const linked = new Set(lines.flat());
        const keep = catalog
            .map((s, i) => ({ s, i }))
            .filter(({ s, i }) => linked.has(i) || s.name);

        // индексы линий пересчитываем в новую нумерацию
        const remap = new Map(keep.map(({ i }, k) => [i, k]));
        out[target.id] = {
            stars: keep.map(({ s }) => ({
                ra: round(s.ra, 5),
                dec: round(s.dec, 5),
                mag: round(s.mag, 2),
                ...(s.name ? { name: s.name } : {}),
            })),
            lines: lines
                .map(([a, b]) => [remap.get(a), remap.get(b)])
                .filter(([a, b]) => a !== undefined && b !== undefined),
        };
        stars += keep.length;
    }

    await writeFile(OUT, JSON.stringify(out));
    const kb = Math.round(JSON.stringify(out).length / 1024);
    console.log(`• фигуры: ${Object.keys(out).length} объектов, ${stars} звёзд, ${kb} КБ`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
