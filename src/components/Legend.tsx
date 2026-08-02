import type { SizeClass } from '../lib/model';

export function Legend({ classes }: { classes: SizeClass[] }) {
    if (classes.length === 0) {
        return <div className="legend-empty">нет звёзд в поле</div>;
    }
    return (
        <div className="legend">
            {classes.map(c => (
                <div className="legend-row" key={c.d}>
                    <span
                        className="legend-dot"
                        style={{
                            width: Math.min(18, Math.max(3, c.d * 6)),
                            height: Math.min(18, Math.max(3, c.d * 6)),
                        }}
                    />
                    <span className="legend-size">⌀ {c.d.toFixed(2)} мм</span>
                    <span className="legend-count">{c.count} шт.</span>
                </div>
            ))}
        </div>
    );
}
