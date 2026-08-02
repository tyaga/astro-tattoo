import { useEffect, useMemo, useRef, useState } from 'react';
import { Legend } from './components/Legend';
import { Presets } from './components/Presets';
import { Preview } from './components/Preview';
import { Check, Chip, Slider, Swatches } from './components/controls';
import { INKS, SKIN_TONES } from './lib/palette';
import { TARGETS, getCatalog, getTarget, magForCount } from './lib/catalog';
import { downloadBlob, exportPng, svgToStandalone } from './lib/download';
import { fileToWristImage } from './lib/image';
import {
    buildSpec, computeDrawn, fitFovDeg, fovForPatternMm, patternSizeMm,
    sheetSize, sizeClasses,
} from './lib/model';
import {
    DEFAULTS, clearSettings, loadPresets, loadSettings, loadWrist,
    savePresets, saveSettings, saveWrist,
} from './lib/state';
import type { GridMm, LabelsMode, Preset, Settings, WristImage } from './lib/types';

const STAR_COUNTS = [5, 7, 9, 14, 25, 50, 120];

/** Пресет применяется поверх дефолтов: в старых пресетах могут
 *  отсутствовать поля, добавленные позже */
const mergePreset = (preset: Preset) => (): Settings => ({
    ...DEFAULTS,
    ...preset.settings,
});

const GRID_OPTIONS: { value: GridMm; label: string }[] = [
    { value: 0, label: 'нет' },
    { value: 1, label: '1 мм' },
    { value: 2, label: '2 мм' },
    { value: 5, label: '5 мм' },
];

