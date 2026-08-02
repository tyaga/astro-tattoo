import targetsJson from '../data/targets.json';
import { VOYAGERS } from './voyager';
import type { BackgroundMode, LabelsMode } from './types';

export { pickName } from '../i18n';

export interface NamedStar {
    /** Каноническое (латинское) имя — оно же попадает в каталог */
    name: string;
    /** Русское написание */
    ru?: string;
    ra: number;
    dec: number;
    mag: number;
}

/** Настройки объекта по умолчанию: с них он выглядит так, как созвездие
 *  принято рисовать — фигура собрана, помещается и звёзды соразмерны.
 *  Считается по данным объекта, см. autopreset.ts */
export interface TargetPreset {
    /** Предел яркости: чуть слабее самой тусклой звезды фигуры */
    magLimit: number;
    /** Поперечник рисунка на коже, см */
    patternCm: number;
    maxMm: number;
    minMm: number;
    /** Чем теснее диапазон яркостей фигуры, тем выше контраст */
    contrast: number;
    stepMm: number;
    quantize: boolean;
    showLines: boolean;
    /** Толщина линий фигуры, мм */
    lineMm: number;
    /** Что делать со звёздами вне фигуры */
    backgroundStars: BackgroundMode;
    labels: LabelsMode;
    /** Поворот фигуры, градусы: некоторые созвездия узнаются
     *  в развороте, отличном от «север вверху» */
    rotation?: number;
    /** Сдвиг поля, мм: у Жирафа он выводит в кадр Глизе 445 */
    panX?: number;
    panY?: number;
}

/** Особая точка на карте объекта — рисуется значком, а не звездой */
export interface Marker {
    id: string;
    name: string;
    ru?: string;
    ra: number;
    dec: number;
}

export interface Target {
    id: string;
    /** Название и подзаголовок по языкам */
    name: Record<string, string>;
    subtitle: Record<string, string>;
    /** Каталог-источник: Gaia DR3 для скоплений, Hipparcos для ярких созвездий */
    source: 'gaia' | 'hipparcos';
    center: { ra: number; dec: number };
    radiusArcmin: number;
    fetchMagLimit: number;
    maxRows: number;
    /** Ручная поправка к посчитанному пресету — только то, чего не выведешь
     *  из каталога: привычный разворот фигуры, сдвиг поля */
    preset?: Partial<TargetPreset>;
    /** HiPS-обзор, из которого отрендерен снимок объекта */
    photoSurvey: string;
    /** Угловая ширина снимка, градусы (он в той же TAN-проекции, что и эскиз) */
    photoFovDeg: number;
    named: NamedStar[];
    markers?: Marker[];
    /** Знак зодиака — выносится в отдельный ряд */
    zodiac?: boolean;
}

export interface CatalogStar {
    ra: number;
    dec: number;
    mag: number;
    name: string | null;
    /** Гномоническая проекция: тангенс-единицы, u — на восток, v — на север */
    u: number;
    v: number;
}

interface RawStar {
    ra: number;
    dec: number;
    mag: number;
    name?: string;
}

export const TARGETS = targetsJson as unknown as Target[];

/** Каноническое имя звезды → русское написание; собирается из targets.json */
const RU_STAR_NAMES: Record<string, string> = {};
for (const target of TARGETS) {
    for (const star of target.named) if (star.ru) RU_STAR_NAMES[star.name] = star.ru;
    for (const marker of target.markers ?? []) if (marker.ru) RU_STAR_NAMES[marker.name] = marker.ru;
}
for (const probe of VOYAGERS) RU_STAR_NAMES[probe.name] = probe.ru;

/** Имена звёзд международные; по-русски показываем привычное написание */
export function starName(name: string, lang: string): string {
    return lang === 'ru' ? RU_STAR_NAMES[name] ?? name : name;
}

/** Обычные объекты и знаки зодиака показываются отдельными рядами */
export const MAIN_TARGETS = TARGETS.filter(t => !t.zodiac);
export const ZODIAC_TARGETS = TARGETS.filter(t => t.zodiac);

export const rad = (deg: number): number => (deg * Math.PI) / 180;

