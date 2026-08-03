import { getCatalog, getTarget, pickName } from '../../lib/catalog';
import { NAKED_EYE_MAG, drawableCount, magForDrawnCount, magRange } from '../../lib/model';
import { PROBE_TARGET, VOYAGERS, VOYAGER_EPOCH } from '../../lib/voyager';
import { Check, Chip, Segmented, Slider } from '../controls';
import { RotationDial } from '../RotationDial';
import { TargetThumb } from '../TargetThumb';
import { VoyagerGlyph } from '../VoyagerIcon';
import type { PanelProps } from './types';
import type { BackgroundMode, MarkerIcon } from '../../lib/types';
import type { StringKey } from '../../i18n';

/** Лестница количеств: у объекта остаются только те ступени, которые
 *  укладываются в его диапазон яркости */
const STAR_COUNTS = [3, 4, 5, 7, 9, 14, 25, 50, 120, 250];

/** Варианты значка «Вояджера» в порядке от самого плотного к самому лёгкому */
const MARKER_ICONS: { value: MarkerIcon; key: StringKey }[] = [
    { value: 'silhouette', key: 'iconSilhouette' },
    { value: 'schema', key: 'iconSchema' },
    { value: 'minimal', key: 'iconMinimal' },
    { value: 'faceOn', key: 'iconFaceOn' },
    { value: 'record', key: 'iconRecord' },
    { value: 'classic', key: 'iconClassic' },
];

/** Что рисуем: объект, сколько звёзд, линии фигуры */
export function DrawPanel({
    settings, set, lang, tr, target, drawn, hasLines,
    onPickTarget, onSelectTarget, onApplyDefaults,
}: PanelProps) {
    // шкала своя у каждого объекта: у Жирафа всё начинается с 4ᵐ,
    // у Ориона — с 0.2ᵐ, и общая шкала 0…7 была бы наполовину мёртвой
    const range = magRange(target.id, settings.magLimit);
    // кнопки — только достижимые количества: больше, чем есть звёзд,
    // и ярче, чем начинается шкала, не бывает
    const available = drawableCount(settings);
    const counts = STAR_COUNTS.filter(
        n => n <= available && magForDrawnCount(settings, n) <= range.max,
    );

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
                    {counts.map(n => (
                        <Chip
                            key={n}
                            label={String(n)}
                            active={
                                Math.abs(settings.magLimit - magForDrawnCount(settings, n)) < 1e-9
                            }
                            onClick={() => set('magLimit')(magForDrawnCount(settings, n))}
                        />
                    ))}
                </div>
                <Slider
                    label={tr('magLimit')}
                    value={settings.magLimit}
                    min={range.min} max={range.max} step={0.05}
                    format={v => v.toFixed(2) + 'ᵐ'}
                    editHint={tr('typeValueHint')}
                    stops={[{ value: NAKED_EYE_MAG, title: tr('nakedEyeHint') }]}
                    invert
                    ends={{ left: tr('magFaint'), right: tr('magBright') }}
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

            {/* особая точка есть у Жирафа; с настоящим положением аппараты
                уезжают в свои созвездия, поэтому блок остаётся видимым */}
            {target.markers?.length || settings.voyagerReal ? (
                <section className="group">
                    <h2 title={tr('markerIconHint')}>{tr('markerIcon')}</h2>
                    <div className="glyphs">
                        {MARKER_ICONS.map(({ value, key }) => (
                            <button
                                key={value}
                                className={
                                    !settings.voyagerAspect && settings.markerIcon === value
                                        ? 'glyph active'
                                        : 'glyph'
                                }
                                title={tr(key)}
                                onClick={() => {
                                    set('voyagerAspect')(false);
                                    set('markerIcon')(value);
                                }}
                            >
                                <VoyagerGlyph variant={value} className="glyph-img" />
                                <span>{tr(key)}</span>
                            </button>
                        ))}
                    </div>

                    <Slider
                        label={tr('markerSize')}
                        value={settings.markerMm}
                        min={2} max={20} step={0.5}
                        format={v => v.toFixed(1) + ' ' + tr('mm')}
                        editHint={tr('typeValueHint')}
                        onChange={set('markerMm')}
                    />
                    <RotationDial
                        value={settings.markerRotDeg}
                        onChange={set('markerRotDeg')}
                        lang={lang}
                        label={tr('markerRotation')}
                    />

                    <Check
                        label={tr('voyagerAspect')}
                        title={tr('voyagerAspectHint')}
                        checked={settings.voyagerAspect}
                        onChange={set('voyagerAspect')}
                    />
                    <p className="stat">{tr('voyagerAspectHint')}</p>

                    <Check
                        label={tr('voyagerReal')}
                        title={tr('voyagerRealHint')}
                        checked={settings.voyagerReal}
                        onChange={set('voyagerReal')}
                    />
                    {settings.voyagerReal && (
                        <ul className="probes">
                            {VOYAGERS.map(probe => {
                                const id = PROBE_TARGET[probe.constellation];
                                return (
                                    <li key={probe.id}>
                                        {lang === 'ru' ? probe.ru : probe.name} —{' '}
                                        {id ? pickName(getTarget(id).name, lang) : probe.constellation},{' '}
                                        {probe.au} {tr('au')}
                                        {id && id !== target.id && (
                                            <>
                                                {' · '}
                                                <button
                                                    className="link-btn"
                                                    onClick={() => onSelectTarget(id)}
                                                >
                                                    {tr('jumpTo')}
                                                </button>
                                            </>
                                        )}
                                    </li>
                                );
                            })}
                            <li className="epoch">{VOYAGER_EPOCH} · JPL Horizons</li>
                        </ul>
                    )}
                </section>
            ) : null}

            <button className="btn ghost" title={tr('defaultViewHint')} onClick={onApplyDefaults}>
                {tr('defaultView')}
            </button>
        </>
    );
}
