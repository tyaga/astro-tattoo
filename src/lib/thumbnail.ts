import { getTarget } from './catalog';
import { computeDrawn, fitFovDeg } from './model';
import { DEFAULTS } from './state';
import type { DrawnStar, Settings } from './types';

/** Сторона квадратной миниатюры в «миллиметрах» её системы координат */
export const THUMB_BOX = 40;

const cache = new Map<string, DrawnStar[]>();

/** «Идеальный» вид объекта для карточки: без поворотов и сдвигов,
 *  вписанный в квадрат, с крупными точками для читаемости в мелком размере */
export function thumbnailDots(id: string): DrawnStar[] {
    const cached = cache.get(id);
    if (cached) return cached;

    const target = getTarget(id);
    const base: Settings = {
        ...DEFAULTS,
        targetId: id,
        magLimit: target.preset.magLimit,
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
    const dots = computeDrawn({ ...base, fovDeg: fitFovDeg(base) });
    cache.set(id, dots);
    return dots;
}
