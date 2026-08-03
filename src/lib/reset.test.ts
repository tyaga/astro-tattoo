import { describe, expect, it } from 'vitest';
import { DEFAULTS, PRESET_FIELDS, tabFields } from './fields';
import { resetTab } from './reset';
import { TABS } from '../components/panels/types';
import type { Settings } from './types';

/** Всё перекручено: так видно, какие поля вкладка возвращает, а какие нет */
const messy: Settings = {
    ...DEFAULTS,
    targetId: 'camelopardalis',
    magLimit: 2.5,
    showLines: false,
    lineMm: 1.2,
    backgroundStars: 'show',
    markerMm: 12,
    markerRotDeg: 40,
    voyagerAspect: true,
    rotation: 47,
    flipX: true,
    maxMm: 3.6,
    labels: 'full',
    skinTone: '#123456',
    inkOpacity: 0.4,
    bodyRotDeg: 33,
    widthCm: 9,
    gridMm: 5,
    exportBw: false,
    theme: 'dark',
    previewZoom: 2.5,
};

const changedKeys = (before: Settings, after: Settings) =>
    (Object.keys(before) as (keyof Settings)[])
        .filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));

describe('сброс по вкладкам', () => {
    for (const tab of TABS) {
        it(`«${tab}» трогает только свои поля`, () => {
            const changed = changedKeys(messy, resetTab(messy, tab));
            const own = tabFields(tab);
            for (const key of changed) expect(own).toContain(key);
        });
    }

    it('вместе вкладки возвращают всё, кроме объектных и общеприложенческих полей', () => {
        let s = messy;
        for (const tab of TABS) s = resetTab(s, tab);
        // отличаться от общих умолчаний вправе только то, что считается
        // по объекту, и то, что вкладкам не принадлежит вовсе
        const allowed = new Set([...PRESET_FIELDS, 'targetId', 'theme', 'lang', 'previewZoom']);
        for (const key of changedKeys(s, DEFAULTS)) expect([...allowed]).toContain(key);
    });

    it('не теряет выбранный объект', () => {
        for (const tab of TABS) {
            expect(resetTab(messy, tab).targetId).toBe('camelopardalis');
        }
    });

    it('поля с расчётным умолчанием берутся у объекта, а не из общих', () => {
        const back = resetTab(messy, 'draw');
        // у Жирафа самая тусклая звезда фигуры около 4.8ᵐ, поэтому предел
        // яркости после сброса заметно отличается от общего умолчания
        expect(back.magLimit).not.toBe(DEFAULTS.magLimit);
        expect(back.magLimit).toBeGreaterThan(4);
        expect(back.magLimit).toBeLessThan(6);
    });
});
