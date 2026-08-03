import { LANGS } from '../i18n/strings';
import type { Settings } from './types';
import type { Tab } from '../components/panels/types';

/** Одно описание на каждую настройку — из него выводятся значения
 *  по умолчанию, сброс по вкладкам, память по объектам и ссылка.
 *
 *  Раньше эти списки жили в четырёх файлах, и достаточно было забыть
 *  один, чтобы настройка тихо перестала работать: так зеркала выпали
 *  из ссылки. Тип ниже требует запись на каждое поле Settings, поэтому
 *  забыть больше нельзя — не соберётся. */

/** Где настройка живёт: по этому же признаку работает «сбросить вкладку».
 *  app — не относится ни к одной вкладке (объект, тема, язык, масштаб). */
type Scope = Tab | 'app';

type Link =
    /** Переносится ссылкой: короткое имя параметра и как читать значение */
    | { param: string; kind: 'num' | 'bool' | 'hex' | 'str' }
    | { param: string; kind: 'enum'; values: readonly (string | number)[] }
    /** Личная примерка: остаётся в этом браузере, по ссылке не уезжает */
    | { personal: true };

interface Field<K extends keyof Settings> {
    default: Settings[K];
    scope: Scope;
    /** Умолчание берётся из расчётного вида объекта, а не из этой таблицы */
    preset?: true;
    /** Запоминается отдельно для каждого объекта */
    perTarget?: true;
    link: Link;
}

const GRIDS = [0, 1, 2, 5] as const;
const LABELS = ['none', 'names', 'full'] as const;
const BACKGROUNDS = ['show', 'fade', 'hide'] as const;
const ICONS = ['silhouette', 'schema', 'minimal', 'faceOn', 'record', 'classic'] as const;

export const FIELDS: { [K in keyof Settings]: Field<K> } = {
    targetId: { default: 'pleiades', scope: 'app', link: { param: 't', kind: 'str' } },

    // ——— рисунок
    magLimit: {
        default: 6.1, scope: 'draw', preset: true, perTarget: true,
        link: { param: 'm', kind: 'num' },
    },
    showLines: {
        default: false, scope: 'draw', preset: true, perTarget: true,
        link: { param: 'ln', kind: 'bool' },
    },
    lineMm: {
        default: 0.3, scope: 'draw', preset: true, perTarget: true,
        link: { param: 'lw', kind: 'num' },
    },
    backgroundStars: {
        default: 'show', scope: 'draw', preset: true, perTarget: true,
        link: { param: 'bg', kind: 'enum', values: BACKGROUNDS },
    },
    markerIcon: {
        default: 'silhouette', scope: 'draw',
        link: { param: 'vi', kind: 'enum', values: ICONS },
    },
    markerMm: { default: 4, scope: 'draw', link: { param: 'vs', kind: 'num' } },
    markerRotDeg: { default: 0, scope: 'draw', link: { param: 'vr', kind: 'num' } },
    voyagerReal: { default: false, scope: 'draw', link: { param: 'vp', kind: 'bool' } },
    voyagerAspect: { default: false, scope: 'draw', link: { param: 'va', kind: 'bool' } },

    // ——— вид
    fovDeg: {
        default: 1.65, scope: 'look', preset: true, perTarget: true,
        link: { param: 'f', kind: 'num' },
    },
    rotation: {
        default: 0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'r', kind: 'num' },
    },
    flipX: { default: false, scope: 'look', link: { param: 'fx', kind: 'bool' } },
    flipY: { default: false, scope: 'look', link: { param: 'fy', kind: 'bool' } },
    panX: {
        default: 0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'px', kind: 'num' },
    },
    panY: {
        default: 0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'py', kind: 'num' },
    },
    maxMm: {
        default: 4.0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'd', kind: 'num' },
    },
    minMm: {
        default: 1.0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'dm', kind: 'num' },
    },
    contrast: {
        default: 0.5, scope: 'look', preset: true, perTarget: true,
        link: { param: 'c', kind: 'num' },
    },
    stepMm: {
        default: 1.0, scope: 'look', preset: true, perTarget: true,
        link: { param: 'q', kind: 'num' },
    },
    quantize: {
        default: true, scope: 'look', preset: true, perTarget: true,
        link: { param: 'qz', kind: 'bool' },
    },
    labels: {
        default: 'names', scope: 'look', preset: true, perTarget: true,
        link: { param: 'lb', kind: 'enum', values: LABELS },
    },

    // ——— тело
    skinTone: { default: '#efcbb0', scope: 'body', link: { param: 'sk', kind: 'hex' } },
    inkColor: { default: '#1e2127', scope: 'body', link: { param: 'ik', kind: 'hex' } },
    inkOpacity: { default: 0.92, scope: 'body', link: { param: 'io', kind: 'num' } },
    showBodyPhoto: { default: true, scope: 'body', link: { personal: true } },
    bodyWidthCm: { default: 16.3, scope: 'body', link: { personal: true } },
    bodyOffX: { default: 0, scope: 'body', link: { personal: true } },
    bodyOffY: { default: 0, scope: 'body', link: { personal: true } },
    bodyRotDeg: { default: 90, scope: 'body', link: { personal: true } },
    bodyOpacity: { default: 0.75, scope: 'body', link: { personal: true } },
    showPhoto: { default: false, scope: 'body', link: { personal: true } },
    photoOpacity: { default: 0.85, scope: 'body', link: { personal: true } },

    // ——— печать
    widthCm: { default: 21.5, scope: 'print', link: { param: 'w', kind: 'num' } },
    heightCm: { default: 16.5, scope: 'print', link: { param: 'h', kind: 'num' } },
    gridMm: {
        default: 1, scope: 'print',
        link: { param: 'g', kind: 'enum', values: GRIDS },
    },
    exportBw: { default: true, scope: 'print', link: { personal: true } },

    // ——— приложение
    previewZoom: { default: 1, scope: 'app', link: { personal: true } },
    theme: { default: 'auto', scope: 'app', link: { personal: true } },
    lang: { default: 'ru', scope: 'app', link: { param: 'lang', kind: 'enum', values: LANGS } },
};

type Key = keyof Settings;

const entries = Object.entries(FIELDS) as [Key, Field<Key>][];

const keysWhere = (test: (f: Field<Key>) => boolean): Key[] =>
    entries.filter(([, f]) => test(f)).map(([key]) => key);

/** Значения по умолчанию — ровно те, что записаны в таблице */
export const DEFAULTS: Settings = Object.fromEntries(
    entries.map(([key, f]) => [key, f.default]),
) as unknown as Settings;

/** Поля вкладки: их возвращает «сбросить вкладку» */
export const tabFields = (tab: Tab): Key[] => keysWhere(f => f.scope === tab);

/** Поля, чьё умолчание зависит от объекта */
export const PRESET_FIELDS: Set<Key> = new Set(keysWhere(f => Boolean(f.preset)));

/** Поля, которые запоминаются отдельно для каждого объекта */
export const TARGET_FIELDS: Key[] = keysWhere(f => Boolean(f.perTarget));

/** Поля, которые не уезжают по ссылке, а берутся из этого браузера */
export const PERSONAL_FIELDS: Key[] = keysWhere(f => 'personal' in f.link);

/** Поля, которые ссылка переносит, вместе с их параметрами */
export const LINKED_FIELDS = entries
    .filter((pair): pair is [Key, Field<Key> & { link: Exclude<Link, { personal: true }> }] =>
        !('personal' in pair[1].link))
    .map(([key, f]) => ({ key, ...f.link }));
