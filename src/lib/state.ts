import { TARGETS } from './catalog';
import { detectLang } from '../i18n';
import { DEFAULTS, TARGET_FIELDS } from './fields';
import { applyTargetPreset } from './model';
import type { BodyPhoto, Preset, Settings } from './types';

// Значения по умолчанию и состав «памяти по объектам» описаны в fields.ts
export { DEFAULTS } from './fields';

const SETTINGS_KEY = 'astro-tattoo-settings';
const PER_TARGET_KEY = 'astro-tattoo-per-target';
const BODY_KEY = 'astro-tattoo-body';
const PRESETS_KEY = 'astro-tattoo-presets';


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
    return { ...DEFAULTS, ...clean } as Settings;
}

export function loadSettings(): Settings {
    const saved = readJson<unknown>(SETTINGS_KEY);
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
}

export function loadBodyPhoto(): BodyPhoto | null {
    const img = readJson<BodyPhoto>(BODY_KEY);
    return img && typeof img.url === 'string' && typeof img.aspect === 'number'
        ? img
        : null;
}

export function saveBodyPhoto(img: BodyPhoto | null): void {
    if (!img) {
        localStorage.removeItem(BODY_KEY);
        return;
    }
    try {
        localStorage.setItem(BODY_KEY, JSON.stringify(img));
    } catch {
        // не влезло в квоту localStorage — фото живёт только до перезагрузки
    }
}

/** Настройки, привязанные к объекту: их запоминаем отдельно для каждого,
 *  чтобы возврат к созвездию возвращал и подобранный для него вид.
 *  Состав списка задан в fields.ts признаком perTarget. */
export type TargetState = Partial<Settings>;

export function pickTargetState(s: Settings): TargetState {
    const out: TargetState = {};
    for (const key of TARGET_FIELDS) Object.assign(out, { [key]: s[key] });
    return out;
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
        // квота исчерпана — скорее всего из-за фото места на теле
    }
}
