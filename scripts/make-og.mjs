// Рисует картинку для превью ссылки (Open Graph) — 1200×630 с настоящим
// созвездием из выгруженного каталога. Растеризуем сами: сторонних библиотек
// в проекте нет, а нарисовать точки и линии по пикселям несложно.
//
//   node scripts/make-og.mjs
//
// Результат — public/og.png; файл собирается перед сборкой и не коммитится.

import { deflateSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/og.png');

const W = 1200;
const H = 630;
/** Какое созвездие показываем: у Ориона фигура узнаётся мгновенно */
const TARGET = 'orion';
/** Какую долю кадра занимает фигура по каждой стороне */
const FILL_W = 0.62;
const FILL_H = 0.78;

const BG = [10, 12, 21];
const INK = [236, 238, 247];
const LINE = [139, 123, 255];

/** Полотно RGB: пишем прямо в буфер, потом упакуем в PNG */
function canvas() {
    const px = Buffer.alloc(W * H * 3);
    for (let i = 0; i < W * H; i++) {
        // мягкое свечение к левому верхнему углу — как в самом приложении
        const x = i % W;
        const y = (i / W) | 0;
        const glow = Math.max(0, 1 - Math.hypot(x - W * 0.2, y - H * 0.1) / (W * 0.75));
        px[i * 3] = BG[0] + 26 * glow;
        px[i * 3 + 1] = BG[1] + 22 * glow;
        px[i * 3 + 2] = BG[2] + 44 * glow;
    }
    return px;
}

/** Смешивает цвет с уже лежащим — так края точек не выглядят рваными */
function blend(px, x, y, color, alpha) {
    if (x < 0 || y < 0 || x >= W || y >= H || alpha <= 0) return;
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) {
        px[i + c] = px[i + c] * (1 - alpha) + color[c] * alpha;
    }
}

function dot(px, cx, cy, r, color) {
    const from = Math.floor(-r - 1);
    const to = Math.ceil(r + 1);
    for (let dy = from; dy <= to; dy++) {
        for (let dx = from; dx <= to; dx++) {
            // сглаживание по расстоянию до края круга
            const d = Math.hypot(dx, dy);
            blend(px, Math.round(cx) + dx, Math.round(cy) + dy, color, Math.min(1, r - d + 0.5));
        }
    }
}

function line(px, x1, y1, x2, y2, width, color, alpha) {
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        dot(px, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
    }
    void alpha;
}

/** Минимальный PNG: одна IDAT со фильтром 0 в каждой строке */
function png(px) {
    const raw = Buffer.alloc((W * 3 + 1) * H);
    for (let y = 0; y < H; y++) {
        raw[y * (W * 3 + 1)] = 0;
        px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
    }

    const chunk = (type, data) => {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length);
        const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(body) >>> 0);
        return Buffer.concat([len, body, crc]);
    };

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0);
    ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; // бит на канал
    ihdr[9] = 2; // truecolor
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return c ^ 0xffffffff;
}

const rad = deg => (deg * Math.PI) / 180;

/** Гномоническая проекция — та же, что в приложении */
function project(star, center) {
    const a = rad(star.ra);
    const d = rad(star.dec);
    const a0 = rad(center.ra);
    const d0 = rad(center.dec);
    const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a - a0);
    return {
        u: (Math.cos(d) * Math.sin(a - a0)) / cosc,
        v: (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0)) / cosc,
    };
}

async function main() {
    const targets = JSON.parse(await readFile(join(ROOT, 'src/data/targets.json'), 'utf8'));
    const target = targets.find(t => t.id === TARGET);
    const catalogPath = join(ROOT, `src/data/catalogs/${TARGET}.json`);
    const linesPath = join(ROOT, `src/data/lines/${TARGET}.json`);
    if (!existsSync(catalogPath)) {
        console.warn('• og: каталога нет, картинка не обновлена');
        return;
    }

    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    const lines = existsSync(linesPath) ? JSON.parse(await readFile(linesPath, 'utf8')) : [];
    const linked = new Set(lines.flat());
    // на картинке — только фигура: поле в мелком размере превращается в шум
    const shown = catalog
        .map((s, i) => ({ ...s, i }))
        .filter(s => linked.has(s.i) || s.name);

    // центр — как в приложении: средний вектор именованных звёзд
    const named = shown.filter(s => s.name);
    const vec = named.reduce(
        (acc, s) => {
            const a = rad(s.ra);
            const d = rad(s.dec);
            return {
                x: acc.x + Math.cos(d) * Math.cos(a),
                y: acc.y + Math.cos(d) * Math.sin(a),
                z: acc.z + Math.sin(d),
            };
        },
        { x: 0, y: 0, z: 0 },
    );
    const center = {
        ra: (Math.atan2(vec.y, vec.x) * 180) / Math.PI,
        dec: (Math.atan2(vec.z, Math.hypot(vec.x, vec.y)) * 180) / Math.PI,
    };

    const points = shown.map(s => ({ ...s, ...project(s, center) }));
    // кадрируем по габаритам фигуры, а не по центру проекции: иначе рисунок
    // уезжает в сторону — центр тяжести именованных звёзд не центр картинки
    const us = points.map(p => p.u);
    const vs = points.map(p => p.v);
    const box = {
        u: (Math.min(...us) + Math.max(...us)) / 2,
        v: (Math.min(...vs) + Math.max(...vs)) / 2,
        du: Math.max(1e-6, Math.max(...us) - Math.min(...us)),
        dv: Math.max(1e-6, Math.max(...vs) - Math.min(...vs)),
    };
    const scale = Math.min((W * FILL_W) / box.du, (H * FILL_H) / box.dv);
    const brightest = Math.min(...points.map(p => p.mag));
    const faintest = Math.max(...points.map(p => p.mag));

    const px = canvas();
    const place = p => ({
        // восток слева, север вверху — как на эскизе
        x: W / 2 - (p.u - box.u) * scale,
        y: H / 2 - (p.v - box.v) * scale,
    });
    const byIndex = new Map(points.map(p => [p.i, p]));

    for (const [a, b] of lines) {
        const pa = byIndex.get(a);
        const pb = byIndex.get(b);
        if (!pa || !pb) continue;
        const from = place(pa);
        const to = place(pb);
        line(px, from.x, from.y, to.x, to.y, 2.2, LINE, 1);
    }

    for (const p of points) {
        const { x, y } = place(p);
        // диаметр по величине: ярче — крупнее, как в самом инструменте
        const t = (faintest - p.mag) / Math.max(0.5, faintest - brightest);
        dot(px, x, y, 3 + 7 * t * t, INK);
    }

    await writeFile(OUT, png(px));
    console.log(`• og: ${TARGET}, ${points.length} звёзд → public/og.png`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
