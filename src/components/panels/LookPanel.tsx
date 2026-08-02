import { fovForPatternMm } from '../../lib/model';
import { Check, Segmented, Slider } from '../controls';
import { RotationDial } from '../RotationDial';
import type { PanelProps } from './types';
import type { LabelsMode } from '../../lib/types';

/** Как выглядит: размер, разворот, калибры точек, подписи */
export function LookPanel({
    settings, set, setSettings, lang, tr, patternCm, onFitSheet, onRecentre,
}: PanelProps) {
    const cm = tr('cm');
    const mm = tr('mm');
    const labels: { value: LabelsMode; label: string; title: string }[] = [
        { value: 'none', label: tr('labelsNone'), title: tr('labelsNoneHint') },
        { value: 'names', label: tr('labelsNames'), title: tr('labelsNamesHint') },
        { value: 'full', label: tr('labelsFull'), title: tr('labelsFullHint') },
    ];

    return (
        <>
            <section className="group">
                <h2>{tr('placement')}</h2>
                <Slider
                    label={tr('patternSize')}
                    value={patternCm}
                    min={0.5} max={25} step={0.1}
                    format={v => v.toFixed(1) + ' ' + cm}
                    editHint={tr('typeValueHint')}
                    onChange={v => setSettings(s => ({ ...s, fovDeg: fovForPatternMm(s, v * 10) }))}
                />
                <RotationDial value={settings.rotation} onChange={set('rotation')} lang={lang} />
                <div className="row">
                    <Check label={tr('mirrorH')} checked={settings.flipX} onChange={set('flipX')} />
                    <Check label={tr('mirrorV')} checked={settings.flipY} onChange={set('flipY')} />
                </div>
                <div className="row wrap">
                    <button className="btn ghost" onClick={onRecentre}>{tr('center')}</button>
                    <button className="btn ghost" onClick={onFitSheet}>{tr('fitToSheet')}</button>
                </div>
            </section>

            <section className="group">
                <h2>{tr('dots')}</h2>
                <Slider
                    label={tr('maxDiameter')}
                    value={settings.maxMm}
                    min={0.5} max={10} step={0.1}
                    format={v => v.toFixed(1) + ' ' + mm}
                    editHint={tr('typeValueHint')}
                    onChange={set('maxMm')}
                />
                <Slider
                    label={tr('minDiameter')}
                    value={settings.minMm}
                    min={0.1} max={3} step={0.05}
                    format={v => v.toFixed(2) + ' ' + mm}
                    editHint={tr('typeValueHint')}
                    onChange={set('minMm')}
                />
                <Slider
                    label={tr('contrast')}
                    value={settings.contrast}
                    min={0.1} max={1} step={0.05}
                    format={v => v.toFixed(2)}
                    editHint={tr('typeValueHint')}
                    onChange={set('contrast')}
                />
                <Slider
                    label={tr('quantStep')}
                    value={settings.stepMm}
                    min={0.05} max={3} step={0.05}
                    format={v => v.toFixed(2) + ' ' + mm}
                    editHint={tr('typeValueHint')}
                    onChange={set('stepMm')}
                />
                <Check
                    label={tr('quantize')}
                    checked={settings.quantize}
                    onChange={set('quantize')}
                />
            </section>

            <section className="group">
                <h2>{tr('labels')}</h2>
                <Segmented options={labels} value={settings.labels} onChange={set('labels')} />
            </section>
        </>
    );
}
