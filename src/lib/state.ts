import type { Settings, WristImage } from './types';

const STORAGE_KEY = 'pleiades-v3';
const WRIST_KEY = 'pleiades-wrist-image';

// Дефолты соответствуют «примерочной» компоновке: полотно под весь кадр
// запястья, фото повёрнуто на 90° (рука горизонтально), масштаб кадра
// откалиброван по сантиметровой ленте на снимке (16.3 × 21.7 см)
export const DEFAULTS: Settings = {
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
    gridMm: 1,
    previewZoom: 1,
    skinTone: '#efcbb0',
    inkColor: '#1e2127',
    inkOpacity: 0.92,
    exportBw: true,
    showPhoto: false,
    photoOpacity: 0.85,
    photoFovDeg: 1.4,
    photoRotDeg: 0,
    showWrist: true,
    wristWidthCm: 16.3,
    wristHeightCm: 21.7,
    wristOffX: 0,
    wristOffY: 0,
    wristRotDeg: 90,
    wristOpacity: 0.75,
};

export function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            // ключи с null/undefined не должны затирать дефолты:
            // сохранённое состояние может быть от версии без части полей
            const clean = Object.fromEntries(
                Object.entries(saved ?? {}).filter(([, v]) => v !== null && v !== undefined),
            );
            return { ...DEFAULTS, ...clean };
        }
    } catch {
        // повреждённое состояние — остаёмся на дефолтах
    }
    return { ...DEFAULTS };
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function loadWrist(): WristImage | null {
    try {
        const raw = localStorage.getItem(WRIST_KEY);
        if (raw) {
            const img = JSON.parse(raw);
            if (img && typeof img.url === 'string' && typeof img.aspect === 'number') {
                return img;
            }
        }
    } catch {
        // повреждённые данные — считаем, что фото нет
    }
    return null;
}

export function saveWrist(img: WristImage | null): void {
    if (!img) {
        localStorage.removeItem(WRIST_KEY);
        return;
    }
    try {
        localStorage.setItem(WRIST_KEY, JSON.stringify(img));
    } catch {
        // не влезло в квоту localStorage — фото живёт только в памяти сессии
    }
}
