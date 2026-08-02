import { LANGS, STRINGS } from './strings';
import type { Lang, StringKey } from './strings';

export { LANGS, LANG_LABELS, LANG_TITLES } from './strings';
export type { Lang, StringKey } from './strings';

/** Локализованная строка. Язык приходит из настроек, поэтому передаётся явно —
 *  контекст ради одного значения тут не окупается. */
export function t(lang: Lang, key: StringKey): string {
    return STRINGS[lang][key] ?? STRINGS.ru[key];
}

/** Язык браузера, если он у нас есть; иначе английский */
export function detectLang(): Lang {
    if (typeof navigator === 'undefined') return 'en';
    for (const tag of navigator.languages ?? [navigator.language]) {
        const code = tag.slice(0, 2).toLowerCase();
        const match = LANGS.find(l => l === code);
        if (match) return match;
    }
    return 'en';
}

/** Значение из словаря вида { ru, en, is, nl } */
export function pick(dict: Record<string, string>, lang: Lang): string {
    return dict[lang] ?? dict.en ?? dict.ru ?? '';
}
