import type { SizeClass } from '../lib/model';
import { t } from '../i18n';
import type { Lang } from '../i18n';

export function Legend({ classes, lang }: { classes: SizeClass[]; lang: Lang }) {
    if (classes.length === 0) {
        return <div className="legend-empty">{t(lang, 'noStars')}</div>;
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
                    <span className="legend-size">⌀ {c.d.toFixed(2)} {t(lang, 'mm')}</span>
                    <span className="legend-count">{c.count} {t(lang, 'pieces')}</span>
                </div>
            ))}
        </div>
    );
}
