import { THUMB_BOX, thumbnailDots } from '../lib/thumbnail';

interface Props {
    id: string;
    className?: string;
}

/** «Идеальный» вид объекта: вписан в квадрат, без поворотов и сдвигов */
export function TargetThumb({ id, className }: Props) {
    return (
        <svg className={className} viewBox={`0 0 ${THUMB_BOX} ${THUMB_BOX}`} aria-hidden="true">
            {thumbnailDots(id).map((s, i) => (
                <circle key={i} cx={s.X} cy={s.Y} r={s.d / 2} fill="currentColor" />
            ))}
        </svg>
    );
}
