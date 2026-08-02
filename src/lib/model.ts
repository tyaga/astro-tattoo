import { getCatalog, getLines, getTarget, projectPoint, rad, starName } from './catalog';
import { pick, t as tr } from '../i18n';
import type { DrawnStar, Settings } from './types';

/** Дальше гномоническая проекция слишком растягивает углы полотна */
export const MAX_FOV_DEG = 45;

export function sheetSize(s: Settings): { W: number; H: number } {
    return { W: s.widthCm * 10, H: s.heightCm * 10 };
}

export function starDiameterMm(s: Settings, mag: number, brightest: number): number {
    // диаметр пропорционален потоку в степени contrast
    const raw = s.maxMm * Math.pow(10, -0.4 * (mag - brightest) * s.contrast);
    const clamped = Math.min(s.maxMm, Math.max(s.minMm, raw));
    if (!s.quantize) return clamped;
    return Math.max(s.stepMm, Math.round(clamped / s.stepMm) * s.stepMm);
}

/** Опорная яркость для размера точек — ярчайшая звезда самой фигуры.
 *  В широкое поле попадают чужие светила (Вега в поле Геркулеса, Ригель
 *  у Зайца); если равняться на них, звёзды фигуры схлопнутся к минимуму.
 *  Такие соседи просто упрутся в максимальный диаметр. */
function referenceMag(targetId: string): number {
    const catalog = getCatalog(targetId);
    const named = catalog.filter(s => s.name);
    return named.length >= 3 ? named[0].mag : catalog[0].mag;
}

/** Масштаб проекции: мм полотна на единицу тангенса */
function projectionScale(s: Settings): number {
    const { W, H } = sheetSize(s);
    return Math.min(W, H) / 2 / Math.tan(rad(s.fovDeg));
}

/** Переводит точку проекции (тангенс-единицы) в миллиметры полотна */
function placeOnSheet(s: Settings, u: number, v: number): { X: number; Y: number } {
    const { W, H } = sheetSize(s);
    const scale = projectionScale(s);
    const th = rad(s.rotation);
    // вид «как на небе»: север вверху, восток слева
    let x0 = -u;
    let y0 = v;
    if (s.flipX) x0 = -x0;
    if (s.flipY) y0 = -y0;
    return {
        X: W / 2 + s.panX + (x0 * Math.cos(th) - y0 * Math.sin(th)) * scale,
        Y: H / 2 + s.panY - (x0 * Math.sin(th) + y0 * Math.cos(th)) * scale,
    };
}

export interface DrawnMarker {
    id: string;
    name: string;
    X: number;
    Y: number;
}

/** Особые точки объекта (например звезда, к которой летит «Вояджер») */
export function computeMarkers(s: Settings): DrawnMarker[] {
    const target = getTarget(s.targetId);
    const { W, H } = sheetSize(s);
    const out: DrawnMarker[] = [];
    for (const m of target.markers ?? []) {
        const p = projectPoint(target, m.ra, m.dec);
        const { X, Y } = placeOnSheet(s, p.u, p.v);
        if (X < -10 || X > W + 10 || Y < -10 || Y > H + 10) continue;
        out.push({ id: m.id, name: m.name, X, Y });
    }
    return out;
}

/** Звёзды, попадающие на полотно, в мм от левого верхнего угла */
export function computeDrawn(s: Settings): DrawnStar[] {
    const { W, H } = sheetSize(s);
    const catalog = getCatalog(s.targetId);
    if (catalog.length === 0) return [];

    const scale = projectionScale(s);
    const th = rad(s.rotation);
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const brightest = referenceMag(s.targetId);
    // в режиме «только фигура» поле не рисуем совсем: тогда и легенда,
    // и спецификация считают ровно те точки, что уйдут на кожу
    const figureOnly = s.backgroundStars === 'hide' && s.showLines;
    const linked = figureOnly ? new Set(getLines(s.targetId).flat()) : null;
    const drawn: DrawnStar[] = [];

    for (let index = 0; index < catalog.length; index++) {
        const star = catalog[index];
        if (star.mag > s.magLimit) break; // каталог отсортирован по яркости
        if (linked && !linked.has(index) && !star.name) continue;
        // вид «как на небе»: север вверху, восток слева
        let x0 = -star.u;
        let y0 = star.v;
        if (s.flipX) x0 = -x0;
        if (s.flipY) y0 = -y0;
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        const X = W / 2 + s.panX + x1 * scale;
        const Y = H / 2 + s.panY - y1 * scale;
        const d = starDiameterMm(s, star.mag, brightest);
        const r = d / 2;
        if (X < -r || X > W + r || Y < -r || Y > H + r) continue;
        drawn.push({ i: index, X, Y, d, mag: star.mag, name: star.name });
    }
    return drawn;
}

/** Угловой радиус рисунка в тангенс-единицах — по нему нормируется
 *  физический размер татуировки. Меряем по именованным звёздам: они и есть
 *  узнаваемая фигура, тогда как в выборку попадает поле заметно шире неё.
 *  Для скоплений без имён берём 90-й процентиль, чтобы одна далёкая
 *  звезда поля не раздувала размер. */
