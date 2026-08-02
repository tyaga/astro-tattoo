import { Check, Chip, Slider } from '../controls';
import { Legend } from '../Legend';
import { Presets } from '../Presets';
import type { PanelProps } from './types';
import type { GridMm } from '../../lib/types';

/** Отдать мастеру: лист, сетка, калибры, файлы и ссылка */
export function PrintPanel({
    settings, set, lang, tr, classes, presets, linkCopied, wrist,
    onPresetSave, onPresetLoad, onPresetDelete, onSheetToPattern,
    onExportSvg, onExportPng, onExportFitting, onExportSpec, onCopyLink,
}: PanelProps) {
    const cm = tr('cm');
    const grids: GridMm[] = [0, 1, 2, 5];

    return (
        <>
            <section className="group">
                <h2>{tr('exportTitle')}</h2>
                <div className="export-buttons">
                    <button className="btn primary" onClick={onExportSvg}>{tr('exportSvg')}</button>
                    <button className="btn primary" onClick={onExportPng}>{tr('exportPng')}</button>
                    {/* примерка есть только тогда, когда фото тела показано */}
                    {wrist && settings.showWrist && (
                        <button
                            className="btn"
                            title={tr('exportFittingHint')}
                            onClick={onExportFitting}
                        >
                            {tr('exportFitting')}
                        </button>
                    )}
                    <button className="btn" onClick={onExportSpec}>{tr('exportSpec')}</button>
                    <button className="btn" onClick={onCopyLink}>
                        {linkCopied ? tr('linkCopied') : tr('copyLink')}
                    </button>
                </div>
                <Check
                    label={tr('exportBw')}
                    checked={settings.exportBw}
                    onChange={set('exportBw')}
                />
            </section>

            <section className="group">
                <h2>{tr('sizeClasses')}</h2>
                <Legend classes={classes} lang={lang} />
            </section>

            <section className="group">
                <h2>{tr('sheet')}</h2>
                <Slider
                    label={tr('width')}
                    value={settings.widthCm}
                    min={3} max={25} step={0.5}
                    format={v => v.toFixed(1) + ' ' + cm}
                    editHint={tr('typeValueHint')}
                    onChange={set('widthCm')}
                />
                <Slider
                    label={tr('height')}
                    value={settings.heightCm}
                    min={2} max={20} step={0.5}
                    format={v => v.toFixed(1) + ' ' + cm}
                    editHint={tr('typeValueHint')}
                    onChange={set('heightCm')}
                />
                <button className="btn ghost" onClick={onSheetToPattern}>
                    {tr('sheetToPattern')}
                </button>
                <div className="control">
                    <label>{tr('grid')}</label>
                    <div className="chips">
                        {grids.map(g => (
                            <Chip
                                key={g}
                                label={g === 0 ? tr('gridNone') : `${g} ${tr('mm')}`}
                                active={settings.gridMm === g}
                                onClick={() => set('gridMm')(g)}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="group">
                <h2>{tr('presets')}</h2>
                <Presets
                    lang={lang}
                    presets={presets}
                    settings={settings}
                    onSave={onPresetSave}
                    onLoad={onPresetLoad}
                    onDelete={onPresetDelete}
                />
            </section>
        </>
    );
}
