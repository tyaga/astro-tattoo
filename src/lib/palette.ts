export interface Swatch {
    label: string;
    color: string;
}

/** Оттенки кожи — от фарфорового до тёмного, плюс белая бумага */
export const SKIN_TONES: Swatch[] = [
    { label: 'Фарфор', color: '#f7e2d3' },
    { label: 'Светлая', color: '#efcbb0' },
    { label: 'Средняя', color: '#ddac89' },
    { label: 'Загар', color: '#c2895f' },
    { label: 'Смуглая', color: '#8d5b3c' },
    { label: 'Тёмная', color: '#5b3826' },
    { label: 'Бумага', color: '#ffffff' },
];

/** Реалистичные цвета татуировочных чернил.
 *  Чистый чёрный в коже не встречается: свежая работа читается как
 *  тёмно-серая, зажившая уходит в сине-серый. */
export const INKS: Swatch[] = [
    { label: 'Чёрная, свежая', color: '#1e2127' },
    { label: 'Чёрная, зажившая', color: '#33455c' },
    { label: 'Серый вош', color: '#5f6a78' },
    { label: 'Индиго', color: '#293a72' },
    { label: 'Сепия', color: '#4a3427' },
    { label: 'Белая', color: '#f4efe8' },
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