export function patternRadiusTan(s: Settings): number {
    const catalog = getCatalog(s.targetId);
    const named = catalog.filter(star => star.name);
    if (named.length >= 3) {
        return named.reduce((r, star) => Math.max(r, Math.hypot(star.u, star.v)), 0);
    }

    const radii: number[] = [];
    for (const star of catalog) {
        if (star.mag > s.magLimit) break;
        radii.push(Math.hypot(star.u, star.v));
    }
    if (radii.length === 0) return 0;
    radii.sort((a, b) => a - b);
    return radii[Math.min(radii.length - 1, Math.floor(radii.length * 0.9))];
}

/** Поперечник рисунка на полотне, мм — «насколько велика татуировка» */
export function patternSizeMm(s: Settings): number {
    return 2 * patternRadiusTan(s) * projectionScale(s);
}

/** Обратная задача: поле зрения, при котором рисунок займёт заданный поперечник.
 *  Так объект остаётся того же физического размера при смене цели. */
export function fovForPatternMm(s: Settings, mm: number): number {
    const { W, H } = sheetSize(s);
    const r = patternRadiusTan(s);
    if (r === 0 || mm <= 0) return s.fovDeg;
    const scale = mm / (2 * r);
    const fov = (Math.atan(Math.min(W, H) / 2 / scale) * 180) / Math.PI;
    return Math.min(MAX_FOV_DEG, Math.max(0.05, Math.round(fov * 100) / 100));
}

/** Поле зрения, при котором звёзды ярче предела вписываются в полотно */
export function fitFovDeg(s: Settings): number {
    const { W, H } = sheetSize(s);
    const catalog = getCatalog(s.targetId);
    const margin = Math.min(W, H) * 0.08;

    let maxU = 0;
    let maxV = 0;
    for (const star of catalog) {
        if (star.mag > s.magLimit) break;
        maxU = Math.max(maxU, Math.abs(star.u));
        maxV = Math.max(maxV, Math.abs(star.v));
    }
    if (maxU === 0 && maxV === 0) return s.fovDeg;

    // scale ограничен и по ширине, и по высоте
    const scaleLimit = Math.min(
        maxU > 0 ? (W / 2 - margin) / maxU : Infinity,
        maxV > 0 ? (H / 2 - margin) / maxV : Infinity,
    );
    const tan = Math.min(W, H) / 2 / scaleLimit;
    const fov = (Math.atan(tan) * 180) / Math.PI;
    return Math.min(MAX_FOV_DEG, Math.max(0.2, Math.round(fov * 20) / 20));
}

/** Подставляет настройки объекта по умолчанию: диапазон звёзд, размер
 *  рисунка, размеры точек и линии фигуры. Полотно, кожа, чернила, сетка
 *  и фото запястья не трогаются — они про место на теле, а не про объект. */
export function applyTargetPreset(base: Settings, targetId: string): Settings {
    const p = getTarget(targetId).preset;
    const next: Settings = {
        ...base,
        targetId,
        magLimit: p.magLimit,
        maxMm: p.maxMm,
        minMm: p.minMm,
        contrast: p.contrast,
        stepMm: p.stepMm,
        quantize: p.quantize,
        showLines: p.showLines,
        lineMm: p.lineMm,
        backgroundStars: p.backgroundStars,
        labels: p.labels,
        rotation: p.rotation ?? 0,
        panX: p.panX ?? 0,
        panY: p.panY ?? 0,
    };
    return { ...next, fovDeg: fovForPatternMm(next, p.patternCm * 10) };
}

export interface SizeClass {
    d: number;
    count: number;
}

export function sizeClasses(drawn: DrawnStar[]): SizeClass[] {
    const map = new Map<string, number>();
    for (const s of drawn) {
        const key = s.d.toFixed(2);
        map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
        .map(([d, count]) => ({ d: parseFloat(d), count }))
        .sort((a, b) => b.d - a.d);
}

export function buildSpec(s: Settings, drawn: DrawnStar[]): string {
    const lang = s.lang;
    const { W, H } = sheetSize(s);
    const target = getTarget(s.targetId);
    const source =
        target.source === 'gaia' ? 'Gaia DR3 (VizieR I/355)' : 'Hipparcos (VizieR I/239)';

    const lines: string[] = [];
    const mm = tr(lang, 'mm');
    lines.push(`${pick(target.name, lang)} — ${tr(lang, 'specTitle')}`);
    lines.push(pick(target.subtitle, lang));
    lines.push(`${tr(lang, 'specSheet')}: ${W} × ${H} ${mm}. ${tr(lang, 'specCoords')}`);
    lines.push(`${tr(lang, 'specStars')}: ${drawn.length}. ${tr(lang, 'specData')}: ${source}.`);
    lines.push('');
    lines.push(tr(lang, 'specSizeClasses'));
    for (const c of sizeClasses(drawn)) {
        lines.push(`  ⌀ ${c.d.toFixed(2)} ${mm} — ${c.count} ${tr(lang, 'pieces')}`);
    }
    lines.push('');
    lines.push(`  №  ${tr(lang, 'specName').padEnd(16)}  mag     X       Y      ⌀`);
    const sorted = [...drawn].sort((a, b) => a.mag - b.mag);
    sorted.forEach((star, i) => {
        const num = String(i + 1).padStart(3);
        const name = (star.name ? starName(star.name, lang) : '—').padEnd(16);
        lines.push(
            `${num}  ${name} ${star.mag.toFixed(2).padStart(5)}  ` +
            `${star.X.toFixed(1).padStart(7)}  ${star.Y.toFixed(1).padStart(7)}  ` +
            `${star.d.toFixed(2).padStart(5)}`,
        );
    });
    return lines.join('\n');
}
