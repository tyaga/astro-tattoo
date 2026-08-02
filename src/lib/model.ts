import { CATALOG, rad } from './catalog';
import type { DrawnStar, Settings } from './types';

export function sheetSize(s: Settings): { W: number; H: number } {
    return { W: s.widthCm * 10, H: s.heightCm * 10 };
}

export function starDiameterMm(s: Settings, mag: number): number {
    const brightest = CATALOG[0].mag;
    // диаметр пропорционален потоку в степени contrast
    const raw = s.maxMm * Math.pow(10, -0.4 * (mag - brightest) * s.contrast);
    const clamped = Math.min(s.maxMm, Math.max(s.minMm, raw));
    if (!s.quantize) return clamped;
    return Math.max(s.stepMm, Math.round(clamped / s.stepMm) * s.stepMm);
}

/** Звёзды, попадающие на полотно, в мм от левого верхнего угла */
export function computeDrawn(s: Settings): DrawnStar[] {
    const { W, H } = sheetSize(s);
    const scale = Math.min(W, H) / 2 / Math.tan(rad(s.fovDeg));
    const th = rad(s.rotation);
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const drawn: DrawnStar[] = [];

    for (const star of CATALOG) {
        if (star.mag > s.magLimit) break; // каталог отсортирован по яркости
        // вид "как на небе": север вверху, восток слева
        let x0 = -star.u;
        let y0 = star.v;
        if (s.flipX) x0 = -x0;
        if (s.flipY) y0 = -y0;
        const x1 = x0 * cos - y0 * sin;
        const y1 = x0 * sin + y0 * cos;
        const X = W / 2 + s.panX + x1 * scale;
        const Y = H / 2 + s.panY - y1 * scale;
        const d = starDiameterMm(s, star.mag);
        const r = d / 2;
        if (X < -r || X > W + r || Y < -r || Y > H + r) continue;
        drawn.push({ X, Y, d, mag: star.mag, name: star.name });
    }
    return drawn;
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
    const lines: string[] = [];
    lines.push('Плеяды (M45) — спецификация эскиза татуировки');
    lines.push(
        `Полотно: ${W} × ${H} мм. Координаты X — от левого края, Y — от верхнего.`,
    );
    lines.push(`Звёзд: ${drawn.length}. Данные: Gaia DR3 (VizieR I/355).`);
    lines.push('');
    lines.push('Размерные классы точек:');
    for (const c of sizeClasses(drawn)) {
        lines.push(`  ⌀ ${c.d.toFixed(2)} мм — ${c.count} шт.`);
    }
    lines.push('');
    lines.push('  №  Имя         mag     X, мм    Y, мм   ⌀, мм');
    const sorted = [...drawn].sort((a, b) => a.mag - b.mag);
    sorted.forEach((star, i) => {
        const num = String(i + 1).padStart(3);
        const name = (star.name ?? '—').padEnd(10);
        lines.push(
            `${num}  ${name} ${star.mag.toFixed(2).padStart(5)}  ` +
            `${star.X.toFixed(1).padStart(7)}  ${star.Y.toFixed(1).padStart(7)}  ` +
            `${star.d.toFixed(2).padStart(5)}`,
        );
    });
    return lines.join('\n');
}
