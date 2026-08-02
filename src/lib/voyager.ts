export interface Probe {
    id: string;
    name: string;
    ru: string;
    /** Прямое восхождение и склонение на дату эпохи, градусы */
    ra: number;
    dec: number;
    /** Расстояние от Земли, астрономические единицы */
    au: number;
    /** Сокращение созвездия, в котором аппарат виден с Земли */
    constellation: string;
}

interface Ephemeris {
    epoch: string;
    probes: Probe[];
}

/** Запасной снимок на случай сборки без сети: положение меняется медленно —
 *  за год «Вояджер-1» смещается по небу примерно на четверть градуса */
const FALLBACK: Ephemeris = {
    epoch: '2026-08-02',
    probes: [
        {
            id: 'voyager1', name: 'Voyager 1', ru: 'Вояджер-1',
            ra: 258.68637, dec: 12.36714, au: 170.82, constellation: 'Oph',
        },
        {
            id: 'voyager2', name: 'Voyager 2', ru: 'Вояджер-2',
            ra: 302.99554, dec: -59.81728, au: 142.81, constellation: 'Pav',
        },
    ],
};

/** Эфемериды кладёт scripts/fetch-catalogs.mjs при сборке (JPL Horizons) */
const files = import.meta.glob<Ephemeris>('../data/voyager.json', {
    eager: true,
    import: 'default',
});

const data: Ephemeris = Object.values(files)[0] ?? FALLBACK;

export const VOYAGERS: Probe[] = data.probes;
/** Дата, на которую посчитано положение */
export const VOYAGER_EPOCH: string = data.epoch;

/** Канопус — опорная звезда датчика крена «Вояджера»: аппарат держит
 *  вращение вокруг оси «на Землю» так, чтобы Канопус оставался на месте.
 *  Координаты J2000. */
const CANOPUS = { ra: 95.98796, dec: -52.69566 };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Позиционный угол направления A→B на небе: от севера к востоку, градусы */
function positionAngle(a: { ra: number; dec: number }, b: { ra: number; dec: number }): number {
    const dRa = rad(b.ra - a.ra);
    const d1 = rad(a.dec);
    const d2 = rad(b.dec);
    const y = Math.sin(dRa) * Math.cos(d2);
    const x = Math.cos(d1) * Math.sin(d2) - Math.sin(d1) * Math.cos(d2) * Math.cos(dRa);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Чем аппарат повёрнут к Земле: тарелка всегда направлена на нас — иначе
 *  не было бы связи, — а крен задан датчиком Канопуса. Отсюда и ракурс:
 *  круг тарелки анфас, штанги смотрят в сторону Канопуса. */
export function earthAspect(probe: Probe): { rollDeg: number } {
    return { rollDeg: positionAngle(probe, CANOPUS) };
}

/** Созвездие, в котором аппарат виден с Земли — по нему ищем нужный объект */
export const PROBE_TARGET: Record<string, string> = {
    Oph: 'ophiuchus',
    Pav: 'pavo',
};
