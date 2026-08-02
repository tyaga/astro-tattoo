import { THUMB_BOX, thumbnail } from '../lib/thumbnail';

interface Props {
    id: string;
    className?: string;
}

/** «Идеальный» вид объекта: вписан в квадрат, без поворотов и сдвигов,
 *  с линиями фигуры там, где они есть */
export function TargetThumb({ id, className }: Props) {
    const { dots, segments } = thumbnail(id);
    return (
        <svg className={className} viewBox={`0 0 ${THUMB_BOX} ${THUMB_BOX}`} aria-hidden="true">
            <g stroke="currentColor" strokeWidth={0.35} strokeLinecap="round" opacity={0.55}>
                {segments.map(([a, b], i) => (
                    <line key={i} x1={a.X} y1={a.Y} x2={b.X} y2={b.Y} />
                ))}
            </g>
            {dots.map((s, i) => (
                <circle key={i} cx={s.X} cy={s.Y} r={s.d / 2} fill="currentColor" />
            ))}
        </svg>
    );
}
