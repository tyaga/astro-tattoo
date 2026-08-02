import { useState } from 'react';
import { getTarget } from '../lib/catalog';
import { pickName, t as tr } from '../i18n';
import type { Lang } from '../i18n';
import type { Preset, Settings } from '../lib/types';

interface Props {
    lang: Lang;
    presets: Preset[];
    settings: Settings;
    onSave: (name: string) => void;
    onLoad: (preset: Preset) => void;
    onDelete: (id: string) => void;
}

export function Presets({ lang, presets, settings, onSave, onLoad, onDelete }: Props) {
    const [name, setName] = useState('');

    const submit = () => {
        const trimmed = name.trim() || pickName(getTarget(settings.targetId).name, lang);
        onSave(trimmed);
        setName('');
    };

    return (
        <>
            <div className="preset-form">
                <input
                    type="text"
                    className="text-input"
                    placeholder={tr(lang, 'presetName')}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') submit();
                    }}
                />
                <button className="btn" onClick={submit}>
                    {tr(lang, 'save')}
                </button>
            </div>

            {presets.length === 0 ? (
                <p className="stat">{tr(lang, 'presetsHint')}</p>
            ) : (
                <div className="preset-list">
                    {presets.map(p => (
                        <div className="preset-row" key={p.id}>
                            <button
                                className="preset-load"
                                title={`${pickName(getTarget(p.settings.targetId).name, lang)} · ${tr(lang, 'apply')}`}
                                onClick={() => onLoad(p)}
                            >
                                <span className="preset-name">{p.name}</span>
                                <span className="preset-target">
                                    {pickName(getTarget(p.settings.targetId).name, lang)}
                                </span>
                            </button>
                            <button
                                className="preset-delete"
                                title={tr(lang, 'delete')}
                                aria-label={`${tr(lang, 'delete')}: ${p.name}`}
                                onClick={() => onDelete(p.id)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
