import { describe, expect, it } from 'vitest';
import { dotDiameterMm } from './dots';

const scale = { maxMm: 2, minMm: 0.4, contrast: 0.3 };

describe('диаметр точки по звёздной величине', () => {
    it('ярчайшая звезда получает максимальный диаметр', () => {
        expect(dotDiameterMm(scale, 1.5, 1.5)).toBe(2);
    });

    it('чем тусклее звезда, тем меньше точка', () => {
        const bright = dotDiameterMm(scale, 1, 0);
        const faint = dotDiameterMm(scale, 3, 0);
        expect(faint).toBeLessThan(bright);
        expect(bright).toBeLessThan(2);
    });

    it('никогда не выходит за границы диапазона', () => {
        // звезда ярче опорной — точка не должна перерасти максимум
        expect(dotDiameterMm(scale, -2, 0)).toBe(2);
        // и совсем тусклая не должна стать тоньше иглы
        expect(dotDiameterMm(scale, 20, 0)).toBe(0.4);
    });

    it('нулевой контраст делает все точки одинаковыми', () => {
        const flat = { ...scale, contrast: 0 };
        expect(dotDiameterMm(flat, 6, 0)).toBe(dotDiameterMm(flat, 1, 0));
    });

    it('контраст равен показателю степени потока', () => {
        // разница в 2.5ᵐ — это ровно десятикратный поток;
        // при contrast = 1 диаметр падает в те же десять раз
        const one = { maxMm: 10, minMm: 0.001, contrast: 1 };
        expect(dotDiameterMm(one, 2.5, 0)).toBeCloseTo(1, 6);
    });

    it('квантование округляет к сетке шага и не даёт нуля', () => {
        const q = { ...scale, quantize: true as const, stepMm: 0.25 };
        expect(dotDiameterMm(q, 3, 0) % 0.25).toBeCloseTo(0, 9);
        expect(dotDiameterMm(q, 30, 0)).toBeGreaterThanOrEqual(0.25);
    });

    it('без шага квантование ничего не меняет', () => {
        const q = { ...scale, quantize: true as const };
        expect(dotDiameterMm(q, 2, 0)).toBe(dotDiameterMm(scale, 2, 0));
    });
});
