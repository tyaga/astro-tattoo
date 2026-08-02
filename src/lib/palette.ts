export interface Swatch {
    /** Название по языкам */
    label: Record<string, string>;
    color: string;
}

/** Оттенки кожи — от фарфорового до тёмного, плюс белая бумага */
export const SKIN_TONES: Swatch[] = [
    { label: { ru: 'Фарфор', en: 'Porcelain', is: 'Postulín', nl: 'Porselein' }, color: '#f7e2d3' },
    { label: { ru: 'Светлая', en: 'Light', is: 'Ljós', nl: 'Licht' }, color: '#efcbb0' },
    { label: { ru: 'Средняя', en: 'Medium', is: 'Meðal', nl: 'Middel' }, color: '#ddac89' },
    { label: { ru: 'Загар', en: 'Tan', is: 'Sólbrún', nl: 'Getint' }, color: '#c2895f' },
    { label: { ru: 'Смуглая', en: 'Brown', is: 'Dökkbrún', nl: 'Bruin' }, color: '#8d5b3c' },
    { label: { ru: 'Тёмная', en: 'Dark', is: 'Dökk', nl: 'Donker' }, color: '#5b3826' },
    { label: { ru: 'Бумага', en: 'Paper', is: 'Pappír', nl: 'Papier' }, color: '#ffffff' },
];

/** Реалистичные цвета татуировочных чернил.
 *  Чистый чёрный в коже не встречается: свежая работа читается как
 *  тёмно-серая, зажившая уходит в сине-серый. */
export const INKS: Swatch[] = [
    { label: { ru: 'Чёрная, свежая', en: 'Fresh black', is: 'Ferskt svart', nl: 'Vers zwart' }, color: '#1e2127' },
    { label: { ru: 'Чёрная, зажившая', en: 'Healed black', is: 'Gróið svart', nl: 'Geheeld zwart' }, color: '#33455c' },
    { label: { ru: 'Серый вош', en: 'Grey wash', is: 'Grá þvæling', nl: 'Grijze wash' }, color: '#5f6a78' },
    { label: { ru: 'Индиго', en: 'Indigo', is: 'Indígó', nl: 'Indigo' }, color: '#293a72' },
    { label: { ru: 'Сепия', en: 'Sepia', is: 'Sepía', nl: 'Sepia' }, color: '#4a3427' },
    { label: { ru: 'Белая', en: 'White', is: 'Hvítt', nl: 'Wit' }, color: '#f4efe8' },
];

/** Тёмный ли цвет — по относительной яркости (sRGB, коэффициенты BT.709) */
export function isDark(hex: string): boolean {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return false;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}
