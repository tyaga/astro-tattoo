interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (value: number) => string;
    onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
    return (
        <div className="control">
            <label>
                {label} <span className="value">{format(value)}</span>
            </label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
            />
        </div>
    );
}

interface CheckProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function Check({ label, checked, onChange }: CheckProps) {
    return (
        <label className="check">
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            {label}
        </label>
    );
}

interface SwatchesProps {
    label: string;
    options: { label: string; color: string }[];
    value: string;
    onChange: (color: string) => void;
}

export function Swatches({ label, options, value, onChange }: SwatchesProps) {
    const preset = options.find(o => o.color.toLowerCase() === value.toLowerCase());
    return (
        <div className="control">
            <label>
                {label} <span className="value">{preset?.label ?? 'свой'}</span>
            </label>
            <div className="swatches">
                {options.map(o => (
                    <button
                        key={o.color}
                        type="button"
                        title={o.label}
                        aria-label={o.label}
                        className={o.color === value ? 'swatch active' : 'swatch'}
                        style={{ background: o.color }}
                        onClick={() => onChange(o.color)}
                    />
                ))}
                <input
                    type="color"
                    className="swatch custom"
                    title="Свой цвет"
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
