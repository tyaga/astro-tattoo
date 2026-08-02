import type { MarkerIcon } from '../lib/types';

interface Props {
    /** Центр значка в миллиметрах полотна */
    x: number;
    y: number;
    /** Размер значка по большей стороне, мм */
    size: number;
    color: string;
    opacity: number;
    variant: MarkerIcon;
    /** Свой разворот значка, градусы: аппарат можно повернуть,
     *  не трогая остальной рисунок */
    rotation: number;
}

/** Пропорции настоящего аппарата: тарелка 3.7 м подавляет всё остальное,
 *  корпус-десятигранник 1.8 м прячется под ней, штанга приборов 2.5 м,
 *  а магнитометрическая — 13 м, самая длинная и тонкая деталь силуэта.
 *  Каждый вариант нарисован в квадрате −5…5 и масштабируется под нужный мм. */
const SHAPES: Record<MarkerIcon, (c: string) => JSX.Element> = {
    // чертёж: всё штрихом, читается с 6–8 мм
    schema: c => (
        <g fill="none" stroke={c} strokeWidth={0.42}>
            <path d="M -0.6 1.1 L -4.8 4.7" strokeWidth={0.26} />
            <path d="M 1.0 1.4 L 3.4 2.6" />
            <rect x="3.2" y="2.2" width="1.4" height="1.2" rx="0.25" />
            <path d="M -1.0 1.4 L -2.4 2.6" />
            <circle cx="-2.9" cy="3.0" r="0.42" />
            <circle cx="-3.7" cy="3.6" r="0.42" />
            <path d="M -1.3 0.2 L 1.3 0.2 L 1.6 1.0 L 1.0 1.7 L -1.0 1.7 L -1.6 1.0 Z" />
            <path d="M -4.3 -1.9 Q 0 1.5 4.3 -1.9" />
            <ellipse cx="0" cy="-1.9" rx="4.3" ry="1.15" />
            <path d="M 0 -1.9 L 0 -4.1" />
            <circle cx="0" cy="-4.3" r="0.35" />
            <path d="M 0 0.2 L 0 -0.9" />
        </g>
    ),
    // силуэт: тарелка и корпус залиты, поэтому не теряется в 3–4 мм
    silhouette: c => (
        <g fill={c} stroke={c} strokeWidth={0.45}>
            <path d="M -0.6 1.2 L -4.9 4.8" strokeWidth={0.3} fill="none" />
            <path d="M 1.0 1.5 L 3.3 2.7" fill="none" />
            <rect x="3.1" y="2.3" width="1.5" height="1.3" rx="0.3" />
            <path d="M -1.0 1.5 L -2.5 2.7" fill="none" />
            <circle cx="-3.0" cy="3.1" r="0.5" />
            <circle cx="-3.9" cy="3.8" r="0.5" />
            <path d="M -1.4 0.3 L 1.4 0.3 L 1.7 1.1 L 1.0 1.8 L -1.0 1.8 L -1.7 1.1 Z" />
            <path d="M 0 0.3 L 0 -1.4" fill="none" />
            <path d="M -4.4 -2.0 A 4.4 1.2 0 0 1 4.4 -2.0 Q 0 1.6 -4.4 -2.0 Z" />
            <path d="M 0 -2.2 L 0 -4.2" fill="none" strokeWidth={0.3} />
            <circle cx="0" cy="-4.4" r="0.4" />
        </g>
    ),
    // минимум: чаша, мачта, длинная штанга и генератор — четыре следа иглы
    minimal: c => (
        <g fill={c} stroke={c} strokeWidth={0.5}>
            <path d="M -0.4 1.6 L -4.6 4.6" strokeWidth={0.34} fill="none" />
            <circle cx="-4.9" cy="4.9" r="0.5" />
            <path d="M 0 -1.4 L 0 1.6" fill="none" />
            <path d="M -4.2 -2.2 A 4.2 1.15 0 0 1 4.2 -2.2 Q 0 1.5 -4.2 -2.2 Z" />
            <path d="M 0.2 1.7 L 3.4 3.2" fill="none" strokeWidth={0.42} />
        </g>
    ),
    // анфас: антенна всегда направлена на Землю, поэтому в телескоп мы увидели
    // бы именно круг тарелки, а штанги торчали бы из-за неё
    faceOn: c => (
        <g fill="none" stroke={c} strokeWidth={0.45}>
            <path d="M -1.2 2.6 L -5.0 4.9" strokeWidth={0.3} />
            <circle cx="-5.2" cy="5.0" r="0.35" fill={c} />
            <path d="M 1.6 2.6 L 4.6 4.2" />
            <rect x="4.3" y="3.9" width="1.2" height="1.1" rx="0.25" fill={c} stroke="none" />
            <path d="M -0.2 3.4 L -1.6 4.9" />
            <circle cx="-1.9" cy="5.2" r="0.42" fill={c} />
            <circle cx="0" cy="0" r="3.7" strokeWidth={0.5} />
            <path d="M 0 0 L 0 -3.7 M 0 0 L 3.2 1.85 M 0 0 L -3.2 1.85" strokeWidth={0.3} />
            <circle cx="0" cy="0" r="0.75" fill={c} stroke="none" />
        </g>
    ),
    // золотая пластинка с картой пульсаров: символ миссии, а не аппарат
    record: c => (
        <g fill="none" stroke={c} strokeWidth={0.45}>
            <circle cx="0" cy="0" r="4.3" />
            <g strokeWidth={0.3}>
                <path d="M 0 0 L 3.1 -1.2" />
                <path d="M 0 0 L 2.2 2.4" />
                <path d="M 0 0 L -0.4 3.3" />
                <path d="M 0 0 L -2.8 1.8" />
                <path d="M 0 0 L -3.2 -0.9" />
                <path d="M 0 0 L -1.6 -2.8" />
                <path d="M 0 0 L 1.4 -3.0" />
            </g>
            <circle cx="0" cy="0" r="0.55" fill={c} />
        </g>
    ),
    // прежний значок — оставлен, чтобы старые эскизы не менялись сами собой
    classic: c => (
        <g fill="none" stroke={c} strokeWidth={0.6}>
            <path d="M -4.6 -2.2 A 4.6 4.6 0 0 1 4.6 -2.2 Z" fill={c} stroke="none" />
            <line x1="0" y1="-2.2" x2="0" y2="1.2" />
            <rect x="-1.5" y="1.2" width="3" height="2.2" rx="0.4" fill={c} stroke="none" />
            <line x1="1.5" y1="2.3" x2="5" y2="4.6" />
            <line x1="-1.5" y1="2.3" x2="-5" y2="3.4" />
            <circle cx="-5" cy="3.4" r="0.7" fill={c} stroke="none" />
        </g>
    ),
};

/** Значок «Вояджера» на полотне, в миллиметрах */
export function VoyagerIcon({ x, y, size, color, opacity, variant, rotation }: Props) {
    return (
        <g
            data-role="marker"
            transform={`translate(${x} ${y}) rotate(${rotation}) scale(${size / 10})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
        >
            {SHAPES[variant](color)}
        </g>
    );
}

/** Тот же значок отдельной картинкой — для выбора варианта в панели */
export function VoyagerGlyph({ variant, className }: { variant: MarkerIcon; className?: string }) {
    return (
        <svg className={className} viewBox="-5.6 -5.6 11.2 11.2" aria-hidden="true">
            <g strokeLinecap="round" strokeLinejoin="round">{SHAPES[variant]('currentColor')}</g>
        </svg>
    );
}
