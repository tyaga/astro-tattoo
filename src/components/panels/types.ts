import type { Dispatch, SetStateAction } from 'react';
import type { Target } from '../../lib/catalog';
import type { SizeClass } from '../../lib/model';
import type { DrawnStar, Preset, Settings, WristImage } from '../../lib/types';
import type { Lang, StringKey } from '../../i18n';

/** Всё, что нужно панелям настроек. Один объект вместо двадцати пропсов. */
export interface PanelProps {
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
    set: <K extends keyof Settings>(key: K) => (value: Settings[K]) => void;
    lang: Lang;
    tr: (key: StringKey) => string;
    target: Target;
    drawn: DrawnStar[];
    classes: SizeClass[];
    patternCm: number;
    hasLines: boolean;

    wrist: WristImage | null;
    onWristFile: (file: File | undefined) => void;
    onWristRemove: () => void;

    presets: Preset[];
    onPresetSave: (name: string) => void;
    onPresetLoad: (preset: Preset) => void;
    onPresetDelete: (id: string) => void;

    onPickTarget: () => void;
    onApplyDefaults: () => void;
    onFitSheet: () => void;
    onSheetToPattern: () => void;
    onRecentre: () => void;

    onExportSvg: () => void;
    onExportPng: () => void;
    onExportFitting: () => void;
    onExportSpec: () => void;
    onCopyLink: () => void;
    linkCopied: boolean;
    onReset: () => void;
}

/** Вкладки настроек — четыре шага работы над эскизом */
export const TABS = ['draw', 'look', 'body', 'print'] as const;
export type Tab = (typeof TABS)[number];
