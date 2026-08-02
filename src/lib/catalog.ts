import targetsJson from '../data/targets.json';

export interface NamedStar {
    name: string;
    ra: number;
    dec: number;
    mag: number;
}

export interface Target {
    id: string;
    name: string;
    subtitle: string;
    /** Каталог-источник: Gaia DR3 для скоплений, Hipparcos для ярких созвездий */
    source: 'gaia' | 'hipparcos';
    center: { ra: number; dec: number };
    radiusArcmin: number;
    fetchMagLimit: number;
    maxRows: number;
    defaultMagLimit: number;
    /** HiPS-обзор, из которого отрендерен снимок объекта */
    photoSurvey: string;
    /** Угловая ширина снимка, градусы (он в той же TAN-проекции, что и эскиз) */
    photoFovDeg: number;
    named: NamedStar[];
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

export const TARGETS = targetsJson as Target[];

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

const cache = new Map<string, CatalogStar[]>();

/** Каталог объекта: отсортирован по яркости, спроецирован вокруг его центра */
export function getCatalog(id: string): CatalogStar[] {
    const cached = cache.get(id);
    if (cached) return cached;

    const target = getTarget(id);
    // центр проекции — центроид именованных звёзд, иначе центр запроса
    const center = target.named.length
        ? {
            ra: target.named.reduce((s, n) => s + n.ra, 0) / target.named.length,
            dec: target.named.reduce((s, n) => s + n.dec, 0) / target.named.length,
        }
        : target.center;

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