export default function App() {
    const [settings, setSettings] = useState<Settings>(loadSettings);
    const [wrist, setWrist] = useState<WristImage | null>(loadWrist);
    const [presets, setPresets] = useState<Preset[]>(loadPresets);
    const svgRef = useRef<SVGSVGElement>(null);

    const target = getTarget(settings.targetId);

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    useEffect(() => {
        saveWrist(wrist);
    }, [wrist]);

    useEffect(() => {
        savePresets(presets);
    }, [presets]);

    /** Смена объекта поверх текущих настроек: новый объект занимает
     *  на полотне столько же миллиметров, сколько занимал прежний */
    const handleTargetChange = (targetId: string) => {
        setSettings(s => {
            const keepMm = patternSizeMm(s);
            const next: Settings = {
                ...s,
                targetId,
                magLimit: getTarget(targetId).defaultMagLimit,
                panX: 0,
                panY: 0,
            };
            return {
                ...next,
                fovDeg: keepMm > 0 ? fovForPatternMm(next, keepMm) : fitFovDeg(next),
            };
        });
    };

    const handleSavePreset = (name: string) => {
        const id = `${Date.now().toString(36)}-${name.length}`;
        setPresets(list => [...list, { id, name, settings }]);
    };

    const handleWristFile = async (file: File | undefined) => {
        if (!file) return;
        try {
            const img = await fileToWristImage(file);
            setWrist(img);
            setSettings(s => ({
                ...s,
                showWrist: true,
                // высота по пропорциям нового фото
                wristHeightCm: Math.round(s.wristWidthCm * img.aspect * 10) / 10,
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const drawn = useMemo(() => computeDrawn(settings), [settings]);
    const classes = useMemo(() => sizeClasses(drawn), [drawn]);
    const patternCm = useMemo(() => patternSizeMm(settings) / 10, [settings]);

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

    const handleReset = () => {
        clearSettings();
        setSettings({ ...DEFAULTS });
    };

    return (
        <div className="app">
            <aside className="sidebar left">
                <header className="sidebar-header">
                    <h1>Астро·тату</h1>
                    <p>Эскизы созвездий по данным Gaia и Hipparcos</p>
                </header>

                <section className="group">
                    <h2>Объект</h2>
                    <div className="control">
                        <select
                            value={settings.targetId}
                            onChange={e => handleTargetChange(e.target.value)}
                        >
                            {TARGETS.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <p className="stat">{target.subtitle}</p>
                </section>

                <section className="group">
                    <h2>Звёзды</h2>
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
                        label="Предел яркости"
                        value={settings.magLimit}
                        min={0} max={target.fetchMagLimit} step={0.05}
                        format={v => v.toFixed(2) + 'ᵐ'}
                        onChange={set('magLimit')}
                    />
                    <p className="stat">
                        В поле: <b>{drawn.length}</b> звёзд · в каталоге:{' '}
                        {getCatalog(target.id).length}
                    </p>
                </section>

                <section className="group">
                    <h2>Полотно</h2>
                    <Slider
                        label="Ширина"
                        value={settings.widthCm}
                        min={3} max={25} step={0.5}
                        format={v => v.toFixed(1) + ' см'}
                        onChange={set('widthCm')}
                    />
                    <Slider
                        label="Высота"
                        value={settings.heightCm}
                        min={2} max={20} step={0.5}
                        format={v => v.toFixed(1) + ' см'}
                        onChange={set('heightCm')}
                    />
                    <Slider
                        label="Размер рисунка"
                        value={patternCm}
                        min={0.5} max={25} step={0.1}
                        format={v => v.toFixed(1) + ' см'}
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
                        Вписать в полотно
                    </button>
                    <p className="stat">Поле зрения: {settings.fovDeg.toFixed(2)}°</p>
                    <Slider
                        label="Поворот"
                        value={settings.rotation}
                        min={0} max={360} step={1}
                        format={v => Math.round(v) + '°'}
                        onChange={set('rotation')}
                    />
                    <div className="row">
                        <Check label="Зеркало ⟷" checked={settings.flipX} onChange={set('flipX')} />
                        <Check label="Зеркало ⟱" checked={settings.flipY} onChange={set('flipY')} />
                    </div>
                    <button
                        className="btn ghost"
                        onClick={() => setSettings(s => ({ ...s, panX: 0, panY: 0 }))}
                    >
                        Центрировать
                    </button>
                </section>
            </aside>

            <main className="stage">
                <Preview
                    settings={settings}
                    setSettings={setSettings}
                    drawn={drawn}
                    wrist={wrist}
                    svgRef={svgRef}
                />
                <p className="hint">
                    Перетаскивание — сдвиг поля · Shift + перетаскивание — поворот ·
                    {' '}⌘/Ctrl + колесо — приблизить превью
                    {settings.previewZoom !== 1 && (
                        <>
                            {' · '}
                            <button
                                className="link-btn"
                                onClick={() => set('previewZoom')(1)}
                            >
                                {Math.round(settings.previewZoom * 100)}% — сбросить
                            </button>
                        </>
                    )}
                </p>

                <div className="export-bar">
                    <span className="export-label">Экспорт</span>
                    <button className="btn primary" onClick={handleExportSvg}>SVG 1:1</button>
                    <button className="btn primary" onClick={handleExportPng}>PNG 300 dpi</button>
                    <button className="btn" onClick={handleExportSpec}>Спецификация .txt</button>
                    <button className="btn ghost danger" onClick={handleReset}>
                        Сбросить всё
                    </button>
                </div>
            </main>

            <aside className="sidebar right">
                <section className="group first">
                    <h2>Точки</h2>
                    <Slider
                        label="Макс. диаметр"
                        value={settings.maxMm}
                        min={0.5} max={10} step={0.1}
                        format={v => v.toFixed(1) + ' мм'}
                        onChange={set('maxMm')}
                    />
                    <Slider
                        label="Мин. диаметр"
                        value={settings.minMm}
                        min={0.1} max={3} step={0.05}
                        format={v => v.toFixed(2) + ' мм'}
                        onChange={set('minMm')}
                    />
                    <Slider
                        label="Контраст размеров"
                        value={settings.contrast}
                        min={0.1} max={1} step={0.05}
                        format={v => v.toFixed(2)}
                        onChange={set('contrast')}
                    />
                    <Slider
                        label="Шаг квантования"
                        value={settings.stepMm}
                        min={0.05} max={3} step={0.05}
                        format={v => v.toFixed(2) + ' мм'}
                        onChange={set('stepMm')}
                    />
                    <Check
                        label="Квантовать размеры"
                        checked={settings.quantize}
                        onChange={set('quantize')}
                    />
                </section>

                <section className="group">
                    <h2>Кожа и чернила</h2>
                    <Swatches
                        label="Тон кожи"
                        options={SKIN_TONES}
                        value={settings.skinTone}
                        onChange={set('skinTone')}
                    />
                    <Swatches
                        label="Чернила"
                        options={INKS}
                        value={settings.inkColor}
                        onChange={set('inkColor')}
                    />
                    <Slider
                        label="Плотность чернил"
                        value={settings.inkOpacity}
                        min={0.3} max={1} step={0.02}
                        format={v => Math.round(v * 100) + '%'}
                        onChange={set('inkOpacity')}
                    />
                    <Check
                        label="Экспорт чёрным по белому"
                        checked={settings.exportBw}
                        onChange={set('exportBw')}
                    />
                </section>

                <section className="group">
                    <h2>Оформление</h2>
                    <div className="control">
                        <label htmlFor="labels">Подписи звёзд</label>
                        <select
                            id="labels"
                            value={settings.labels}
                            onChange={e => set('labels')(e.target.value as LabelsMode)}
                        >
                            <option value="none">Без подписей</option>
                            <option value="names">Только имена</option>
                            <option value="full">Имена + параметры</option>
                        </select>
                    </div>
                    <div className="control">
                        <label>Сетка</label>
                        <div className="chips">
                            {GRID_OPTIONS.map(g => (
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

                <section className="group">
                    <h2>Размерные классы</h2>
                    <Legend classes={classes} />
                </section>

                <section className="group">
                    <h2>Пресеты</h2>
                    <Presets
                        presets={presets}
                        settings={settings}
                        onSave={handleSavePreset}
                        onLoad={p => setSettings(mergePreset(p))}
                        onDelete={id => setPresets(list => list.filter(p => p.id !== id))}
                    />
                </section>

            </aside>

            <aside className="sidebar photos">
                <section className="group first">
                    <h2>Запястье</h2>
                    <div className="row wrap">
                        <label className="btn file-btn">
                            {wrist ? 'Заменить фото…' : 'Загрузить фото…'}
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
                                Убрать
                            </button>
                        )}
                    </div>
                    {wrist && (
                        <>
                            <Check
                                label="Показать запястье"
                                checked={settings.showWrist}
                                onChange={set('showWrist')}
                            />
                            {settings.showWrist && (
                                <>
                                    <Slider
                                        label="Ширина кадра"
                                        value={settings.wristWidthCm}
                                        min={3} max={30} step={0.1}
                                        format={v => v.toFixed(1) + ' см'}
                                        onChange={set('wristWidthCm')}
                                    />
                                    <Slider
                                        label="Высота кадра"
                                        value={settings.wristHeightCm}
                                        min={3} max={40} step={0.1}
                                        format={v => v.toFixed(1) + ' см'}
                                        onChange={set('wristHeightCm')}
                                    />
                                    <button
                                        className="btn ghost"
                                        onClick={() =>
                                            setSettings(s => ({
                                                ...s,
                                                wristHeightCm:
                                                    Math.round(s.wristWidthCm * wrist.aspect * 10) / 10,
                                            }))
                                        }
                                    >
                                        Высота по пропорциям фото
                                    </button>
                                    <Slider
                                        label="Сдвиг по X"
                                        value={settings.wristOffX}
                                        min={-100} max={100} step={1}
                                        format={v => Math.round(v) + ' мм'}
                                        onChange={set('wristOffX')}
                                    />
                                    <Slider
                                        label="Сдвиг по Y"
                                        value={settings.wristOffY}
                                        min={-100} max={100} step={1}
                                        format={v => Math.round(v) + ' мм'}
                                        onChange={set('wristOffY')}
                                    />
                                    <Slider
                                        label="Поворот"
                                        value={settings.wristRotDeg}
                                        min={-180} max={180} step={1}
                                        format={v => Math.round(v) + '°'}
                                        onChange={set('wristRotDeg')}
                                    />
                                    <Slider
                                        label="Прозрачность"
                                        value={settings.wristOpacity}
                                        min={0.2} max={1} step={0.05}
                                        format={v => Math.round(v * 100) + '%'}
                                        onChange={set('wristOpacity')}
                                    />
                                </>
                            )}
                        </>
                    )}
                    {!wrist && (
                        <p className="stat">
                            Сфотографируй внутреннюю сторону запястья (лучше с линейкой
                            в кадре) и подгони ширину кадра до реального размера.
                        </p>
                    )}
                </section>

                <section className="group">
                    <h2>Снимок неба</h2>
                    <Check
                        label="Показать фото на фоне"
                        checked={settings.showPhoto}
                        onChange={set('showPhoto')}
                    />
                    {settings.showPhoto && (
                        <>
                            <Slider
                                label="Прозрачность"
                                value={settings.photoOpacity}
                                min={0.2} max={1} step={0.05}
                                format={v => Math.round(v * 100) + '%'}
                                onChange={set('photoOpacity')}
                            />
                            <Slider
                                label="Подгонка масштаба"
                                value={settings.photoScale}
                                min={0.8} max={1.25} step={0.005}
                                format={v => Math.round(v * 1000) / 10 + '%'}
                                onChange={set('photoScale')}
                            />
                            <Slider
                                label="Поворот фото"
                                value={settings.photoRotDeg}
                                min={-180} max={180} step={1}
                                format={v => Math.round(v) + '°'}
                                onChange={set('photoRotDeg')}
                            />
                        </>
                    )}
                </section>
            </aside>
        </div>
    );
}
