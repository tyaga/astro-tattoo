import { autoPreset } from './autopreset';
import { getCatalog, getLines, getTarget } from './catalog';
import { computeDrawn, fovForPatternMm } from './model';
import { DEFAULTS } from './state';
import type { DrawnStar, Settings } from './types';

/** Сторона квадратной миниатюры в «миллиметрах» её системы координат */
export const THUMB_BOX = 40;
/** Какую долю карточки занимает фигура */
const FILL = 0.84;

export interface Thumbnail {
    dots: DrawnStar[];
    /** Отрезки фигуры в тех же координатах — рисуются под точками */
    segments: [DrawnStar, DrawnStar][];
}

const cache = new Map<string, Thumbnail>();

/** «Идеальный» вид объекта для карточки: только звёзды фигуры, вписанные
 *  в квадрат, без поворотов и сдвигов. Поле вокруг фигуры не рисуем —
 *  в мелком размере оно превращает карточку в облако точек. */
export function thumbnail(id: string): Thumbnail {
    const cached = cache.get(id);
    if (cached) return cached;

    const target = getTarget(id);
    const catalog = getCatalog(id);
    const preset = autoPreset(id);
    const linked = new Set(preset.showLines ? getLines(id).flat() : []);

    // предел яркости — по самой тусклой звезде фигуры
    let figureMag = target.named.reduce((m, n) => Math.max(m, n.mag), 0);
    for (const i of linked) figureMag = Math.max(figureMag, catalog[i]?.mag ?? 0);
    const magLimit = figureMag
        ? Math.min(preset.magLimit, figureMag + 0.05)
        : preset.magLimit;

    const base: Settings = {
        ...DEFAULTS,
        targetId: id,
        magLimit,
        widthCm: THUMB_BOX / 10,
        heightCm: THUMB_BOX / 10,
        rotation: 0,
        flipX: false,
        flipY: false,
        panX: 0,
        panY: 0,
        maxMm: 2.8,
        minMm: 0.7,
        contrast: 0.45,
        quantize: false,
    };

    const fovDeg = fovForPatternMm(base, THUMB_BOX * FILL);
    const all = computeDrawn({ ...base, fovDeg });
    const dots = all.filter(d => d.name || linked.has(d.i));

    const byIndex = new Map(dots.map(d => [d.i, d]));
    const segments = getLines(id)
        .map(([a, b]) => [byIndex.get(a), byIndex.get(b)] as const)
        .filter((pair): pair is [DrawnStar, DrawnStar] => Boolean(pair[0] && pair[1]));

    const result: Thumbnail = { dots, segments: preset.showLines ? segments : [] };
    cache.set(id, result);
    return result;
}
