import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Legend } from './components/Legend';
import { Presets } from './components/Presets';
import { Preview } from './components/Preview';
import { RotationDial } from './components/RotationDial';
import { TargetBar } from './components/TargetBar';
import { TargetThumb } from './components/TargetThumb';
import {
    Check, Chip, Segmented, Slider, Swatches,
} from './components/controls';
import { INKS, SKIN_TONES } from './lib/palette';
import { getCatalog, getLines, getTarget, magForCount } from './lib/catalog';
import { downloadBlob, exportPng, svgToStandalone } from './lib/download';
import { fileToWristImage } from './lib/image';
import { settingsFromQuery, shareUrl } from './lib/url';
import {
    applyTargetPreset, buildSpec, computeDrawn, computeMarkers, fitFovDeg, fovForPatternMm,
    patternSizeMm, sheetSize, sizeClasses,
} from './lib/model';
import {
    DEFAULTS, clearPerTarget, clearSettings, loadPerTarget, loadPresets,
    loadSettings, loadWrist, pickTargetState, savePerTarget, savePresets,
    saveSettings, saveWrist,
} from './lib/state';
import type {
    BackgroundMode, GridMm, LabelsMode, Preset, Settings, Theme, WristImage,
} from './lib/types';
import { LANGS, LANG_LABELS, LANG_TITLES, pick, t } from './i18n';
import type { Lang, StringKey } from './i18n';

const STAR_COUNTS = [5, 7, 9, 14, 25, 50, 120];

/** Пресет применяется поверх дефолтов: в старых пресетах могут
 *  отсутствовать поля, добавленные позже */
const mergePreset = (preset: Preset) => (): Settings => ({
    ...DEFAULTS,
    ...preset.settings,
});

const themeOptions = (lang: Lang) => [
    { value: 'auto' as Theme, label: '◐', title: t(lang, 'themeAuto') },
    { value: 'light' as Theme, label: '☀', title: t(lang, 'themeLight') },
    { value: 'dark' as Theme, label: '☾', title: t(lang, 'themeDark') },
];

const labelOptions = (lang: Lang) => [
    { value: 'none' as LabelsMode, label: t(lang, 'labelsNone'), title: t(lang, 'labelsNoneHint') },
    { value: 'names' as LabelsMode, label: t(lang, 'labelsNames'), title: t(lang, 'labelsNamesHint') },
    { value: 'full' as LabelsMode, label: t(lang, 'labelsFull'), title: t(lang, 'labelsFullHint') },
];

const gridOptions = (lang: Lang) => [
    { value: 0 as GridMm, label: t(lang, 'gridNone') },
    { value: 1 as GridMm, label: `1 ${t(lang, 'mm')}` },
    { value: 2 as GridMm, label: `2 ${t(lang, 'mm')}` },
    { value: 5 as GridMm, label: `5 ${t(lang, 'mm')}` },
];

const backgroundOptions = (lang: Lang) => [
    { value: 'show' as BackgroundMode, label: t(lang, 'bgShow'), title: t(lang, 'bgShowHint') },
    { value: 'fade' as BackgroundMode, label: t(lang, 'bgFade'), title: t(lang, 'bgFadeHint') },
    { value: 'hide' as BackgroundMode, label: t(lang, 'bgHide'), title: t(lang, 'bgHideHint') },
];

const showHide = (lang: Lang) => [
    { value: true, label: t(lang, 'on'), title: t(lang, 'show') },
    { value: false, label: t(lang, 'off'), title: t(lang, 'hide') },
];

const langOptions = LANGS.map(l => ({ value: l, label: LANG_LABELS[l], title: LANG_TITLES[l] }));

