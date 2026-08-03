import { applyTargetPreset } from './model';
import { DEFAULTS } from './state';
import type { Settings } from './types';
import type { Tab } from '../components/panels/types';

/** Что относится к каждой вкладке: сброс не должен трогать соседние */
const FIELDS: Record<Tab, (keyof Settings)[]> = {
    draw: [
        'magLimit', 'showLines', 'lineMm', 'backgroundStars',
        'markerIcon', 'markerMm', 'markerRotDeg', 'voyagerAspect', 'voyagerReal',
    ],
    look: [
        'fovDeg', 'rotation', 'flipX', 'flipY', 'panX', 'panY',
        'maxMm', 'minMm', 'contrast', 'stepMm', 'quantize', 'labels',
    ],
    body: [
        'skinTone', 'inkColor', 'inkOpacity',
        'showBodyPhoto', 'bodyWidthCm', 'bodyOffX', 'bodyOffY', 'bodyRotDeg', 'bodyOpacity',
        'showPhoto', 'photoOpacity',
    ],
    print: ['widthCm', 'heightCm', 'gridMm', 'exportBw'],
};

/** Поля, у которых умолчание своё у каждого объекта: их берём из расчётного
 *  вида, остальные — из общих настроек приложения */
const FROM_PRESET = new Set<keyof Settings>([
    'magLimit', 'fovDeg', 'rotation', 'panX', 'panY',
    'maxMm', 'minMm', 'contrast', 'stepMm', 'quantize',
    'showLines', 'lineMm', 'backgroundStars', 'labels',
]);

/** Возвращает к умолчаниям только то, что настраивается на этой вкладке.
 *  Загруженное фото и сохранённые пресеты не трогаются — это не настройка. */
export function resetTab(s: Settings, tab: Tab): Settings {
    // размер рисунка считается от текущего полотна, поэтому пресет применяем
    // к нынешним настройкам, а не к пустым
    const preset = applyTargetPreset(s, s.targetId);
    const next = { ...s };
    for (const key of FIELDS[tab]) {
        const source = FROM_PRESET.has(key) ? preset : DEFAULTS;
        Object.assign(next, { [key]: source[key] });
    }
    return next;
}
