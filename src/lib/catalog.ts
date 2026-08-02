import rawStars from '../data/stars.json';

export interface CatalogStar {
    ra: number;
    dec: number;
    mag: number;
    name: string | null;
    /** Гномоническая проекция: тангенс-единицы, на восток */
    u: number;
    /** Гномоническая проекция: тангенс-единицы, на север */
    v: number;
}

/** Девять именованных звёзд Плеяд (J2000). Имена привязываются
 *  к ближайшим источникам Gaia DR3 по координатам. */
const NAMED_STARS = [
    { name: 'Альциона', ra: 56.871152, dec: 24.105136 },
    { name: 'Атлас', ra: 57.290597, dec: 24.053417 },
    { name: 'Электра', ra: 56.218904, dec: 24.113336 },
    { name: 'Майя', ra: 56.456695, dec: 24.367750 },
    { name: 'Меропа', ra: 56.581553, dec: 23.948348 },
    { name: 'Тайгета', ra: 56.302063, dec: 24.467270 },
    { name: 'Плейона', ra: 57.296738, dec: 24.136710 },
    { name: 'Келено', ra: 56.200893, dec: 24.289468 },
    { name: 'Астеропа', ra: 56.476987, dec: 24.554512 },
];

export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** Центр поля — центроид именованных звёзд */
export const CENTER = {
    ra: NAMED_STARS.reduce((s, n) => s + n.ra, 0) / NAMED_STARS.length,
    dec: NAMED_STARS.reduce((s, n) => s + n.dec, 0) / NAMED_STARS.length,
};

/** Гномоническая (тангенциальная) проекция с центром в CENTER */
function gnomonic(raDeg: number, decDeg: number): { u: number; v: number } {
    const a = rad(raDeg);
    const d = rad(decDeg);
    const a0 = rad(CENTER.ra);
    const d0 = rad(CENTER.dec);
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

/** Каталог Gaia DR3 с подставленными именами, отсортирован по яркости */
export const CATALOG: CatalogStar[] = (() => {
    const stars: CatalogStar[] = rawStars.map(s => ({
        ra: s.ra,
        dec: s.dec,
        mag: s.magnitude,
        name: null,
        u: 0,
        v: 0,
    }));

    const MATCH_RADIUS = 30 / 3600; // 30 угловых секунд
    for (const named of NAMED_STARS) {
        let best: CatalogStar | null = null;
        let bestD2 = Infinity;
        for (const s of stars) {
            const dra = (s.ra - named.ra) * Math.cos(rad(named.dec));
            const dde = s.dec - named.dec;
            const d2 = dra * dra + dde * dde;
            if (d2 < bestD2) {
                bestD2 = d2;
                best = s;
            }
        }
        if (best && Math.sqrt(bestD2) < MATCH_RADIUS) best.name = named.name;
    }

    stars.sort((a, b) => a.mag - b.mag);
    for (const s of stars) {
        const p = gnomonic(s.ra, s.dec);
        s.u = p.u;
        s.v = p.v;
    }
    return stars;
})();

/** Порог яркости, при котором видны N ярчайших звёзд каталога
 *  (с округлением вверх до шага слайдера 0.05, чтобы N-я не выпадала) */
export function magForCount(n: number): number {
    const i = Math.min(n, CATALOG.length) - 1;
    return Math.ceil(CATALOG[i].mag / 0.05) * 0.05;
}
