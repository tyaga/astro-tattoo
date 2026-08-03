import { describe, expect, it } from 'vitest';
import { autoPreset } from './autopreset';
import { TARGETS, ensureCatalog, getCatalog, getLines } from './catalog';
import { NAKED_EYE_MAG, drawableCount, magForDrawnCount, magRange } from './model';
import { DEFAULTS } from './fields';

/** Данные выгружаются скриптом; без них проверять нечего */
const haveData = TARGETS.some(t => getCatalog(t.id).length > 0);

describe.skipIf(!haveData)('расчётный пресет объекта', () => {
    const STEPS = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5];

    for (const target of TARGETS) {
        it(`${target.id}: значения в разумных пределах`, () => {
            const p = autoPreset(target.id);

            expect(p.patternCm).toBeGreaterThanOrEqual(3.5);
            expect(p.patternCm).toBeLessThanOrEqual(9);
            expect(p.magLimit).toBeLessThanOrEqual(target.fetchMagLimit);

            expect(p.minMm).toBeGreaterThanOrEqual(0.35);
            expect(p.minMm).toBeLessThan(p.maxMm);
            expect(p.maxMm).toBeLessThanOrEqual(2.6);

            expect(p.contrast).toBeGreaterThanOrEqual(0.15);
            expect(p.contrast).toBeLessThanOrEqual(0.5);
            expect(STEPS).toContain(p.stepMm);

            expect(['show', 'fade', 'hide']).toContain(p.backgroundStars);
            expect(['none', 'names', 'full']).toContain(p.labels);
            // линии рисуем ровно тогда, когда они для объекта есть
            expect(p.showLines).toBe(getLines(target.id).length > 0);
        });
    }

    it('размер растёт с числом звёзд фигуры', () => {
        // у Стрелы четыре звезды, у Ориона больше двадцати
        expect(autoPreset('sagitta').patternCm)
            .toBeLessThan(autoPreset('orion').patternCm);
    });

    it('ручная поправка из targets.json перебивает расчёт', () => {
        // Скорпиону задан привычный разворот
        expect(autoPreset('scorpius').rotation).toBe(337);
    });
});

describe.skipIf(!haveData)('шкала предела яркости', () => {
    for (const target of TARGETS) {
        it(`${target.id}: засечка предела глаза внутри шкалы`, () => {
            const { min, max } = magRange(target.id);
            expect(min).toBeLessThan(max);
            expect(min).toBeLessThan(NAKED_EYE_MAG);
            expect(max).toBeGreaterThan(NAKED_EYE_MAG);
            expect(max).toBeLessThanOrEqual(target.fetchMagLimit);
        });
    }

    it('левый край — по фигуре, а не по чужим ярким звёздам поля', async () => {
        // в поле Жирафа попадает Капелла (0.08ᵐ), но его собственная
        // ярчайшая звезда около 4ᵐ — с неё и должна начинаться шкала.
        // Чужие светила приходят только с полным каталогом
        await ensureCatalog('camelopardalis');
        expect(getCatalog('camelopardalis')[0].mag).toBeLessThan(1);
        expect(magRange('camelopardalis').min).toBeGreaterThan(3.5);
    });

    it('текущее значение не выпадает из шкалы', () => {
        const { min, max } = magRange('camelopardalis', 6.9);
        expect(max).toBeGreaterThanOrEqual(6.9);
        expect(min).toBeLessThanOrEqual(6.9);
    });
});

describe.skipIf(!haveData)('количество точек', () => {
    it('кнопка обещает столько звёзд, сколько попадёт на эскиз', async () => {
        await ensureCatalog('orion');
        const s = { ...DEFAULTS, targetId: 'orion', backgroundStars: 'hide' as const };
        for (const n of [5, 9, 14]) {
            const limit = magForDrawnCount(s, n);
            const drawn = getCatalog('orion').filter(star => star.mag <= limit);
            // считаем только те, что рисуются в этом режиме
            const linked = new Set(getLines('orion').flat());
            const figure = drawn.filter((star, i) => linked.has(i) || star.name);
            expect(figure.length).toBeGreaterThanOrEqual(n);
        }
    });

    it('в режиме «только фигура» доступных точек меньше, чем в поле', async () => {
        await ensureCatalog('orion');
        const base = { ...DEFAULTS, targetId: 'orion' };
        expect(drawableCount({ ...base, backgroundStars: 'hide' }))
            .toBeLessThan(drawableCount({ ...base, backgroundStars: 'show' }));
    });
});
