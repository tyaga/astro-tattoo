import { TARGETS } from './catalog';
import { detectLang } from '../i18n';
import { applyTargetPreset } from './model';
import type { Preset, Settings, WristImage } from './types';

const SETTINGS_KEY = 'astro-tattoo-settings';
const PER_TARGET_KEY = 'astro-tattoo-per-target';
const WRIST_KEY = 'astro-tattoo-wrist';
const PRESETS_KEY = 'astro-tattoo-presets';

// проект раньше назывался pleiades — переносим настройки и фото со старых ключей
const LEGACY_SETTINGS_KEY = 'pleiades-v3';
const LEGACY_WRIST_KEY = 'pleiades-wrist-image';

// Дефолты соответствуют «примерочной» компоновке: полотно под весь кадр
// запястья, фото повёрнуто на 90° (рука горизонтально), масштаб кадра
// откалиброван по сантиметровой ленте на снимке (16.3 × 21.7 см)
export const DEFAULTS: Settings = {
    targetId: 'pleiades',
    magLimit: 6.1,
    widthCm: 21.5,
    heightCm: 16.5,
    fovDeg: 1.65,
    rotation: 0,
    flipX: false,
    flipY: false,
    panX: 0,
    panY: 0,
    maxMm: 4.0,
    minMm: 1.0,
    contrast: 0.5,
    stepMm: 1.0,
    quantize: true,
    labels: 'names',
    markerIcon: 'silhouette',
    markerRotDeg: 0,
    markerMm: 4,
    voyagerReal: false,
    voyagerAspect: false,
    gridMm: 1,
    showLines: false,
    lineMm: 0.3,
    backgroundStars: 'show',
    previewZoom: 1,
    theme: 'auto',
    lang: 'ru',
    skinTone: '#efcbb0',
    inkColor: '#1e2127',
    inkOpacity: 0.92,
    exportBw: true,
    showPhoto: false,
    photoOpacity: 0.85,
    showWrist: true,
    wristWidthCm: 16.3,
    wristOffX: 0,
    wristOffY: 0,
    wristRotDeg: 90,
    wristOpacity: 0.75,
};

function readJson<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

/** Ключи с null/undefined не должны затирать дефолты: сохранённое состояние
 *  может быть от версии, где части полей ещё не было */
export function mergeSettings(saved: unknown): Settings {
    const raw = (saved ?? {}) as Record<string, unknown>;
    const clean = Object.fromEntries(
        Object.entries(raw).filter(([, v]) => v !== null && v !== undefined),
    );
    // раньше приглушение фона было галочкой
    if (clean.backgroundStars === undefined && 'fadeUnlinked' in clean) {
        clean.backgroundStars = clean.fadeUnlinked ? 'fade' : 'show';
    }
    delete clean.fadeUnlinked;
    return { ...DEFAULTS, ...clean } as Settings;
}

export function loadSettings(): Settings {
    const saved =
        readJson<unknown>(SETTINGS_KEY) ?? readJson<unknown>(LEGACY_SETTINGS_KEY);
    // первый визит — язык берём из браузера, объект показываем как принято
    if (!saved) {
        return applyTargetPreset({ ...DEFAULTS, lang: detectLang() }, DEFAULTS.targetId);
    }

    const settings = mergeSettings(saved);
    // объект мог исчезнуть из списка с прошлого визита
    if (!TARGETS.some(t => t.id === settings.targetId)) {
        return applyTargetPreset({ ...settings }, DEFAULTS.targetId);
    }
    return settings;
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
}

export function loadWrist(): WristImage | null {
    const img =
        readJson<WristImage>(WRIST_KEY) ?? readJson<WristImage>(LEGACY_WRIST_KEY);
    return img && typeof img.url === 'string' && typeof img.aspect === 'number'
        ? img
        : null;
}

export function saveWrist(img: WristImage | null): void {
    if (!img) {
        localStorage.removeItem(WRIST_KEY);
        localStorage.removeItem(LEGACY_WRIST_KEY);
        return;
    }
    try {
        localStorage.setItem(WRIST_KEY, JSON.stringify(img));
    } catch {
        // не влезло в квоту localStorage — фото живёт только до перезагрузки
    }
}

/** Настройки, привязанные к объекту: их запоминаем отдельно для каждого,
 *  чтобы возврат к созвездию возвращал и подобранный для него вид.
 *  Полотно, кожа, чернила, сетка и фото запястья общие — они про место
 *  на теле, а не про объект. */
const TARGET_FIELDS = [
    'magLimit', 'fovDeg', 'rotation', 'panX', 'panY',
    'maxMm', 'minMm', 'contrast', 'stepMm', 'quantize',
    'showLines', 'lineMm', 'backgroundStars', 'labels',
] as const;

export type TargetState = Pick<Settings, (typeof TARGET_FIELDS)[number]>;

export function pickTargetState(s: Settings): TargetState {
    const out = {} as Record<string, unknown>;
    for (const key of TARGET_FIELDS) out[key] = s[key];
    return out as TargetState;
}

export function loadPerTarget(): Record<string, TargetState> {
    return readJson<Record<string, TargetState>>(PER_TARGET_KEY) ?? {};
}

export function savePerTarget(map: Record<string, TargetState>): void {
    try {
        localStorage.setItem(PER_TARGET_KEY, JSON.stringify(map));
    } catch {
        // квота исчерпана — переживём, это только удобство
    }
}

export function clearPerTarget(): void {
    localStorage.removeItem(PER_TARGET_KEY);
}

export function loadPresets(): Preset[] {
    const presets = readJson<Preset[]>(PRESETS_KEY);
    return Array.isArray(presets) ? presets : [];
}

export function savePresets(presets: Preset[]): void {
    try {
        localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
        // квота исчерпана — скорее всего из-за фото запястья
    }
}
