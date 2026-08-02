// Выгружает звёздные каталоги из VizieR для каждого объекта из src/data/targets.json
// и раскладывает их в src/data/catalogs/<id>.json. Файлы не коммитятся:
// сборка (в том числе в GitHub Actions) получает данные сама.
//
//   node scripts/fetch-catalogs.mjs           — скачать недостающее
//   node scripts/fetch-catalogs.mjs --force   — перекачать всё

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS_PATH = join(ROOT, 'src/data/targets.json');
const OUT_DIR = join(ROOT, 'src/data/catalogs');
const PHOTO_DIR = join(ROOT, 'src/data/photos');

/** Сервис CDS рендерит участок неба в гномонической (TAN) проекции —
 *  той же, в которой строится эскиз, поэтому подложка совпадает со звёздами
 *  без ручной калибровки */
const HIPS2FITS = 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits';
const PHOTO_PX = 900;

const SOURCES = {
    gaia: {
        table: 'I/355/gaiadr3',
        columns: ['RA_ICRS', 'DE_ICRS', 'Gmag'],
        magColumn: 'Gmag',
    },
    hipparcos: {
        table: 'I/239/hip_main',
        columns: ['RAICRS', 'DEICRS', 'Vmag'],
        magColumn: 'Vmag',
    },
};

/** Радиус поиска имени вокруг заданной позиции, градусы */
const NAME_MATCH_RADIUS = 0.15;
/** Допуск по звёздной величине при сопоставлении имени */
const NAME_MATCH_MAG = 0.8;

const force = process.argv.includes('--force');

function buildUrl(target) {
    const source = SOURCES[target.source];
    if (!source) throw new Error(`Неизвестный каталог: ${target.source}`);
    const { ra, dec } = target.center;
    const params = new URLSearchParams({
        '-source': source.table,
        '-c': `${ra.toFixed(5)} ${dec >= 0 ? '+' : ''}${dec.toFixed(5)}`,
        '-c.rm': String(target.radiusArcmin),
        '-c.geom': 'r',
        '-out': source.columns.join(','),
        '-out.max': String(target.maxRows),
        '-sort': source.magColumn,
        [source.magColumn]: `<${target.fetchMagLimit}`,
    });
    return `https://vizier.cds.unistra.fr/viz-bin/asu-txt?${params}`;
}

/** Центр проекции — центроид именованных звёзд; та же формула, что в src/lib/catalog.ts */
function projectionCenter(target) {
    if (!target.named?.length) return target.center;
    return {
        ra: target.named.reduce((s, n) => s + n.ra, 0) / target.named.length,
        dec: target.named.reduce((s, n) => s + n.dec, 0) / target.named.length,
    };
}

function photoUrl(target) {
    const center = projectionCenter(target);
    const params = new URLSearchParams({
        hips: target.photoSurvey,
        width: String(PHOTO_PX),
        height: String(PHOTO_PX),
        fov: String(target.photoFovDeg),
        projection: 'TAN',
        coordsys: 'icrs',
        ra: center.ra.toFixed(6),
        dec: center.dec.toFixed(6),
        format: 'jpg',
    });
    return `${HIPS2FITS}?${params}`;
}

/** Разбирает текстовый ответ VizieR: строки данных идут после линии из дефисов */
function parseVizier(text) {
    const stars = [];
    let dataStarted = false;
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (!dataStarted) {
            if (/^-{3,}[\s-]*$/.test(trimmed)) dataStarted = true;
            continue;
        }
        if (!trimmed || trimmed.startsWith('#')) break;
        const parts = trimmed.split(/\s+/);
        const ra = Number.parseFloat(parts[0]);
        const dec = Number.parseFloat(parts[1]);
        const mag = Number.parseFloat(parts[2]);
        if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(mag)) continue;
        stars.push({ ra, dec, mag });
    }
    return stars;
}

