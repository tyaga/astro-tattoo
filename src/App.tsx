import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Preview } from './components/Preview';
import { ResetButton } from './components/ResetButton';
import { SummaryLine } from './components/SummaryLine';
import { TargetBar } from './components/TargetBar';
import { TabIcon } from './components/TabIcon';
import { TargetPicker } from './components/TargetPicker';
import { Segmented } from './components/controls';
import { BodyPanel } from './components/panels/BodyPanel';
import { DrawPanel } from './components/panels/DrawPanel';
import { LookPanel } from './components/panels/LookPanel';
import { PrintPanel } from './components/panels/PrintPanel';
import { TABS } from './components/panels/types';
import type { PanelProps, Tab } from './components/panels/types';
import {
    MAIN_TARGETS, ZODIAC_TARGETS, ensureCatalog, getLines, getTarget, onCatalogLoaded,
} from './lib/catalog';
import { downloadBlob, exportPng, svgToStandalone } from './lib/download';
import { fileToBodyPhoto } from './lib/image';
import {
    applyTargetPreset, buildSpec, computeDrawn, computeMarkers, fitFovDeg,
    patternSizeMm, sheetSize, sizeClasses,
} from './lib/model';
import {
    DEFAULTS, clearPerTarget, clearSettings, loadPerTarget, loadPresets,
    loadSettings, loadBodyPhoto, pickTargetState, savePerTarget, savePresets,
    saveSettings, saveBodyPhoto,
} from './lib/state';
import { resetTab } from './lib/reset';
import { settingsFromQuery, shareUrl } from './lib/url';
import type { Preset, Settings, Theme, BodyPhoto } from './lib/types';
import { LANGS, LANG_LABELS, LANG_TITLES, t } from './i18n';
import type { Lang, StringKey } from './i18n';

const langOptions = LANGS.map(l => ({ value: l, label: LANG_LABELS[l], title: LANG_TITLES[l] }));

const themeOptions = (lang: Lang) => [
    { value: 'auto' as Theme, label: '◐', title: t(lang, 'themeAuto') },
    { value: 'light' as Theme, label: '☀', title: t(lang, 'themeLight') },
    { value: 'dark' as Theme, label: '☾', title: t(lang, 'themeDark') },
];

/** Пресет применяется поверх дефолтов: в старых пресетах могут
 *  отсутствовать поля, добавленные позже */
const mergePreset = (preset: Preset) => (): Settings => ({
    ...DEFAULTS,
    ...preset.settings,
});

const PANELS = {
    draw: DrawPanel,
    look: LookPanel,
    body: BodyPanel,
    print: PrintPanel,
};

const TAB_KEYS: Record<Tab, StringKey> = {
    draw: 'tabDraw',
    look: 'tabLook',
    body: 'tabBody',
    print: 'tabPrint',
};

