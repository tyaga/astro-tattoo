export type LabelsMode = 'none' | 'names' | 'full';

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
    /** Экранный масштаб предпросмотра (на эскиз не влияет) */
    previewZoom: number;
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
    /** Угловая ширина фото, градусы */
    photoFovDeg: number;
    /** Поворот фото относительно неба, градусы */
    photoRotDeg: number;
    /** Фото запястья под эскизом (не попадает в экспорт) */
    showWrist: boolean;
    /** Ширина кадра фото запястья в реальных см полотна */
    wristWidthCm: number;
    /** Высота кадра, см — независимая, чтобы компенсировать перспективу */
    wristHeightCm: number;
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
    /** мм от левого края полотна */
    X: number;
    /** мм от верхнего края полотна */
    Y: number;
    /** диаметр точки, мм */
    d: number;
    mag: number;
    name: string | null;
}
