import type { SizeClass } from '../lib/model';
import type { StringKey } from '../i18n';

interface Props {
    patternCm: number;
    dots: number;
    classes: SizeClass[];
    tr: (key: StringKey) => string;
}

/** Итог под эскизом: то, о чём спрашивают, глядя на рисунок,
 *  и то, что понадобится мастеру */
export function SummaryLine({ patternCm, dots, classes, tr }: Props) {
    const smallest = classes.length ? classes[classes.length - 1].d : 0;
    const largest = classes.length ? classes[0].d : 0;
    const mm = tr('mm');

    return (
        <p className="summary">
            <b>{patternCm.toFixed(1)} {tr('cm')}</b>
            <span className="summary-sep">·</span>
            {dots} {tr('starsShort')}
            {classes.length > 0 && (
                <>
                    <span className="summary-sep">·</span>
                    {classes.length} {tr('calibres')} ⌀ {smallest.toFixed(2)}–{largest.toFixed(2)} {mm}
                </>
            )}
        </p>
    );
}