export default function App() {
    const [settings, setSettings] = useState<Settings>(
        // ссылка задаёт рисунок, но примерку берём из этого браузера
        () => {
            const local = loadSettings();
            return settingsFromQuery(window.location.search, local) ?? local;
        },
    );
    const [bodyPhoto, setBodyPhoto] = useState<BodyPhoto | null>(loadBodyPhoto);
    const [presets, setPresets] = useState<Preset[]>(loadPresets);
    const [tab, setTab] = useState<Tab>('draw');
    // на телефоне шторку настроек можно убрать, чтобы видеть весь эскиз
    const [sheetOpen, setSheetOpen] = useState(true);
    const [picking, setPicking] = useState(false);
    // полный каталог объекта подгружается по требованию: пока его нет, эскиз
    // строится по фигуре. Счётчик заставляет пересчитать точки, когда каталог
    // доехал — от settings это не зависит
    const [catalogVersion, setCatalogVersion] = useState(0);
    const [linkCopied, setLinkCopied] = useState(false);
    const perTargetRef = useRef(loadPerTarget());
    const svgRef = useRef<SVGSVGElement>(null);

    const lang = settings.lang;
    const tr = useCallback((key: StringKey) => t(lang, key), [lang]);
    const target = getTarget(settings.targetId);

    useEffect(() => {
        saveSettings(settings);
        // запоминаем настройки текущего объекта, чтобы вернуть их при возврате
        perTargetRef.current[settings.targetId] = pickTargetState(settings);
        savePerTarget(perTargetRef.current);
    }, [settings]);

    useEffect(() => onCatalogLoaded(() => setCatalogVersion(v => v + 1)), []);
    useEffect(() => {
        void ensureCatalog(settings.targetId);
    }, [settings.targetId]);

    useEffect(() => saveBodyPhoto(bodyPhoto), [bodyPhoto]);
    useEffect(() => savePresets(presets), [presets]);

    useEffect(() => {
        document.documentElement.dataset.theme = settings.theme;
    }, [settings.theme]);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.title = `${t(lang, 'brand')} — ${t(lang, 'tagline')}`;
    }, [lang]);

    /** Смена объекта: возвращаем настройки, подобранные для него раньше,
     *  а если объект открывается впервые — его вид по умолчанию */
    const handleTargetChange = useCallback((targetId: string) => {
        setSettings(s => {
            const remembered = perTargetRef.current[targetId];
            return remembered
                ? { ...s, ...remembered, targetId }
                : applyTargetPreset(s, targetId);
        });
    }, []);

    const handleBodyPhotoFile = async (file: File | undefined) => {
        if (!file) return;
        try {
            setBodyPhoto(await fileToBodyPhoto(file));
            setSettings(s => ({ ...s, showBodyPhoto: true }));
        } catch (e) {
            console.error(e);
        }
    };

    const drawn = useMemo(() => computeDrawn(settings), [settings, catalogVersion]);
    const markers = useMemo(() => computeMarkers(settings), [settings, catalogVersion]);
    const classes = useMemo(() => sizeClasses(drawn), [drawn]);
    const patternCm = useMemo(
        () => patternSizeMm(settings) / 10,
        [settings, catalogVersion],
    );

    const set = <K extends keyof Settings>(key: K) => (value: Settings[K]) =>
        setSettings(s => ({ ...s, [key]: value }));

    const exportSvgText = () => {
        const { W, H } = sheetSize(settings);
        return svgToStandalone(svgRef.current!, W, H, { blackAndWhite: settings.exportBw });
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

    const panel: PanelProps = {
        settings,
        setSettings,
        set,
        lang,
        tr,
        target,
        drawn,
        classes,
        patternCm,
        hasLines: getLines(target.id).length > 0,

        bodyPhoto,
        onBodyPhotoFile: handleBodyPhotoFile,
        onBodyPhotoRemove: () => setBodyPhoto(null),

        presets,
        onPresetSave: name =>
            setPresets(list => [
                ...list,
                { id: `${Date.now().toString(36)}-${name.length}`, name, settings },
            ]),
        onPresetLoad: preset => setSettings(mergePreset(preset)),
        onPresetDelete: id => setPresets(list => list.filter(p => p.id !== id)),

        onPickTarget: () => setPicking(true),
        onSelectTarget: handleTargetChange,
        onApplyDefaults: () => setSettings(s => applyTargetPreset(s, s.targetId)),
        onFitSheet: () =>
            setSettings(s => ({
                ...s,
                fovDeg: fitFovDeg({ ...s, panX: 0, panY: 0 }),
                panX: 0,
                panY: 0,
            })),
        onSheetToPattern: () =>
            setSettings(s => {
                // лист по рисунку: поперечник плюс два сантиметра поля
                const side = Math.min(25, Math.max(3, Math.round((patternCm + 2) * 2) / 2));
                return { ...s, widthCm: side, heightCm: Math.min(20, side) };
            }),
        onRecentre: () => setSettings(s => ({ ...s, panX: 0, panY: 0 })),

        onExportSvg: () => {
            if (!svgRef.current) return;
            downloadBlob(
                `${target.id}-tattoo.svg`,
                new Blob([exportSvgText()], { type: 'image/svg+xml' }),
            );
        },
        onExportPng: () => {
            if (!svgRef.current) return;
            const { W, H } = sheetSize(settings);
            exportPng(exportSvgText(), W, H, `${target.id}-tattoo-300dpi.png`);
        },
        // примерка: точки поверх собственного фото, без линий и подписей
        onExportFitting: () => {
            if (!svgRef.current) return;
            const { W, H } = sheetSize(settings);
            const svg = svgToStandalone(svgRef.current, W, H, {
                withBodyPhoto: true,
                dotsOnly: true,
            });
            exportPng(svg, W, H, `${target.id}-tattoo-mockup.png`);
        },
        onExportSpec: () =>
            downloadBlob(
                `${target.id}-tattoo-spec.txt`,
                new Blob([buildSpec(settings, drawn)], { type: 'text/plain;charset=utf-8' }),
            ),
        onCopyLink: handleCopyLink,
        linkCopied,
        onReset: () => {
            clearSettings();
            clearPerTarget();
            perTargetRef.current = {};
            setSettings(s => applyTargetPreset({ ...DEFAULTS }, s.targetId));
        },
    };

    const ActivePanel = PANELS[tab];

    return (
        <div className="app">
            <header className="appbar">
                <div className="appbar-brand">
                    <h1>{tr('brand')}</h1>
                    <p>{tr('tagline')}</p>
                </div>
                <div className="appbar-controls">
                    <Segmented options={langOptions} value={lang} onChange={set('lang')} />
                    <Segmented
                        className="icons"
                        options={themeOptions(lang)}
                        value={settings.theme}
                        onChange={set('theme')}
                    />
                </div>
            </header>

            <main className="stage">
                {/* на десктопе объект выбирают лентой над эскизом,
                    на телефоне она скрыта — там полноэкранное окно выбора */}
                <TargetBar
                    current={settings.targetId}
                    onSelect={handleTargetChange}
                    lang={lang}
                    targets={MAIN_TARGETS}
                    onSearch={() => setPicking(true)}
                    tr={tr}
                />
                <TargetBar
                    current={settings.targetId}
                    onSelect={handleTargetChange}
                    lang={lang}
                    targets={ZODIAC_TARGETS}
                    title={tr('groupZodiac')}
                    compact
                />

                <Preview
                    settings={settings}
                    setSettings={setSettings}
                    drawn={drawn}
                    markers={markers}
                    bodyPhoto={bodyPhoto}
                    svgRef={svgRef}
                />
                <SummaryLine
                    patternCm={patternCm}
                    dots={drawn.length}
                    classes={classes}
                    tr={tr}
                />
                <p className="hint touch">{tr('previewHintTouch')}</p>
                <p className="hint">{tr('previewHint')}</p>
            </main>

            <aside className={sheetOpen ? 'panel' : 'panel collapsed'}>
                <nav className="tabs">
                    {TABS.map(name => (
                        <button
                            key={name}
                            className={name === tab ? 'tab active' : 'tab'}
                            aria-expanded={name === tab ? sheetOpen : undefined}
                            onClick={() => {
                                // повторный тап по своей вкладке складывает шторку
                                if (name === tab) setSheetOpen(open => !open);
                                else {
                                    setTab(name);
                                    setSheetOpen(true);
                                }
                            }}
                        >
                            <TabIcon name={name} />
                            <span className="tab-label">{tr(TAB_KEYS[name])}</span>
                        </button>
                    ))}
                </nav>
                <div className="panel-body">
                    <ActivePanel {...panel} />
                </div>
                {/* сбросы живут в подвале: слева — только эта вкладка,
                    справа — всё сразу */}
                <div className="panel-foot">
                    <button
                        className="btn ghost"
                        title={tr('resetTabHint')}
                        onClick={() => setSettings(s => resetTab(s, tab))}
                    >
                        {tr('resetTab')}
                    </button>
                    <ResetButton tr={tr} onReset={panel.onReset} />
                </div>
            </aside>

            {picking && (
                <TargetPicker
                    current={settings.targetId}
                    lang={lang}
                    tr={tr}
                    onSelect={handleTargetChange}
                    onClose={() => setPicking(false)}
                />
            )}
        </div>
    );
}
