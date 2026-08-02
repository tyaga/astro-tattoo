import { getCatalog, getTarget, rad } from './catalog';
import type { DrawnStar, Settings } from './types';

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

/** Масштаб проекции: мм полотна на единицу тангенса */
function projectionScale(s: Settings): number {
    const { W, H } = sheetSize(s);
    return Math.min(W, H) / 2 / Math.tan(rad(s.fovDeg));
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
    const brightest = catalog[0].mag;
    const drawn: DrawnStar[] = [];

    for (let index = 0; index < catalog.length; index++) {
        const star = catalog[index];
        if (star.mag > s.magLimit) break; // каталог отсортирован по яркости
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

/** Угловой радиус рисунка: самая далёкая от центра видимая звезда,
 *  в тангенс-единицах. Не зависит от поворота и размера полотна. */
export function patternRadiusTan(s: Settings): number {
    let r = 0;
    for (const star of getCatalog(s.targetId)) {
        if (star.mag > s.magLimit) break;
        r = Math.max(r, Math.hypot(star.u, star.v));
    }
    return r;
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
    return Math.min(30, Math.max(0.05, Math.round(fov * 100) / 100));
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
    return Math.min(30, Math.max(0.2, Math.round(fov * 20) / 20));
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
    const { W, H } = sheetSize(s);
    const target = getTarget(s.targetId);
    const source =
        target.source === 'gaia' ? 'Gaia DR3 (VizieR I/355)' : 'Hipparcos (VizieR I/239)';

    const lines: string[] = [];
    lines.push(`${target.name} — спецификация эскиза татуировки`);
    lines.push(target.subtitle);
    lines.push(
        `Полотно: ${W} × ${H} мм. Координаты X — от левого края, Y — от верхнего.`,
    );
    lines.push(`Звёзд: ${drawn.length}. Данные: ${source}.`);
    lines.push('');
    lines.push('Размерные классы точек:');
    for (const c of sizeClasses(drawn)) {
        lines.push(`  ⌀ ${c.d.toFixed(2)} мм — ${c.count} шт.`);
    }
    lines.push('');
    lines.push('  №  Имя               mag     X, мм    Y, мм   ⌀, мм');
    const sorted = [...drawn].sort((a, b) => a.mag - b.mag);
    sorted.forEach((star, i) => {
        const num = String(i + 1).padStart(3);
        const name = (star.name ?? '—').padEnd(16);
        lines.push(
            `${num}  ${name} ${star.mag.toFixed(2).padStart(5)}  ` +
            `${star.X.toFixed(1).padStart(7)}  ${star.Y.toFixed(1).padStart(7)}  ` +
            `${star.d.toFixed(2).padStart(5)}`,
        );
    });
    return lines.join('\n');
}
