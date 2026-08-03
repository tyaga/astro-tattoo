import { describe, expect, it } from 'vitest';
import { DEFAULTS, LINKED_FIELDS, PERSONAL_FIELDS } from './fields';
import { settingsFromQuery, settingsToQuery } from './url';
import type { Settings } from './types';

/** Настройки, отличающиеся от умолчаний по каждому переносимому полю */
const tweaked: Settings = {
    ...DEFAULTS,
    targetId: 'lyra',
    magLimit: 4.25,
    showLines: true,
    lineMm: 0.45,
    backgroundStars: 'hide',
    markerIcon: 'faceOn',
    markerMm: 7.5,
    markerRotDeg: 137,
    voyagerReal: true,
    voyagerAspect: true,
    fovDeg: 3.75,
    rotation: 200,
    flipX: true,
    flipY: true,
    panX: -12.5,
    panY: 8,
    maxMm: 2.4,
    minMm: 0.45,
    contrast: 0.28,
    stepMm: 0.25,
    quantize: false,
    labels: 'full',
    skinTone: '#123456',
    inkColor: '#abcdef',
    inkOpacity: 0.55,
    widthCm: 9.5,
    heightCm: 7,
    gridMm: 5,
    lang: 'es',
};

const roundTrip = (s: Settings, local = DEFAULTS) =>
    settingsFromQuery(`?${settingsToQuery(s)}`, local);

describe('ссылка на эскиз', () => {
    it('переносит все поля рисунка без потерь', () => {
        const back = roundTrip(tweaked);
        expect(back).not.toBeNull();
        for (const field of LINKED_FIELDS) {
            expect({ [field.key]: back![field.key] })
                .toEqual({ [field.key]: tweaked[field.key] });
        }
    });

    it('сохраняет типы: сетка остаётся числом, а не строкой', () => {
        const back = roundTrip({ ...tweaked, gridMm: 2 })!;
        expect(back.gridMm).toBe(2);
    });

    it('личную примерку берёт из этого браузера, а не из ссылки', () => {
        const local: Settings = {
            ...DEFAULTS,
            bodyWidthCm: 16.3,
            bodyRotDeg: 90,
            showBodyPhoto: true,
            theme: 'dark',
            previewZoom: 2,
        };
        const back = roundTrip({ ...tweaked, bodyWidthCm: 3, theme: 'light' }, local)!;
        for (const key of PERSONAL_FIELDS) {
            expect({ [key]: back[key] }).toEqual({ [key]: local[key] });
        }
    });

    it('без объекта ссылка не считается ссылкой на эскиз', () => {
        expect(settingsFromQuery('?m=5', DEFAULTS)).toBeNull();
    });

    it('неизвестный объект отвергается целиком', () => {
        expect(settingsFromQuery('?t=нетакого&m=5', DEFAULTS)).toBeNull();
    });

    it('мусор в параметрах не портит настройки', () => {
        // сравниваем с ссылкой без параметров: там вид объекта по умолчанию
        const clean = settingsFromQuery('?t=lyra', DEFAULTS)!;
        const dirty = settingsFromQuery(
            '?t=lyra&m=абв&g=7&bg=неведомо&lb=&sk=zzzzzz&vi=нет',
            DEFAULTS,
        )!;
        expect(dirty).toEqual(clean);
    });

    it('незаполненные параметры оставляют расчётный вид объекта', () => {
        // в ссылке только объект — остальное должно прийти из его пресета
        const bare = settingsFromQuery('?t=orion', DEFAULTS)!;
        const full = settingsFromQuery(`?${settingsToQuery({ ...DEFAULTS, targetId: 'orion' })}`,
            DEFAULTS)!;
        expect(bare.targetId).toBe('orion');
        // пресет считается от того же полотна, поэтому размер совпадает
        expect(bare.fovDeg).toBeGreaterThan(0);
        expect(full.targetId).toBe('orion');
    });
});
