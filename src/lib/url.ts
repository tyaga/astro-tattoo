import { getTarget } from './catalog';
import { LINKED_FIELDS, PERSONAL_FIELDS } from './fields';
import { applyTargetPreset } from './model';
import { DEFAULTS } from './state';
import type { Settings } from './types';

type LinkedField = (typeof LINKED_FIELDS)[number];

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Значение настройки в виде параметра ссылки */
function encode(field: LinkedField, value: unknown): string {
    switch (field.kind) {
        case 'num':
            return String(round(value as number));
        case 'bool':
            return value ? '1' : '0';
        case 'hex':
            return String(value).replace('#', '');
        default:
            return String(value);
    }
}

/** Обратно: undefined, если в ссылке чепуха и настройку менять не нужно */
function decode(field: LinkedField, raw: string): unknown {
    switch (field.kind) {
        case 'num': {
            const value = Number(raw);
            return Number.isFinite(value) ? value : undefined;
        }
        case 'bool':
            return raw === '1';
        case 'hex':
            return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : undefined;
        case 'enum':
            // сравниваем строками, но возвращаем исходное значение:
            // у сетки это число, а не '1'
            return field.values.find(v => String(v) === raw);
        default:
            return raw;
    }
}

/** Ссылка на текущий вид: объект и все настройки рисунка.
 *  Личная примерка не попадает — она живёт только в этом браузере.
 *  Состав параметров задан таблицей в fields.ts, так что новая настройка
 *  переносится ссылкой сама. */
export function settingsToQuery(s: Settings): string {
    const p = new URLSearchParams();
    for (const field of LINKED_FIELDS) {
        p.set(field.param, encode(field, s[field.key]));
    }
    return p.toString();
}

/** Настройки из ссылки поверх вида по умолчанию для указанного объекта.
 *  Возвращает null, если объекта в ссылке нет.
 *
 *  Ссылка описывает рисунок, а не примерку: фото с его калибровкой,
 *  снимок неба и тема остаются такими, как настроены в этом браузере. */
export function settingsFromQuery(search: string, local: Settings): Settings | null {
    const p = new URLSearchParams(search);
    const id = p.get('t');
    if (!id) return null;
    const target = getTarget(id);
    if (target.id !== id) return null;

    const personal: Partial<Settings> = {};
    for (const key of PERSONAL_FIELDS) Object.assign(personal, { [key]: local[key] });

    const s = applyTargetPreset({ ...DEFAULTS, ...personal }, target.id);

    for (const field of LINKED_FIELDS) {
        const raw = p.get(field.param);
        if (raw === null) continue;
        const value = decode(field, raw);
        if (value !== undefined) Object.assign(s, { [field.key]: value });
    }
    return s;
}

export function shareUrl(s: Settings): string {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?${settingsToQuery(s)}`;
}
