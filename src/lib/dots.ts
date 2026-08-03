/** Как звёздная величина превращается в диаметр точки. Формула нужна
 *  и на отрисовке, и в расчёте пресета, поэтому живёт отдельно: раньше она
 *  была написана дважды и могла разойтись. */

export interface DotScale {
    maxMm: number;
    minMm: number;
    /** Показатель степени: 0 — все точки одинаковые, 0.5 — резкая градация */
    contrast: number;
    /** Округлять диаметры до шага: мастеру нужен набор калибров */
    quantize?: boolean;
    stepMm?: number;
}

/** Диаметр точки для звезды величины mag, если ярчайшая имеет brightest */
export function dotDiameterMm(scale: DotScale, mag: number, brightest: number): number {
    // диаметр пропорционален потоку в степени contrast
    const raw = scale.maxMm * Math.pow(10, -0.4 * (mag - brightest) * scale.contrast);
    const clamped = Math.min(scale.maxMm, Math.max(scale.minMm, raw));
    if (!scale.quantize || !scale.stepMm) return clamped;
    return Math.max(scale.stepMm, Math.round(clamped / scale.stepMm) * scale.stepMm);
}
