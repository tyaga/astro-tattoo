import { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { Target } from '../lib/catalog';
import { pick } from '../i18n';
import type { Lang } from '../i18n';
import { TargetThumb } from './TargetThumb';

interface Props {
    current: string;
    onSelect: (id: string) => void;
    lang: Lang;
    targets: Target[];
    /** Подпись ряда слева; у основного ряда её нет */
    title?: string;
    /** Компактный ряд — для зодиака */
    compact?: boolean;
}

/** На сколько прокручивать полосу кнопками-стрелками */
const SCROLL_STEP = 320;

/** Карточки вынесены в memo: при прокрутке меняется только состояние краёв,
 *  и без этого React перерисовывал бы все миниатюры на каждое событие */
const TargetCards = memo(function TargetCards({ current, onSelect, lang, targets }: Props) {
    return (
        <>
            {targets.map(t => (
                <button
                    key={t.id}
                    className={t.id === current ? 'target-card active' : 'target-card'}
                    title={`${pick(t.name, lang)} — ${pick(t.subtitle, lang)}`}
                    onClick={() => onSelect(t.id)}
                >
                    <TargetThumb id={t.id} className="target-thumb" />
                    <span className="target-name">{pick(t.name, lang)}</span>
                </button>
            ))}
        </>
    );
});

export function TargetBar({ current, onSelect, lang, targets, title, compact }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const updateEdges = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const left = el.scrollLeft > 4;
        const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
        // обновляем состояние только при реальном изменении, иначе каждое
        // событие прокрутки давало бы лишний рендер
        setEdges(prev => (prev.left === left && prev.right === right ? prev : { left, right }));
    }, []);

    useEffect(() => {
        updateEdges();
        const el = scrollRef.current;
        if (!el) return;
        const observer = new ResizeObserver(updateEdges);
        observer.observe(el);
        return () => observer.disconnect();
    }, [updateEdges]);

    // выбранная карточка всегда должна быть на виду — например, после пресета
    useEffect(() => {
        scrollRef.current
            ?.querySelector('.target-card.active')
            ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }, [current]);

    const scrollBy = (delta: number) => {
        scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
    };

    return (
        <header className={compact ? 'topbar compact' : 'topbar'}>
            {title && <span className="topbar-title">{title}</span>}
            <div
                className={
                    'topbar-viewport' +
                    (edges.left ? ' fade-left' : '') +
                    (edges.right ? ' fade-right' : '')
                }
            >
                <div className="topbar-scroll" ref={scrollRef} onScroll={updateEdges}>
                    <TargetCards current={current} onSelect={onSelect} lang={lang} targets={targets} />
                </div>

                {edges.left && (
                    <button
                        className="topbar-arrow left"
                        aria-label="←"
                        onClick={() => scrollBy(-SCROLL_STEP)}
                    >
                        ‹
                    </button>
                )}
                {edges.right && (
                    <button
                        className="topbar-arrow right"
                        aria-label="→"
                        onClick={() => scrollBy(SCROLL_STEP)}
                    >
                        ›
                    </button>
                )}
            </div>
        </header>
    );
}
