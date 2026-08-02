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
const LINES_DIR = join(ROOT, 'src/data/lines');
const VOYAGER_PATH = join(ROOT, 'src/data/voyager.json');

/** Эфемериды JPL Horizons: где «Вояджеры» на небе прямо сейчас.
 *  −31 и −32 — их коды в системе Horizons, 500@399 — наблюдатель в центре Земли */
const HORIZONS = 'https://ssd.jpl.nasa.gov/api/horizons.api';
const PROBES = [
    { id: 'voyager1', code: '-31', name: 'Voyager 1', ru: 'Вояджер-1' },
    { id: 'voyager2', code: '-32', name: 'Voyager 2', ru: 'Вояджер-2' },
];

/** Линии фигур созвездий: d3-celestial Олафа Фрона, лицензия BSD-3.
 *  Координаты вершин — позиции самих звёзд, поэтому их можно привязать
 *  к нашему каталогу поиском ближайшей звезды. */
const LINES_URL =
    'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';
/** Границы созвездий оттуда же: по ним считаем, какой кусок неба выгружать,
 *  чтобы звёзды не кончались на краю фигуры */
const BOUNDS_URL =
    'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.bounds.json';
/** Запас к радиусу выборки, градусы */
const RADIUS_MARGIN = 1.5;
/** Допуск привязки вершины линии к звезде каталога, градусы */
const LINE_SNAP_DEG = 0.25;

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
    // выборка центрируется там же, где проекция и снимок, иначе у широких
    // созвездий поле звёзд и подложка расходятся по краям
    const { ra, dec } = projectionCenter(target);
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

/** Центр проекции — та же логика, что в src/lib/catalog.ts:
 *  векторное усреднение именованных звёзд (наивное среднее RA ломается
 *  на границе 0h), а если имён мало — центр выборки */
