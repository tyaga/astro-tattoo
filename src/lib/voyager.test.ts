import { describe, expect, it } from 'vitest';
import { VOYAGERS, VOYAGER_EPOCH, earthAspect } from './voyager';
import { markerRotation } from './model';
import { DEFAULTS } from './fields';
import type { Probe } from './voyager';

/** Канопус — опорная звезда датчика крена; координаты те же, что в voyager.ts */
const CANOPUS = { ra: 95.98796, dec: -52.69566 };

const probe = (ra: number, dec: number): Probe =>
    ({ id: 'test', name: 'test', ru: 'тест', ra, dec, au: 100, constellation: 'Xxx' });

describe('ракурс аппарата', () => {
    it('если Канопус прямо к северу, крен нулевой', () => {
        const { rollDeg } = earthAspect(probe(CANOPUS.ra, CANOPUS.dec - 1));
        expect(rollDeg).toBeCloseTo(0, 1);
    });

    it('если Канопус прямо к югу, крен 180°', () => {
        const { rollDeg } = earthAspect(probe(CANOPUS.ra, CANOPUS.dec + 1));
        expect(rollDeg).toBeCloseTo(180, 1);
    });

    it('если Канопус к востоку, крен около 90°', () => {
        // прямое восхождение растёт к востоку
        const { rollDeg } = earthAspect(probe(CANOPUS.ra - 0.01, CANOPUS.dec));
        expect(rollDeg).toBeGreaterThan(89);
        expect(rollDeg).toBeLessThan(91);
    });

    it('угол всегда в пределах круга', () => {
        for (const p of VOYAGERS) {
            const { rollDeg } = earthAspect(p);
            expect(rollDeg).toBeGreaterThanOrEqual(0);
            expect(rollDeg).toBeLessThan(360);
        }
    });
});

describe('эфемериды', () => {
    it('оба аппарата на месте и далеко', () => {
        expect(VOYAGERS.map(p => p.id)).toEqual(['voyager1', 'voyager2']);
        for (const p of VOYAGERS) {
            // «Вояджер-1» перевалил за 160 а.е. ещё в 2023 году
            expect(p.au).toBeGreaterThan(130);
            expect(p.dec).toBeGreaterThanOrEqual(-90);
            expect(p.dec).toBeLessThanOrEqual(90);
            expect(p.ra).toBeGreaterThanOrEqual(0);
            expect(p.ra).toBeLessThan(360);
        }
    });

    it('дата эпохи разбирается', () => {
        expect(Number.isFinite(Date.parse(VOYAGER_EPOCH))).toBe(true);
    });
});

describe('разворот значка на полотне', () => {
    const base = { ...DEFAULTS, targetId: 'camelopardalis' };

    it('без галочки — ровно то, что выставил пользователь', () => {
        expect(markerRotation({ ...base, markerRotDeg: 30 })).toBe(30);
    });

    it('с галочкой доворачивается вслед за поворотом эскиза', () => {
        const still = markerRotation({ ...base, voyagerAspect: true });
        const turned = markerRotation({ ...base, voyagerAspect: true, rotation: 90 });
        expect(turned - still).toBeCloseTo(-90, 6);
    });

    it('зеркало меняет направление отсчёта', () => {
        const normal = markerRotation({ ...base, voyagerAspect: true });
        const mirrored = markerRotation({ ...base, voyagerAspect: true, flipX: true });
        expect(mirrored).toBeCloseTo(-normal, 6);
    });

    it('свой угол складывается с расчётным', () => {
        const auto = markerRotation({ ...base, voyagerAspect: true });
        expect(markerRotation({ ...base, voyagerAspect: true, markerRotDeg: 25 }))
            .toBeCloseTo(auto + 25, 6);
    });

    it('у аппаратов крен разный: они смотрят с разных мест неба', () => {
        const s = { ...base, voyagerAspect: true };
        expect(markerRotation(s, 'voyager1')).not.toBeCloseTo(markerRotation(s, 'voyager2'), 1);
    });
});