// Каталоги выгружаются скриптом scripts/fetch-catalogs.mjs и в репозиторий
// не коммитятся, поэтому подхватываются по маске, а не поимённо
const catalogFiles = import.meta.glob<RawStar[]>('../data/catalogs/*.json', {
    eager: true,
    import: 'default',
});

function rawStars(id: string): RawStar[] {
    return catalogFiles[`../data/catalogs/${id}.json`] ?? [];
}

// снимки для предпросмотра рендерит CDS hips2fits — там же, в скрипте выгрузки
const photoFiles = import.meta.glob<string>('../data/photos/*.jpg', {
    eager: true,
    import: 'default',
});

export function getPhotoUrl(id: string): string | null {
    return photoFiles[`../data/photos/${id}.jpg`] ?? null;
}

// линии фигур созвездий: пары индексов в тот же массив звёзд,
// подготовлены скриптом выгрузки по данным d3-celestial (BSD-3)
const lineFiles = import.meta.glob<[number, number][]>('../data/lines/*.json', {
    eager: true,
    import: 'default',
});

export function getLines(id: string): [number, number][] {
    return lineFiles[`../data/lines/${id}.json`] ?? [];
}

export function getTarget(id: string): Target {
    return TARGETS.find(t => t.id === id) ?? TARGETS[0];
}

/** Гномоническая (тангенциальная) проекция с центром в заданной точке */
function gnomonic(
    raDeg: number,
    decDeg: number,
    center: { ra: number; dec: number },
): { u: number; v: number } {
    const a = rad(raDeg);
    const d = rad(decDeg);
    const a0 = rad(center.ra);
    const d0 = rad(center.dec);
    const cosc =
        Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a - a0);
    return {
        u: (Math.cos(d) * Math.sin(a - a0)) / cosc,
        v:
            (Math.cos(d0) * Math.sin(d) -
                Math.sin(d0) * Math.cos(d) * Math.cos(a - a0)) /
            cosc,
    };
}

/** Центр проекции: рисунок центрируется по именованным звёздам, если их
 *  достаточно, иначе по центру выборки. Усреднение векторное — наивное
 *  среднее RA разваливается на границе 0h (например, у Квадрата Пегаса).
 *  Та же логика продублирована в scripts/fetch-catalogs.mjs. */
export function projectionCenter(target: Target): { ra: number; dec: number } {
    if (target.named.length < 3) return target.center;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const n of target.named) {
        const a = rad(n.ra);
        const d = rad(n.dec);
        x += Math.cos(d) * Math.cos(a);
        y += Math.cos(d) * Math.sin(a);
        z += Math.sin(d);
    }
    const ra = (Math.atan2(y, x) * 180) / Math.PI;
    return {
        ra: (ra + 360) % 360,
        dec: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI,
    };
}

/** Проекция произвольной точки неба в систему объекта — для меток,
 *  которых нет в звёздном каталоге */
export function projectPoint(
    target: Target,
    ra: number,
    dec: number,
): { u: number; v: number } {
    return gnomonic(ra, dec, projectionCenter(target));
}

const cache = new Map<string, CatalogStar[]>();

/** Каталог объекта: отсортирован по яркости, спроецирован вокруг его центра */
export function getCatalog(id: string): CatalogStar[] {
    const cached = cache.get(id);
    if (cached) return cached;

    const target = getTarget(id);
    const center = projectionCenter(target);

    const stars: CatalogStar[] = rawStars(target.id)
        .map(s => {
            const p = gnomonic(s.ra, s.dec, center);
            return { ra: s.ra, dec: s.dec, mag: s.mag, name: s.name ?? null, u: p.u, v: p.v };
        })
        .sort((a, b) => a.mag - b.mag);

    cache.set(id, stars);
    return stars;
}

/** Порог яркости, при котором видны N ярчайших звёзд объекта
 *  (округление вверх до шага слайдера, чтобы N-я не выпадала) */
export function magForCount(id: string, n: number): number {
    const catalog = getCatalog(id);
    if (catalog.length === 0) return 6;
    const i = Math.min(n, catalog.length) - 1;
    return Math.ceil(catalog[i].mag / 0.05) * 0.05;
}