function projectionCenter(target) {
    const named = target.named ?? [];
    if (named.length < 3) return target.center;
    const toRad = d => (d * Math.PI) / 180;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const n of named) {
        const a = toRad(n.ra);
        const d = toRad(n.dec);
        x += Math.cos(d) * Math.cos(a);
        y += Math.cos(d) * Math.sin(a);
        z += Math.sin(d);
    }
    return {
        ra: ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360,
        dec: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
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

/** Угловое расстояние в градусах (малые углы, плоское приближение) */
function angularDist(ra1, dec1, ra2, dec2) {
    let dra = ra1 - ra2;
    if (dra > 180) dra -= 360;
    if (dra < -180) dra += 360;
    const cosDec = Math.cos((((dec1 + dec2) / 2) * Math.PI) / 180);
    const dde = dec1 - dec2;
    return Math.hypot(dra * cosDec, dde);
}

/** Оставляет только те созвездия, которым принадлежат именованные звёзды
 *  объекта: в широкое поле выборки попадают куски соседних фигур,
 *  а на эскизе нужна фигура выбранного объекта */
function ownFeatures(target, features) {
    const named = target.named ?? [];
    if (named.length === 0) return [];
    return features.filter(f =>
        (f.geometry?.coordinates ?? []).some(line =>
            line.some(([lon, dec]) => {
                const ra = lon < 0 ? lon + 360 : lon;
                return named.some(n => angularDist(ra, dec, n.ra, n.dec) <= LINE_SNAP_DEG);
            }),
        ),
    );
}

/** Привязывает линии фигур к звёздам каталога: возвращает пары индексов.
 *  Индексы указывают в тот же массив, что уходит в catalogs/<id>.json. */
function snapLines(stars, features) {
    const nearest = (ra, dec) => {
        let best = -1;
        let bestD = Infinity;
        for (let i = 0; i < stars.length; i++) {
            const d = angularDist(ra, dec, stars[i].ra, stars[i].dec);
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        }
        return bestD <= LINE_SNAP_DEG ? best : -1;
    };

    const seen = new Set();
    const pairs = [];
    for (const feature of features) {
        for (const line of feature.geometry?.coordinates ?? []) {
            let prev = -1;
            for (const [lon, dec] of line) {
                const ra = lon < 0 ? lon + 360 : lon;
                const idx = nearest(ra, dec);
                if (prev >= 0 && idx >= 0 && prev !== idx) {
                    const key = prev < idx ? `${prev}-${idx}` : `${idx}-${prev}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        pairs.push([prev, idx]);
                    }
                }
                prev = idx;
            }
        }
    }
    return pairs;
}

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

/** Линии фигур скачиваются один раз на весь запуск */
let lineFeatures = null;
async function getLineFeatures() {
    if (lineFeatures) return lineFeatures;
    const raw = await fetchWithRetry(LINES_URL);
    lineFeatures = JSON.parse(raw).features ?? [];
    return lineFeatures;
}

let boundFeatures = null;
async function getBoundFeatures() {
    if (boundFeatures) return boundFeatures;
    const raw = await fetchWithRetry(BOUNDS_URL);
    boundFeatures = JSON.parse(raw).features ?? [];
    return boundFeatures;
}

/** Все вершины полигона границы, в градусах */
function* boundaryVertices(feature) {
    const walk = node => {
        if (typeof node[0] === 'number') {
            const [lon, dec] = node;
            return [[lon < 0 ? lon + 360 : lon, dec]];
        }
        return node.flatMap(walk);
    };
    yield* walk(feature.geometry?.coordinates ?? []);
}

/** Радиус выборки: чтобы поле звёзд покрывало созвездие целиком, а не
 *  только его фигуру. Иначе при отдалении звёзды обрываются по кругу. */
async function constellationRadiusArcmin(target, features) {
    const center = projectionCenter(target);
    const bounds = await getBoundFeatures();
    // берём только главное созвездие: у Возничего одна звезда общая с Тельцом,
    // и по обоим границам радиус раздувался вдвое
    const ids = new Set(features.length ? [mainFeature(target, features).id] : []);
    let maxDeg = 0;
    for (const feature of bounds) {
        if (!ids.has(feature.id)) continue;
        for (const [ra, dec] of boundaryVertices(feature)) {
            maxDeg = Math.max(maxDeg, sphericalDist(center.ra, center.dec, ra, dec));
        }
    }
    return maxDeg ? Math.ceil((maxDeg + RADIUS_MARGIN) * 60) : 0;
}

/** Созвездие, которому принадлежит больше всего именованных звёзд объекта */
function mainFeature(target, features) {
    let best = features[0];
    let bestCount = -1;
    for (const feature of features) {
        let count = 0;
        for (const line of feature.geometry?.coordinates ?? []) {
            for (const [lon, dec] of line) {
                const ra = lon < 0 ? lon + 360 : lon;
                if ((target.named ?? []).some(n => angularDist(ra, dec, n.ra, n.dec) <= LINE_SNAP_DEG)) {
                    count++;
                }
            }
        }
        if (count > bestCount) {
            bestCount = count;
            best = feature;
        }
    }
    return best;
}

/** Полноценное угловое расстояние (не малые углы) */
function sphericalDist(ra1, dec1, ra2, dec2) {
    const toRad = d => (d * Math.PI) / 180;
    const cos =
        Math.sin(toRad(dec1)) * Math.sin(toRad(dec2)) +
        Math.cos(toRad(dec1)) * Math.cos(toRad(dec2)) * Math.cos(toRad(ra1 - ra2));
    return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}

/** Строка Horizons вида «2026-Aug-02 00:00  17 14 44.73 +12 22 01.7  170.8 …» */
function parseHorizons(text) {
    const body = text.split('$$SOE')[1]?.split('$$EOE')[0] ?? '';
    const row = body.trim().split('\n')[0];
    if (!row) throw new Error('пустой ответ');
    const m = row.trim().match(
        /^\S+\s+\S+\s+(\d+) (\d+) ([\d.]+) ([+-]\d+) (\d+) ([\d.]+)\s+([\d.]+)/,
    );
    if (!m) throw new Error(`не разобрал строку: ${row.trim()}`);
    const [, rh, rm, rs, dd, dm, ds, au] = m;
    const sign = dd.startsWith('-') ? -1 : 1;
    return {
        // часы в градусы и градусы-минуты-секунды в доли градуса
        ra: round((Number(rh) + Number(rm) / 60 + Number(rs) / 3600) * 15, 5),
        dec: round(sign * (Math.abs(Number(dd)) + Number(dm) / 60 + Number(ds) / 3600), 5),
        au: round(Number(au), 2),
        constellation: row.trim().split(/\s+/).pop(),
    };
}

/** Куда смотреть, чтобы увидеть аппараты: положение считается на день сборки */
async function fetchVoyagers() {
    const day = new Date().toISOString().slice(0, 10);
    const next = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const probes = [];
    for (const probe of PROBES) {
        const url =
            `${HORIZONS}?format=text&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=OBSERVER` +
            `&CENTER=%27500@399%27&COMMAND=%27${probe.code}%27` +
            `&START_TIME=%27${day}%27&STOP_TIME=%27${next}%27` +
            `&STEP_SIZE=%271%20d%27&QUANTITIES=%271,20,29%27`;
        try {
            const parsed = parseHorizons(await fetchWithRetry(url));
            probes.push({ id: probe.id, name: probe.name, ru: probe.ru, ...parsed });
            console.log(
                `  · ${probe.name}: ${parsed.ra}° ${parsed.dec}° ` +
                `(${parsed.constellation}), ${parsed.au} а.е.`,
            );
        } catch (e) {
            console.warn(`  ! ${probe.name}: ${e.message}`);
        }
    }
    if (probes.length === 0) return false;
    await writeFile(VOYAGER_PATH, JSON.stringify({ epoch: day, probes }, null, 1));
    return true;
}

async function main() {
    const targets = JSON.parse(await readFile(TARGETS_PATH, 'utf8'));
    await mkdir(OUT_DIR, { recursive: true });
    await mkdir(PHOTO_DIR, { recursive: true });
    await mkdir(LINES_DIR, { recursive: true });

    let failed = 0;
    for (const target of targets) {
        const outPath = join(OUT_DIR, `${target.id}.json`);
        const linesPath = join(LINES_DIR, `${target.id}.json`);
        const haveCatalog = existsSync(outPath);
        const havePhoto = existsSync(join(PHOTO_DIR, `${target.id}.jpg`));
        const haveLines = existsSync(linesPath);
        if (!force && haveCatalog && havePhoto && haveLines) {
            console.log(`• ${target.id}: уже выгружен, пропускаю`);
            continue;
        }
        console.log(`• ${target.id}`);

        // после перевыгрузки каталога индексы звёзд меняются,
        // поэтому линии фигуры приходится строить заново
        let catalogRebuilt = false;

        if (force || !haveCatalog) {
            catalogRebuilt = true;

            // расширяем выборку до границ созвездия, если они у объекта есть
            if (target.lines !== false) {
                try {
                    const own = ownFeatures(target, await getLineFeatures());
                    const needed = await constellationRadiusArcmin(target, own);
                    if (needed > target.radiusArcmin) {
                        console.log(
                            `  · радиус ${target.radiusArcmin}′ → ${needed}′ ` +
                            `(границы ${own.map(f => f.id).join(', ')})`,
                        );
                        target.radiusArcmin = needed;
                    }
                } catch (e) {
                    console.warn(`  ! границы не получены: ${e.message}`);
                }
            }
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

        if (force || !haveLines || catalogRebuilt) {
            // у скоплений фигуры нет — кладём пустой список, чтобы не качать зря
            if (target.lines === false) {
                await writeFile(linesPath, '[]');
            } else {
                try {
                    const stars = JSON.parse(await readFile(outPath, 'utf8'));
                    const features = ownFeatures(target, await getLineFeatures());
                    const pairs = snapLines(stars, features);
                    await writeFile(linesPath, JSON.stringify(pairs));
                    console.log(
                        `  ✓ линий фигуры: ${pairs.length} ` +
                        `(созвездий: ${features.map(f => f.id).join(', ') || '—'})`,
                    );
                } catch (e) {
                    console.error(`  ✗ линии не построены: ${e.message}`);
                    failed++;
                }
            }
        }

        if (!(await fetchPhoto(target))) failed++;
    }

    // положение аппаратов меняется каждый день — обновляем всегда,
    // но без него сборка не останавливается: в коде есть запасной снимок
    if (force || !existsSync(VOYAGER_PATH)) {
        console.log('• «Вояджеры» (JPL Horizons)');
        await fetchVoyagers();
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
