import { getCatalog, magForCount, pickName } from '../../lib/catalog';
import { Chip, Segmented, Slider } from '../controls';
import { TargetThumb } from '../TargetThumb';
import { VoyagerGlyph } from '../VoyagerIcon';
import type { PanelProps } from './types';
import type { BackgroundMode, MarkerIcon } from '../../lib/types';
import type { StringKey } from '../../i18n';

const STAR_COUNTS = [5, 7, 9, 14, 25, 50, 120];

/** Варианты значка «Вояджера» в порядке от самого плотного к самому лёгкому */
const MARKER_ICONS: { value: MarkerIcon; key: StringKey }[] = [
    { value: 'silhouette', key: 'iconSilhouette' },
    { value: 'schema', key: 'iconSchema' },
    { value: 'minimal', key: 'iconMinimal' },
    { value: 'record', key: 'iconRecord' },
    { value: 'classic', key: 'iconClassic' },
];

/** Что рисуем: объект, сколько звёзд, линии фигуры */
export function DrawPanel({
    settings, set, lang, tr, target, drawn, hasLines, onPickTarget, onApplyDefaults,
}: PanelProps) {
    const backgrounds: { value: BackgroundMode; label: string; title: string }[] = [
        { value: 'show', label: tr('bgShow'), title: tr('bgShowHint') },
        { value: 'fade', label: tr('bgFade'), title: tr('bgFadeHint') },
        { value: 'hide', label: tr('bgHide'), title: tr('bgHideHint') },
    ];

    return (
        <>
            <button className="target-button" onClick={onPickTarget}>
                <TargetThumb id={target.id} className="target-button-thumb" />
                <span className="target-button-text">
                    <b>{pickName(target.name, lang)}</b>
                    <span className="stat">{pickName(target.subtitle, lang)}</span>
                </span>
                <span className="target-button-more">{tr('changeObject')}</span>
            </button>

            <section className="group">
                <h2>{tr('stars')}</h2>
                <div className="chips">
                    {STAR_COUNTS.map(n => (
                        <Chip
                            key={n}
                            label={String(n)}
                            active={Math.abs(settings.magLimit - magForCount(target.id, n)) < 1e-9}
                            onClick={() => set('magLimit')(magForCount(target.id, n))}
                        />
                    ))}
                </div>
                <Slider
                    label={tr('magLimit')}
                    value={settings.magLimit}
                    min={0} max={target.fetchMagLimit} step={0.05}
                    format={v => v.toFixed(2) + 'ᵐ'}
                    editHint={tr('typeValueHint')}
                    onChange={set('magLimit')}
                />
                <p className="stat">
                    {tr('inField')}: <b>{drawn.length}</b> {tr('starsShort')} ·{' '}
                    {tr('inCatalog')}: {getCatalog(target.id).length}
                </p>
            </section>

            <section className="group">
                <h2>{tr('figureLines')}</h2>
                {hasLines ? (
                    <>
                        <Segmented
                            options={[
                                { value: true, label: tr('on'), title: tr('show') },
                                { value: false, label: tr('off'), title: tr('hide') },
                            ]}
                            value={settings.showLines}
                            onChange={set('showLines')}
                        />
                        {settings.showLines && (
                            <Slider
                                label={tr('lineWidth')}
                                value={settings.lineMm}
                                min={0.1} max={1.5} step={0.05}
                                format={v => v.toFixed(2) + ' ' + tr('mm')}
                                editHint={tr('typeValueHint')}
                                onChange={set('lineMm')}
                            />
                        )}
                    </>
                ) : (
                    <p className="stat">{tr('noFigure')}</p>
                )}
            </section>

            {/* деление на фигуру и поле задано самими линиями и работает,
                даже когда линии не рисуются */}
            {hasLines && (
                <section className="group">
                    <h2 title={tr('backgroundHint')}>{tr('background')}</h2>
                    <Segmented
                        options={backgrounds}
                        value={settings.backgroundStars}
                        onChange={set('backgroundStars')}
                    />
                </section>
            )}

            {/* особая точка есть только у Жирафа: там «Вояджер» у Глизе 445 */}
            {target.markers?.length ? (
                <section className="group">
                    <h2 title={tr('markerIconHint')}>{tr('markerIcon')}</h2>
                    <div className="glyphs">
                        {MARKER_ICONS.map(({ value, key }) => (
                            <button
                                key={value}
                                className={
                                    settings.markerIcon === value ? 'glyph active' : 'glyph'
                                }
                                title={tr(key)}
                                onClick={() => set('markerIcon')(value)}
                            >
                                <VoyagerGlyph variant={value} className="glyph-img" />
                                <span>{tr(key)}</span>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}

            <button className="btn ghost" title={tr('defaultViewHint')} onClick={onApplyDefaults}>
                {tr('defaultView')}
            </button>
        </>
    );
}
