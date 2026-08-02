import type { Lang } from '../i18n/strings';

export type LabelsMode = 'none' | 'names' | 'full';

/** Что делать со звёздами, не входящими в фигуру */
export type BackgroundMode = 'show' | 'fade' | 'hide';

/** Каким рисовать «Вояджер» у Глизе 445 */
export type MarkerIcon = 'silhouette' | 'schema' | 'minimal' | 'record' | 'classic';

/** Тема интерфейса; auto — следовать системной настройке */
export type Theme = 'auto' | 'light' | 'dark';

/** Шаг миллиметровой сетки; 0 — сетка выключена */
export type GridMm = 0 | 1 | 2 | 5;

export interface Settings {
    /** Идентификатор объекта из targets.json */
    targetId: string;
    /** Предельная звёздная величина: показываем звёзды ярче */
    magLimit: number;
    widthCm: number;
    heightCm: number;
    /** Радиус поля зрения, градусы */
    fovDeg: number;
    /** Поворот, градусы */
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    /** Сдвиг поля, мм */
    panX: number;
    panY: number;
    /** Диаметр точки ярчайшей звезды, мм */
    maxMm: number;
    /** Минимальный диаметр точки, мм */
    minMm: number;
    /** Диаметр ∝ (поток)^contrast */
    contrast: number;
    /** Шаг квантования диаметров, мм */
    stepMm: number;
    quantize: boolean;
    labels: LabelsMode;
    gridMm: GridMm;
    /** Соединять звёзды линиями фигуры созвездия */
    showLines: boolean;
    /** Толщина линий фигуры, мм */
    lineMm: number;
    /** Звёзды вне фигуры: показывать, приглушить или убрать совсем */
    backgroundStars: BackgroundMode;
    /** Значок особой точки: у Жирафа это «Вояджер» */
    markerIcon: MarkerIcon;
    /** Экранный масштаб предпросмотра (на эскиз не влияет) */
    previewZoom: number;
    /** Тема интерфейса — на эскиз и экспорт не влияет */
    theme: Theme;
    /** Язык интерфейса и подписей */
    lang: Lang;
    /** Цвет полотна — оттенок кожи */
    skinTone: string;
    /** Цвет чернил */
    inkColor: string;
    /** Плотность чернил: зажившая работа слегка просвечивает */
    inkOpacity: number;
    /** Экспортировать чёрным по белому, игнорируя цвета предпросмотра */
    exportBw: boolean;
    /** Фото-подложка для сравнения (не попадает в экспорт) */
    showPhoto: boolean;
    photoOpacity: number;
    /** Фото запястья под эскизом (не попадает в экспорт) */
    showWrist: boolean;
    /** Ширина кадра фото запястья в реальных см полотна.
     *  Высота выводится из пропорций снимка — фото не должно растягиваться. */
    wristWidthCm: number;
    wristOffX: number;
    wristOffY: number;
    wristRotDeg: number;
    wristOpacity: number;
}

/** Именованный набор настроек, сохранённый пользователем */
export interface Preset {
    id: string;
    name: string;
    settings: Settings;
}

/** Загруженное фото запястья (хранится отдельно от Settings) */
export interface WristImage {
    /** data-URL (jpeg, уменьшенный) */
    url: string;
    /** высота / ширина */
    aspect: number;
}

export interface DrawnStar {
    /** индекс звезды в каталоге объекта — по нему находятся линии фигуры */
    i: number;
    /** мм от левого края полотна */
    X: number;
    /** мм от верхнего края полотна */
    Y: number;
    /** диаметр точки, мм */
    d: number;
    mag: number;
    name: string | null;
}
