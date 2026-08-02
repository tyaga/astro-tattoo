interface Props {
    /** Центр значка в миллиметрах полотна */
    x: number;
    y: number;
    /** Размер значка по большей стороне, мм */
    size: number;
    color: string;
    opacity: number;
}

/** Силуэт «Вояджера»: тарелка антенны, корпус и две штанги.
 *  Рисуется в квадрате −5…5 и масштабируется под нужный размер. */
export function VoyagerIcon({ x, y, size, color, opacity }: Props) {
    const k = size / 10;
    const w = 0.6; // толщина штрихов в единицах значка
    return (
        <g
            data-role="marker"
            transform={`translate(${x} ${y}) scale(${k})`}
            fill="none"
            stroke={color}
            strokeWidth={w}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
        >
            {/* параболическая антенна */}
            <path d="M -4.6 -2.2 A 4.6 4.6 0 0 1 4.6 -2.2 Z" fill={color} stroke="none" />
            <line x1="0" y1="-2.2" x2="0" y2="1.2" />
            {/* корпус */}
            <rect x="-1.5" y="1.2" width="3" height="2.2" rx="0.4" fill={color} stroke="none" />
            {/* штанга с приборами и противовес */}
            <line x1="1.5" y1="2.3" x2="5" y2="4.6" />
            <line x1="-1.5" y1="2.3" x2="-5" y2="3.4" />
            <circle cx="-5" cy="3.4" r="0.7" fill={color} stroke="none" />
        </g>
    );
}
