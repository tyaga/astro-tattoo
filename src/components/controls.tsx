import { useState } from 'react';
import type { CSSProperties } from 'react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
    onChange: (value: number) => void;
    /** Во сколько раз показанное число больше внутреннего: для процентов 100 */
    editScale?: number;
    /** Подсказка «нажмите, чтобы ввести значение» на языке интерфейса */
    editHint?: string;
    /** Магнитные отметки: около них значение прилипает, а на дорожке
     *  рисуется засечка. Так у шкалы появляется осмысленная опора. */
    stops?: { value: number; title?: string }[];
    /** Шкала наоборот: слева большие значения. Для звёздных величин так
     *  привычнее — вправо становится ярче, а не тусклее. */
    invert?: boolean;
    /** Подписи концов шкалы: со звёздными величинами без них не разобраться */
    ends?: { left: string; right: string };
}

/** Округляет к сетке шага и держит в границах */
function snap(value: number, min: number, max: number, step: number): number {
    const snapped = Math.round((value - min) / step) * step + min;
    const fixed = Number(snapped.toFixed(6));
    return Math.min(max, Math.max(min, fixed));
}

export function Slider({
    label, value, min, max, step, format, onChange, editScale = 1, editHint, stops, invert,
    ends,
}: SliderProps) {
    const [draft, setDraft] = useState<string | null>(null);
    const decimals = Math.max(0, Math.ceil(-Math.log10(step * editScale)));
    const span = max - min;
    const marks = (stops ?? []).filter(m => m.value > min && m.value < max);
    /** Значение на самом ползунке: при перевёрнутой шкале — зеркальное */
    const mirror = (v: number) => (invert ? min + max - v : v);

    /** Притягивает к отметке, если ползунок подошёл ближе трёх шагов */
    const magnet = (v: number): number => {
        for (const mark of marks) {
            if (Math.abs(v - mark.value) <= step * 3 + 1e-6) return mark.value;
        }
        return v;
    };

    const startEdit = () => setDraft((value * editScale).toFixed(decimals));

    const commit = () => {
        if (draft === null) return;
        const parsed = parseFloat(draft.replace(',', '.'));
        if (Number.isFinite(parsed)) onChange(snap(parsed / editScale, min, max, step));
        setDraft(null);
    };

    return (
        <div className="control">
            <label>
                {label}{' '}
                {draft === null ? (
                    <button
                        type="button"
                        className="value"
                        title={editHint}
                        onClick={startEdit}
                    >
                        {format(value)}
                    </button>
                ) : (
                    <input
                        className="value value-input"
                        type="text"
                        inputMode="decimal"
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
            <div className="slider">
                <input
                    type="range"
                    // подпись лежит в соседнем label, поэтому имя даём явно
                    aria-label={label}
                    min={min}
                    max={max}
                    step={step}
                    value={mirror(value)}
                    // доля пройденной шкалы — по ней красится дорожка
                    style={{ '--fill': `${((mirror(value) - min) / span) * 100}%` } as CSSProperties}
                    onChange={e => onChange(magnet(mirror(parseFloat(e.target.value))))}
                />
                {marks.map(mark => (
                    <span
                        key={mark.value}
                        className="slider-stop"
                        title={mark.title}
                        style={{ left: `${((mirror(mark.value) - min) / span) * 100}%` }}
                    />
                ))}
            </div>
            {ends && (
                <div className="slider-ends">
                    <span>{ends.left}</span>
                    <span>{ends.right}</span>
                </div>
            )}
        </div>
    );
}

interface CheckProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Пояснение на наведении: у галочек часто неочевидные следствия */
    title?: string;
}

export function Check({ label, checked, onChange, title }: CheckProps) {
    return (
        <label className="check" title={title}>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            {label}
        </label>
    );
}


interface SegmentedOption<T> {
    value: T;
    label: string;
    title?: string;
}

interface SegmentedProps<T> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    className?: string;
}

/** Ряд кнопок-сегментов в одной пилюле: компактнее галочки или списка
 *  и сразу показывает все варианты */
export function Segmented<T extends string | boolean>({
    options, value, onChange, className,
}: SegmentedProps<T>) {
    return (
        <div className={className ? `segmented ${className}` : 'segmented'}>
            {options.map(o => (
                <button
                    key={String(o.value)}
                    type="button"
                    className={o.value === value ? 'seg-btn active' : 'seg-btn'}
                    title={o.title}
                    aria-pressed={o.value === value}
                    onClick={() => onChange(o.value)}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

interface SwatchesProps {
    label: string;
    options: { label: Record<string, string>; color: string }[];
    lang: string;
    value: string;
    onChange: (color: string) => void;
    /** Подпись выбранного нестандартного цвета и подсказка пипетки */
    customLabel: string;
    customTitle: string;
}

export function Swatches({
    label, options, value, onChange, customLabel, customTitle, lang,
}: SwatchesProps) {
    const preset = options.find(o => o.color.toLowerCase() === value.toLowerCase());
    return (
        <div className="control">
            <label>
                {label} <span className="value">{preset ? preset.label[lang] ?? preset.label.en : customLabel}</span>
            </label>
            <div className="swatches">
                {options.map(o => (
                    <button
                        key={o.color}
                        type="button"
                        title={o.label[lang] ?? o.label.en}
                        aria-label={o.label[lang] ?? o.label.en}
                        className={o.color === value ? 'swatch active' : 'swatch'}
                        style={{ background: o.color }}
                        onClick={() => onChange(o.color)}
                    />
                ))}
                <input
                    type="color"
                    className="swatch custom"
                    title={customTitle}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}

interface ChipProps {
    label: string;
    active?: boolean;
    onClick: () => void;
}

export function Chip({ label, active = false, onClick }: ChipProps) {
    return (
        <button className={active ? 'chip active' : 'chip'} onClick={onClick}>
            {label}
        </button>
    );
}
