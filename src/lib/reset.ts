import { DEFAULTS, PRESET_FIELDS, tabFields } from './fields';
import { applyTargetPreset } from './model';
import type { Settings } from './types';
import type { Tab } from '../components/panels/types';

/** Возвращает к умолчаниям только то, что настраивается на этой вкладке.
 *  Состав вкладок и признак «умолчание зависит от объекта» описаны
 *  в fields.ts, поэтому новая настройка попадает в сброс сама.
 *  Загруженное фото и сохранённые пресеты не трогаются — это не настройка. */
export function resetTab(s: Settings, tab: Tab): Settings {
    // размер рисунка считается от текущего полотна, поэтому пресет применяем
    // к нынешним настройкам, а не к пустым
    const preset = applyTargetPreset(s, s.targetId);
    const next = { ...s };
    for (const key of tabFields(tab)) {
        const source = PRESET_FIELDS.has(key) ? preset : DEFAULTS;
        Object.assign(next, { [key]: source[key] });
    }
    return next;
}
