import { useState } from 'react';
import { getTarget } from '../lib/catalog';
import type { Preset, Settings } from '../lib/types';

interface Props {
    presets: Preset[];
    settings: Settings;
    onSave: (name: string) => void;
    onLoad: (preset: Preset) => void;
    onDelete: (id: string) => void;
}

export function Presets({ presets, settings, onSave, onLoad, onDelete }: Props) {
    const [name, setName] = useState('');

    const submit = () => {
        const trimmed = name.trim() || getTarget(settings.targetId).name;
        onSave(trimmed);
        setName('');
    };

    return (
        <>
            <div className="preset-form">
                <input
                    type="text"
                    className="text-input"
                    placeholder="Название пресета"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') submit();
                    }}
                />
                <button className="btn" onClick={submit}>
                    Сохранить
                </button>
            </div>

            {presets.length === 0 ? (
                <p className="stat">
                    Сохраняй удачные компоновки — они останутся в браузере.
                </p>
            ) : (
                <div className="preset-list">
                    {presets.map(p => (
                        <div className="preset-row" key={p.id}>
                            <button
                                className="preset-load"
                                title={`${getTarget(p.settings.targetId).name} · применить`}
                                onClick={() => onLoad(p)}
                            >
                                <span className="preset-name">{p.name}</span>
                                <span className="preset-target">
                                    {getTarget(p.settings.targetId).name}
                                </span>
                            </button>
                            <button
                                className="preset-delete"
                                title="Удалить"
                                aria-label={`Удалить пресет ${p.name}`}
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
