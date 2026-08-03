import { describe, expect, it } from 'vitest';
import {
    TARGETS, ensureCatalog, getCatalog, getLines, isFullCatalog, projectPoint, projectionCenter,
} from './catalog';

const target = TARGETS.find(t => t.id === 'orion')!;
const haveData = getCatalog('orion').length > 0;
// проекция строится вокруг центра фигуры, а не вокруг center из targets.json
const centre = projectionCenter(target);

describe('гномоническая проекция', () => {
    it('центр объекта попадает в начало координат', () => {
        const { u, v } = projectPoint(target, centre.ra, centre.dec);
        expect(u).toBeCloseTo(0, 9);
        expect(v).toBeCloseTo(0, 9);
    });

    it('градус к северу даёт тангенс градуса по вертикали', () => {
        const { u, v } = projectPoint(target, centre.ra, centre.dec + 1);
        expect(u).toBeCloseTo(0, 9);
        expect(v).toBeCloseTo(Math.tan(Math.PI / 180), 6);
    });

    it('восток уходит в плюс по горизонтали, запад — в минус', () => {
        const east = projectPoint(target, centre.ra + 1, centre.dec);
        const west = projectPoint(target, centre.ra - 1, centre.dec);
        expect(east.u).toBeGreaterThan(0);
        expect(west.u).toBeCloseTo(-east.u, 6);
    });

    it('масштаб симметричен относительно центра', () => {
        const north = projectPoint(target, centre.ra, centre.dec + 2);
        const south = projectPoint(target, centre.ra, centre.dec - 2);
        expect(north.v).toBeCloseTo(-south.v, 3);
    });
});

describe.skipIf(!haveData)('каталог и выжимка фигур', () => {
    it('сразу доступна фигура, а не весь каталог', () => {
        // ленту миниатюр рисуем по выжимке, поэтому у необработанных объектов
        // звёзды есть, но каталог ещё не полный
        const untouched = TARGETS.find(t => !isFullCatalog(t.id))!;
        expect(getCatalog(untouched.id).length).toBeGreaterThan(0);
        expect(isFullCatalog(untouched.id)).toBe(false);
    });

    it('после подгрузки звёзд становится больше, а линии остаются в силе', async () => {
        const id = 'orion';
        const figureStars = getCatalog(id).length;
        const figureLines = getLines(id).length;

        await ensureCatalog(id);

        expect(isFullCatalog(id)).toBe(true);
        expect(getCatalog(id).length).toBeGreaterThan(figureStars);
        expect(getLines(id).length).toBe(figureLines);
    });

    it('каталог отсортирован по яркости — отрисовка на это опирается', async () => {
        await ensureCatalog('orion');
        const mags = getCatalog('orion').map(s => s.mag);
        for (let i = 1; i < mags.length; i++) {
            expect(mags[i]).toBeGreaterThanOrEqual(mags[i - 1]);
        }
    });

    it('линии ссылаются на существующие звёзды', async () => {
        await ensureCatalog('orion');
        const stars = getCatalog('orion');
        for (const [a, b] of getLines('orion')) {
            expect(stars[a]).toBeDefined();
            expect(stars[b]).toBeDefined();
        }
    });

    it('в выжимке линии тоже согласованы со звёздами', () => {
        const fresh = TARGETS.find(t => !isFullCatalog(t.id) && getLines(t.id).length > 0)!;
        const stars = getCatalog(fresh.id);
        for (const [a, b] of getLines(fresh.id)) {
            expect(stars[a]).toBeDefined();
            expect(stars[b]).toBeDefined();
        }
    });
});
