import { useRef, useState } from 'react';
import { t } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
    value: number;
    onChange: (deg: number) => void;
    lang: Lang;
    /** Подпись; по умолчанию — «Поворот» */
    label?: string;
}

/** Ходовые углы: положить фигуру набок или перевернуть */
const QUICK = [0, 90, 180, 270];

const norm = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;

/** Круглый диск: угол задаётся направлением, а не позицией на линейке.
 *  С зажатым Shift защёлкивается на 15°. */
export function RotationDial({ value, onChange, lang, label }: Props) {
    const dialRef = useRef<SVGSVGElement>(null);
    const [draft, setDraft] = useState<string | null>(null);

    const angleFromPointer = (e: React.PointerEvent) => {
        const rect = dialRef.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        // ноль сверху, отсчёт по часовой стрелке — как поворот самого рисунка
        let deg = (Math.atan2(e.clientX - cx, cy - e.clientY) * 180) / Math.PI;
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        onChange(norm(deg));
    };

    const commit = () => {
        if (draft === null) return;
        const parsed = parseFloat(draft.replace(',', '.'));
        if (Number.isFinite(parsed)) onChange(norm(parsed));
        setDraft(null);
    };

    const th = ((value - 90) * Math.PI) / 180;
    const handleX = 20 + 14 * Math.cos(th);
    const handleY = 20 + 14 * Math.sin(th);

    return (
        <div className="control">
            <label>
                {label ?? t(lang, 'rotation')}{' '}
                {draft === null ? (
                    <button
                        type="button"
                        className="value"
                        title={t(lang, 'typeValueHint')}
                        onClick={() => setDraft(String(Math.round(value)))}
                    >
                        {Math.round(value)}°
                    </button>
                ) : (
                    <input
                        className="value value-input"
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onFocus={e => e.target.select()}
                        onBlur={commit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') commit();
                            if (e.key === 'Escape') setDraft(null);
                        }}
                    />
                )}
            </label>

            <div className="dial-row">
                <svg
                    ref={dialRef}
                    className="dial"
                    viewBox="0 0 40 40"
                    role="slider"
                    tabIndex={0}
                    aria-label={t(lang, 'rotation')}
                    aria-valuenow={Math.round(value)}
                    onPointerDown={e => {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        angleFromPointer(e);
                    }}
                    onPointerMove={e => {
                        if (e.currentTarget.hasPointerCapture(e.pointerId)) angleFromPointer(e);
                    }}
                    onKeyDown={e => {
                        const step = e.shiftKey ? 15 : 1;
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(norm(value - step));
                        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(norm(value + step));
                    }}
                >
                    <title>{t(lang, 'dialHint')}</title>
                    <circle className="dial-face" cx="20" cy="20" r="17" />
                    {[0, 90, 180, 270].map(a => {
                        const r = ((a - 90) * Math.PI) / 180;
                        return (
                            <line
                                key={a}
                                className="dial-tick"
                                x1={20 + 15 * Math.cos(r)} y1={20 + 15 * Math.sin(r)}
                                x2={20 + 17 * Math.cos(r)} y2={20 + 17 * Math.sin(r)}
                            />
                        );
                    })}
                    <line className="dial-arm" x1="20" y1="20" x2={handleX} y2={handleY} />
                    <circle className="dial-knob" cx={handleX} cy={handleY} r="3.4" />
                </svg>

                <div className="dial-quick">
                    {QUICK.map(a => (
                        <button
                            key={a}
                            type="button"
                            className={norm(value) === a ? 'chip active' : 'chip'}
                            onClick={() => onChange(a)}
                        >
                            {a}°
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