export default function App() {
    const [settings, setSettings] = useState<Settings>(
        // ссылка задаёт рисунок, но примерку берём из этого браузера
        () => {
            const local = loadSettings();
            return settingsFromQuery(window.location.search, local) ?? local;
        },
    );
    const [linkCopied, setLinkCopied] = useState(false);
    const [showAll, setShowAll] = useState(false);
    const [wrist, setWrist] = useState<WristImage | null>(loadWrist);
    const [presets, setPresets] = useState<Preset[]>(loadPresets);
    const perTargetRef = useRef(loadPerTarget());
    const svgRef = useRef<SVGSVGElement>(null);

    const lang = settings.lang;
    const tr = (key: StringKey) => t(lang, key);
    const cm = tr('cm');
    const mm = tr('mm');
    const target = getTarget(settings.targetId);

    useEffect(() => {
        saveSettings(settings);
        // запоминаем настройки текущего объекта, чтобы вернуть их при возврате
        perTargetRef.current[settings.targetId] = pickTargetState(settings);
        savePerTarget(perTargetRef.current);
    }, [settings]);

    useEffect(() => {
        saveWrist(wrist);
    }, [wrist]);

    useEffect(() => {
        savePresets(presets);
    }, [presets]);

    useEffect(() => {
        document.documentElement.dataset.theme = settings.theme;
    }, [settings.theme]);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.title = `${t(lang, 'brand')} — ${t(lang, 'tagline')}`;
    }, [lang]);

    /** Смена объекта: возвращаем настройки, подобранные для него раньше,
     *  а если объект открывается впервые — его вид по умолчанию.
     *  Ссылка стабильна, иначе memo на карточках объектов не сработает. */
    const handleTargetChange = useCallback((targetId: string) => {
        setSettings(s => {
            const remembered = perTargetRef.current[targetId];
            return remembered
                ? { ...s, ...remembered, targetId }
                : applyTargetPreset(s, targetId);
        });
    }, []);

    const handleSavePreset = (name: string) => {
        const id = `${Date.now().toString(36)}-${name.length}`;
        setPresets(list => [...list, { id, name, settings }]);
    };

    const handleWristFile = async (file: File | undefined) => {
        if (!file) return;
        try {
            const img = await fileToWristImage(file);
            setWrist(img);
            setSettings(s => ({ ...s, showWrist: true }));
        } catch (e) {
            console.error(e);
        }
    };

    const drawn = useMemo(() => computeDrawn(settings), [settings]);
    const classes = useMemo(() => sizeClasses(drawn), [drawn]);
    const markers = useMemo(() => computeMarkers(settings), [settings]);
    const patternCm = useMemo(() => patternSizeMm(settings) / 10, [settings]);
    const hasLines = getLines(target.id).length > 0;

    const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) =>
        setSettings(s => ({ ...s, [key]: value }));

    const handleExportSvg = () => {
        if (!svgRef.current) return;
        const { W, H } = sheetSize(settings);
        const svg = svgToStandalone(svgRef.current, W, H, {
            blackAndWhite: settings.exportBw,
        });
        downloadBlob(
            `${target.id}-tattoo.svg`,
            new Blob([svg], { type: 'image/svg+xml' }),
        );
    };

    const handleExportPng = () => {
        if (!svgRef.current) return;
        const { W, H } = sheetSize(settings);
        const svg = svgToStandalone(svgRef.current, W, H, {
            blackAndWhite: settings.exportBw,
        });
        exportPng(svg, W, H, `${target.id}-tattoo-300dpi.png`);
    };

    const handleExportSpec = () => {
        downloadBlob(
            `${target.id}-tattoo-spec.txt`,
            new Blob([buildSpec(settings, drawn)], { type: 'text/plain;charset=utf-8' }),
        );
    };

    const handleCopyLink = async () => {
        const url = shareUrl(settings);
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // буфер недоступен — хотя бы покажем ссылку в адресной строке
        }
        window.history.replaceState(null, '', url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 1600);
    };

    const handleReset = () => {
        clearSettings();
        clearPerTarget();
        perTargetRef.current = {};
        setSettings(s => applyTargetPreset({ ...DEFAULTS }, s.targetId));
    };

    return (
        <div className={showAll ? 'app show-all' : 'app'}>
            <header className="appbar">
                <div className="appbar-brand">
                    <h1>{tr('brand')}</h1>
                    <p>{tr('tagline')}</p>
                </div>
                <div className="appbar-controls">
                    <Segmented
                        options={langOptions}
                        value={lang}
                        onChange={set('lang')}
                    />
                    <Segmented
                        className="icons"
                        options={themeOptions(lang)}
                        value={settings.theme}
                        onChange={set('theme')}
                    />
                </div>
            </header>

            <TargetBar current={settings.targetId} onSelect={handleTargetChange} lang={lang} />

            <aside className="sidebar left">
                <section className="group current-target">
                    <TargetThumb id={target.id} className="current-thumb" />
                    <div className="current-text">
                        <b>{pick(target.name, lang)}</b>
                        <span className="stat">{pick(target.subtitle, lang)}</span>
                        <button
                            className="link-btn"
                            title={tr('defaultViewHint')}
                            onClick={() => setSettings(s => applyTargetPreset(s, s.targetId))}
                        >
                            {tr('defaultView')}
                        </button>
                    </div>
                </section>

                <section className="group">
                    <h2>{tr('stars')}</h2>
                    <div className="chips">
                        {STAR_COUNTS.map(n => (
                            <Chip
                                key={n}
                                label={String(n)}
                                active={
                                    Math.abs(settings.magLimit - magForCount(target.id, n)) < 1e-9
                                }
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
                    <Slider
                        label={tr('patternSize')}
                        value={patternCm}
                        min={0.5} max={25} step={0.1}
                        format={v => v.toFixed(1) + ' ' + cm}
                        onChange={cm =>
                            setSettings(s => ({ ...s, fovDeg: fovForPatternMm(s, cm * 10) }))
                        }
                    />
                    <button
                        className="btn ghost"
                        onClick={() =>
                            setSettings(s => ({
                                ...s,
                                fovDeg: fitFovDeg({ ...s, panX: 0, panY: 0 }),
                                panX: 0,
                                panY: 0,
                            }))
                        }
                    >
                        {tr('fitToSheet')}
                    </button>
                    <p className="stat">{tr('fieldOfView')}: {settings.fovDeg.toFixed(2)}°</p>
                    <RotationDial value={settings.rotation} onChange={set('rotation')} lang={lang} />
                    <div className="row">
                        <Check label={tr('mirrorH')} checked={settings.flipX} onChange={set('flipX')} />
                        <Check label={tr('mirrorV')} checked={settings.flipY} onChange={set('flipY')} />
                    </div>
                    <button
                        className="btn ghost"
                        onClick={() => setSettings(s => ({ ...s, panX: 0, panY: 0 }))}
                    >
                        {tr('center')}
                    </button>
                </section>
            </aside>

            <main className="stage">
                <Preview
                    settings={settings}
                    setSettings={setSettings}
                    drawn={drawn}
                    markers={markers}
                    wrist={wrist}
                    svgRef={svgRef}
                />
                <p className="hint">
                    {tr('previewHint')}
                    {settings.previewZoom !== 1 && (
                        <>
                            {' · '}
                            <button
                                className="link-btn"
                                onClick={() => set('previewZoom')(1)}
                            >
                                {Math.round(settings.previewZoom * 100)}% — {tr('reset')}
                            </button>
                        </>
                    )}
                </p>

                <button
                    className="btn ghost mobile-only"
                    onClick={() => setShowAll(v => !v)}
                >
                    {showAll ? tr('lessSettings') : tr('moreSettings')}
                </button>

                <div className="export-bar">
                    <span className="export-label">{tr('exportTitle')}</span>
                    <button className="btn primary" onClick={handleExportSvg}>SVG 1:1</button>
                    <button className="btn primary" onClick={handleExportPng}>PNG 300 dpi</button>
                    <button className="btn" onClick={handleExportSpec}>{tr('exportSpec')}</button>
                    <button className="btn" onClick={handleCopyLink}>
                        {linkCopied ? tr('linkCopied') : tr('copyLink')}
                    </button>
                    <Check
                        label={tr('exportBw')}
                        checked={settings.exportBw}
                        onChange={set('exportBw')}
                    />
                    <button className="btn ghost danger" onClick={handleReset}>
                        {tr('resetAll')}
                    </button>
                </div>
            </main>

            <aside className="sidebar right">
                <section className="group first" data-adv>
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
                    <h2>{tr('skinAndInk')}</h2>
                    <Swatches
                        label={tr('skinTone')}
                        options={SKIN_TONES}
                        value={settings.skinTone}
                        onChange={set('skinTone')}
                        customLabel={tr('ownColor')}
                        customTitle={tr('customColor')}
                        lang={lang}
                    />
                    <Swatches
                        label={tr('ink')}
                        options={INKS}
                        value={settings.inkColor}
                        onChange={set('inkColor')}
                        customLabel={tr('ownColor')}
                        customTitle={tr('customColor')}
                        lang={lang}
                    />
                    <Slider
                        label={tr('inkOpacity')}
                        value={settings.inkOpacity}
                        min={0.3} max={1} step={0.02}
                        format={v => Math.round(v * 100) + '%'}
                        editScale={100}
                        editHint={tr('typeValueHint')}
                        onChange={set('inkOpacity')}
                    />
                </section>

                <section className="group">
                    <h2>{tr('style')}</h2>
                    <div className="control">
                        <label>{tr('labels')}</label>
                        <Segmented
                            options={labelOptions(lang)}
                            value={settings.labels}
                        onChange={set('labels')}
                        />
                    </div>
                    <div className="control-row">
                        <span>{tr('figureLines')}</span>
                        {hasLines ? (
                            <Segmented
                                options={showHide(lang)}
                                value={settings.showLines}
                        onChange={set('showLines')}
                            />
                        ) : (
                            <span className="stat">{tr('noFigure')}</span>
                        )}
                    </div>
                    {settings.showLines && hasLines && (
                        <>
                            <Slider
                                label={tr('lineWidth')}
                                value={settings.lineMm}
                                min={0.1} max={1.5} step={0.05}
                                format={v => v.toFixed(2) + ' ' + mm}
                                editHint={tr('typeValueHint')}
                        onChange={set('lineMm')}
                            />
                            <div className="control">
                                <label title={tr('backgroundHint')}>{tr('background')}</label>
                                <Segmented
                                    options={backgroundOptions(lang)}
                                    value={settings.backgroundStars}
                                    onChange={set('backgroundStars')}
                                />
                            </div>
                        </>
                    )}
                    <div className="control">
                        <label>{tr('grid')}</label>
                        <div className="chips">
                            {gridOptions(lang).map(g => (
                                <Chip
                                    key={g.value}
                                    label={g.label}
                                    active={settings.gridMm === g.value}
                                    onClick={() => set('gridMm')(g.value)}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="group" data-adv>
                    <h2>{tr('sizeClasses')}</h2>
                    <Legend classes={classes} lang={lang} />
                </section>

                <section className="group" data-adv>
                    <h2>{tr('presets')}</h2>
                    <Presets
                        lang={lang}
                        presets={presets}
                        settings={settings}
                        onSave={handleSavePreset}
                        onLoad={p => setSettings(mergePreset(p))}
                        onDelete={id => setPresets(list => list.filter(p => p.id !== id))}
                    />
                </section>

            </aside>

            <aside className="sidebar photos">
                <section className="group first" data-adv>
                    <div className="group-head">
                        <h2>{tr('wrist')}</h2>
                        {wrist && (
                            <Segmented
                                options={showHide(lang)}
                                value={settings.showWrist}
                        onChange={set('showWrist')}
                            />
                        )}
                    </div>
                    <div className="row wrap">
                        <label className="btn file-btn">
                            {wrist ? tr('replacePhoto') : tr('uploadPhoto')}
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={e => {
                                    handleWristFile(e.target.files?.[0]);
                                    e.target.value = '';
                                }}
                            />
                        </label>
                        {wrist && (
                            <button className="btn ghost" onClick={() => setWrist(null)}>
                                {tr('removePhoto')}
                            </button>
                        )}
                    </div>
                    {wrist && (
                        <>
                            {settings.showWrist && (
                                <>
                                    <Slider
                                        label={tr('frameSize')}
                                        value={settings.wristWidthCm}
                                        min={3} max={30} step={0.1}
                                        format={v => v.toFixed(1) + ' ' + cm}
                                        editHint={tr('typeValueHint')}
                        onChange={set('wristWidthCm')}
                                    />
                                    <Slider
                                        label={tr('offsetX')}
                                        value={settings.wristOffX}
                                        min={-100} max={100} step={1}
                                        format={v => Math.round(v) + ' ' + mm}
                                        editHint={tr('typeValueHint')}
                        onChange={set('wristOffX')}
                                    />
                                    <Slider
                                        label={tr('offsetY')}
                                        value={settings.wristOffY}
                                        min={-100} max={100} step={1}
                                        format={v => Math.round(v) + ' ' + mm}
                                        editHint={tr('typeValueHint')}
                        onChange={set('wristOffY')}
                                    />
                                    <RotationDial
                                        value={settings.wristRotDeg}
                                        onChange={set('wristRotDeg')}
                                        lang={lang}
                                    />
                                    <Slider
                                        label={tr('opacity')}
                                        value={settings.wristOpacity}
                                        min={0.2} max={1} step={0.05}
                                        editScale={100}
                                        format={v => Math.round(v * 100) + '%'}
                                        editHint={tr('typeValueHint')}
                        onChange={set('wristOpacity')}
                                    />
                                </>
                            )}
                        </>
                    )}
                    {!wrist && (
                        <p className="stat">{tr('wristHint')}</p>
                    )}
                </section>

                <section className="group" data-adv>
                    <div className="group-head">
                        <h2>{tr('skyPhoto')}</h2>
                        <Segmented
                            options={showHide(lang)}
                            value={settings.showPhoto}
                            onChange={set('showPhoto')}
                        />
                    </div>
                    {settings.showPhoto && (
                        <Slider
                            label={tr('opacity')}
                            value={settings.photoOpacity}
                            min={0.2} max={1} step={0.05}
                            format={v => Math.round(v * 100) + '%'}
                            editScale={100}
                            editHint={tr('typeValueHint')}
                            onChange={set('photoOpacity')}
                        />
                    )}
                </section>
            </aside>
        </div>
    );
}
