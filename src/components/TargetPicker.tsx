import { useMemo, useState } from 'react';
import { TARGETS, pickName } from '../lib/catalog';
import { TargetThumb } from './TargetThumb';
import type { Lang, StringKey } from '../i18n';

interface Props {
    current: string;
    lang: Lang;
    tr: (key: StringKey) => string;
    onSelect: (id: string) => void;
    onClose: () => void;
}

/** Палитра объектов: сетка миниатюр с разделами и поиском.
 *  Выбор делают один раз, поэтому он не занимает место постоянно. */
export function TargetPicker({ current, lang, tr, onSelect, onClose }: Props) {
    const [query, setQuery] = useState('');

    const groups = useMemo(() => {
        const needle = query.trim().toLowerCase();
        const match = (id: string) => {
            if (!needle) return true;
            const t = TARGETS.find(x => x.id === id)!;
            return Object.values(t.name).some(n => n.toLowerCase().includes(needle));
        };
        const pickGroup = (test: (t: (typeof TARGETS)[number]) => boolean) =>
            TARGETS.filter(t => test(t) && match(t.id));

        return [
            { title: tr('groupZodiac'), items: pickGroup(t => Boolean(t.zodiac)) },
            {
                title: tr('groupConstellations'),
                items: pickGroup(t => !t.zodiac && t.source === 'hipparcos'),
            },
            {
                title: tr('groupClusters'),
                items: pickGroup(t => !t.zodiac && t.source === 'gaia'),
            },
        ].filter(g => g.items.length > 0);
    }, [query, tr]);

    return (
        <div className="picker" role="dialog" aria-modal="true">
            <div className="picker-head">
                <input
                    className="text-input"
                    type="search"
                    autoFocus
                    placeholder={tr('searchObject')}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Escape') onClose();
                    }}
                />
                <button className="btn ghost" onClick={onClose}>{tr('close')}</button>
            </div>

            <div className="picker-body">
                {groups.map(group => (
                    <section key={group.title} className="picker-group">
                        <h2>{group.title}</h2>
                        <div className="picker-grid">
                            {group.items.map(t => (
                                <button
                                    key={t.id}
                                    className={t.id === current ? 'target-card active' : 'target-card'}
                                    title={pickName(t.subtitle, lang)}
                                    onClick={() => {
                                        onSelect(t.id);
                                        onClose();
                                    }}
                                >
                                    <TargetThumb id={t.id} className="target-thumb" />
                                    <span className="target-name">{pickName(t.name, lang)}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
                {groups.length === 0 && <p className="stat">{tr('nothingFound')}</p>}
            </div>
        </div>
    );
}
