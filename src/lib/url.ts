import { getTarget } from './catalog';
import { applyTargetPreset } from './model';
import { DEFAULTS } from './state';
import type { BackgroundMode, GridMm, LabelsMode, MarkerIcon, Settings } from './types';
import { LANGS } from '../i18n/strings';
import type { Lang } from '../i18n/strings';

const ICONS: MarkerIcon[] = ['silhouette', 'schema', 'minimal', 'record', 'classic'];

/** Короткие имена параметров: ссылка должна оставаться читаемой */
const NUM: Record<string, keyof Settings> = {
    m: 'magLimit',
    f: 'fovDeg',
    r: 'rotation',
    px: 'panX',
    py: 'panY',
    w: 'widthCm',
    h: 'heightCm',
    d: 'maxMm',
    dm: 'minMm',
    c: 'contrast',
    q: 'stepMm',
    lw: 'lineMm',
    io: 'inkOpacity',
};

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Ссылка на текущий вид: объект и все настройки рисунка.
 *  Фото запястья не попадает — оно живёт только в браузере. */
export function settingsToQuery(s: Settings): string {
    const p = new URLSearchParams();
    p.set('t', s.targetId);
    for (const [key, field] of Object.entries(NUM)) {
        p.set(key, String(round(s[field] as number)));
    }
    p.set('qz', s.quantize ? '1' : '0');
    p.set('ln', s.showLines ? '1' : '0');
    p.set('bg', s.backgroundStars);
    p.set('lb', s.labels);
    p.set('vi', s.markerIcon);
    p.set('g', String(s.gridMm));
    p.set('sk', s.skinTone.replace('#', ''));
    p.set('ik', s.inkColor.replace('#', ''));
    p.set('lang', s.lang);
    return p.toString();
}

const asHex = (v: string | null): string | undefined =>
    v && /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : undefined;

/** Настройки из ссылки поверх вида по умолчанию для указанного объекта.
 *  Возвращает null, если объекта в ссылке нет.
 *
 *  Ссылка описывает рисунок, а не примерку: фото запястья с его калибровкой,
 *  снимок неба и тема остаются такими, как настроены в этом браузере. */
export function settingsFromQuery(search: string, local: Settings): Settings | null {
    const p = new URLSearchParams(search);
    const id = p.get('t');
    if (!id) return null;
    const target = getTarget(id);
    if (target.id !== id) return null;

    const personal: Partial<Settings> = {
        theme: local.theme,
        previewZoom: local.previewZoom,
        exportBw: local.exportBw,
        showWrist: local.showWrist,
        wristWidthCm: local.wristWidthCm,
        wristOffX: local.wristOffX,
        wristOffY: local.wristOffY,
        wristRotDeg: local.wristRotDeg,
        wristOpacity: local.wristOpacity,
        showPhoto: local.showPhoto,
        photoOpacity: local.photoOpacity,
    };

    const s = applyTargetPreset({ ...DEFAULTS, ...personal }, target.id);

    for (const [key, field] of Object.entries(NUM)) {
        const value = Number(p.get(key));
        if (p.has(key) && Number.isFinite(value)) {
            (s[field] as number) = value;
        }
    }
    if (p.has('qz')) s.quantize = p.get('qz') === '1';
    if (p.has('ln')) s.showLines = p.get('ln') === '1';

    const bg = p.get('bg');
    if (bg === 'show' || bg === 'fade' || bg === 'hide') s.backgroundStars = bg as BackgroundMode;

    const icon = p.get('vi');
    if (icon && ICONS.includes(icon as MarkerIcon)) s.markerIcon = icon as MarkerIcon;

    const labels = p.get('lb');
    if (labels === 'none' || labels === 'names' || labels === 'full') {
        s.labels = labels as LabelsMode;
    }

    const grid = Number(p.get('g'));
    if ([0, 1, 2, 5].includes(grid)) s.gridMm = grid as GridMm;

    s.skinTone = asHex(p.get('sk')) ?? s.skinTone;
    s.inkColor = asHex(p.get('ik')) ?? s.inkColor;

    const lang = p.get('lang');
    if (LANGS.some(l => l === lang)) s.lang = lang as Lang;

    return s;
}

export function shareUrl(s: Settings): string {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?${settingsToQuery(s)}`;
}
