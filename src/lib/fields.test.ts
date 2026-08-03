import { describe, expect, it } from 'vitest';
import {
    DEFAULTS, FIELDS, LINKED_FIELDS, PERSONAL_FIELDS, PRESET_FIELDS, TARGET_FIELDS, tabFields,
} from './fields';
import { TABS } from '../components/panels/types';

const keys = Object.keys(FIELDS) as (keyof typeof FIELDS)[];

describe('таблица настроек', () => {
    it('описывает все поля и ничего лишнего', () => {
        expect(keys.length).toBeGreaterThan(30);
        expect(Object.keys(DEFAULTS).sort()).toEqual([...keys].sort());
    });

    it('каждое поле либо переносится ссылкой, либо личное', () => {
        const linked = LINKED_FIELDS.map(f => f.key);
        expect([...linked, ...PERSONAL_FIELDS].sort()).toEqual([...keys].sort());
        // и не то и другое одновременно
        expect(linked.filter(k => PERSONAL_FIELDS.includes(k))).toEqual([]);
    });

    it('короткие имена параметров не повторяются', () => {
        const params = LINKED_FIELDS.map(f => f.param);
        expect(new Set(params).size).toBe(params.length);
    });

    it('вкладки делят поля без пересечений', () => {
        const byTab = TABS.flatMap(tab => tabFields(tab));
        expect(new Set(byTab).size).toBe(byTab.length);
        // остальное — уровень приложения: объект, тема, язык, масштаб
        const rest = keys.filter(k => !byTab.includes(k));
        expect(rest.sort()).toEqual(['lang', 'previewZoom', 'targetId', 'theme']);
    });

    it('память по объектам — подмножество полей с расчётным умолчанием', () => {
        for (const key of TARGET_FIELDS) expect(PRESET_FIELDS.has(key)).toBe(true);
    });

    it('перечислимые поля умолчанием попадают в свой список значений', () => {
        for (const field of LINKED_FIELDS) {
            if (field.kind !== 'enum') continue;
            expect(field.values.map(String)).toContain(String(DEFAULTS[field.key]));
        }
    });

    it('цвета записаны шестизначным hex — иначе ссылка их не переварит', () => {
        for (const field of LINKED_FIELDS) {
            if (field.kind !== 'hex') continue;
            expect(String(DEFAULTS[field.key])).toMatch(/^#[0-9a-f]{6}$/);
        }
    });
});