async function fetchWithRetry(url, attempts = 3, binary = false) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'astro-tattoo build script' },
                signal: AbortSignal.timeout(120_000),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
        } catch (e) {
            lastError = e;
            if (i < attempts) {
                const pause = 2000 * i;
                console.warn(`  попытка ${i} не удалась (${e.message}), повтор через ${pause / 1000} с`);
                await new Promise(r => setTimeout(r, pause));
            }
        }
    }
    throw lastError;
}

/** Проставляет собственные имена: ближайшая звезда нужной яркости в пределах допуска */
function assignNames(stars, named) {
    const warnings = [];
    for (const entry of named) {
        let best = null;
        let bestD2 = Infinity;
        const cosDec = Math.cos((entry.dec * Math.PI) / 180);
        for (const star of stars) {
            if (star.name) continue;
            if (Math.abs(star.mag - entry.mag) > NAME_MATCH_MAG) continue;
            const dra = (star.ra - entry.ra) * cosDec;
            const dde = star.dec - entry.dec;
            const d2 = dra * dra + dde * dde;
            if (d2 < bestD2) {
                bestD2 = d2;
                best = star;
            }
        }
        if (best && Math.sqrt(bestD2) <= NAME_MATCH_RADIUS) {
            best.name = entry.name;
        } else {
            warnings.push(entry.name);
        }
    }
    return warnings;
}

const round = (v, digits) => Number(v.toFixed(digits));

async function fetchPhoto(target) {
    const outPath = join(PHOTO_DIR, `${target.id}.jpg`);
    if (!force && existsSync(outPath)) return true;
    try {
        const image = await fetchWithRetry(photoUrl(target), 3, true);
        if (image.length < 2000) throw new Error('слишком маленький файл');
        await writeFile(outPath, image);
        console.log(
            `  ✓ снимок ${target.photoFovDeg}° (${target.photoSurvey}), ` +
            `${Math.round(image.length / 1024)} КБ`,
        );
        return true;
    } catch (e) {
        console.error(`  ✗ снимок не выгружен: ${e.message}`);
        return false;
    }
}

async function main() {
    const targets = JSON.parse(await readFile(TARGETS_PATH, 'utf8'));
    await mkdir(OUT_DIR, { recursive: true });
    await mkdir(PHOTO_DIR, { recursive: true });

    let failed = 0;
    for (const target of targets) {
        const outPath = join(OUT_DIR, `${target.id}.json`);
        const haveCatalog = existsSync(outPath);
        const havePhoto = existsSync(join(PHOTO_DIR, `${target.id}.jpg`));
        if (!force && haveCatalog && havePhoto) {
            console.log(`• ${target.id}: уже выгружен, пропускаю`);
            continue;
        }
        console.log(`• ${target.id}`);

        if (force || !haveCatalog) {
            let stars;
            try {
                stars = parseVizier(await fetchWithRetry(buildUrl(target)));
            } catch (e) {
                console.error(`  ✗ каталог не выгружен: ${e.message}`);
                failed++;
                continue;
            }

            if (stars.length === 0) {
                console.error('  ✗ каталог пуст — проверь параметры запроса');
                failed++;
                continue;
            }

            stars.sort((a, b) => a.mag - b.mag);
            const missing = assignNames(stars, target.named ?? []);

            const compact = stars.map(s => ({
                ra: round(s.ra, 6),
                dec: round(s.dec, 6),
                mag: round(s.mag, 3),
                ...(s.name ? { name: s.name } : {}),
            }));
            await writeFile(outPath, JSON.stringify(compact));

            const namedCount = compact.filter(s => s.name).length;
            console.log(
                `  ✓ ${stars.length} звёзд (${SOURCES[target.source].table}), ` +
                `ярчайшая ${stars[0].mag.toFixed(2)}ᵐ, ` +
                `имён ${namedCount}/${(target.named ?? []).length}`,
            );
            if (missing.length) {
                console.warn(`  ! не нашлись по координатам: ${missing.join(', ')}`);
            }
        }

        if (!(await fetchPhoto(target))) failed++;
    }

    if (failed) {
        console.error(`\nНе выгружено объектов: ${failed}`);
        process.exit(1);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
