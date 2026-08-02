import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { TARGETS } from '../lib/catalog';
import { TargetThumb } from './TargetThumb';

interface Props {
    current: string;
    onSelect: (id: string) => void;
}

/** На сколько прокручивать полосу кнопками-стрелками */
const SCROLL_STEP = 320;

/** Карточки вынесены в memo: при прокрутке меняется только состояние краёв,
 *  и без этого React перерисовывал бы все миниатюры на каждое событие */
const TargetCards = memo(function TargetCards({ current, onSelect }: Props) {
    return (
        <>
            {TARGETS.map(t => (
                <button
                    key={t.id}
                    className={t.id === current ? 'target-card active' : 'target-card'}
                    title={`${t.name} — ${t.subtitle}`}
                    onClick={() => onSelect(t.id)}
                >
                    <TargetThumb id={t.id} className="target-thumb" />
                    <span className="target-name">{t.name}</span>
                </button>
            ))}
        </>
    );
});

export function TargetBar({ current, onSelect }: Props) {
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
        <header className="topbar">
            <div
                className={
                    'topbar-viewport' +
                    (edges.left ? ' fade-left' : '') +
                    (edges.right ? ' fade-right' : '')
                }
            >
                <div className="topbar-scroll" ref={scrollRef} onScroll={updateEdges}>
                    <TargetCards current={current} onSelect={onSelect} />
                </div>

                {edges.left && (
                    <button
                        className="topbar-arrow left"
                        aria-label="Прокрутить влево"
                        onClick={() => scrollBy(-SCROLL_STEP)}
                    >
                        ‹
                    </button>
                )}
                {edges.right && (
                    <button
                        className="topbar-arrow right"
                        aria-label="Прокрутить вправо"
                        onClick={() => scrollBy(SCROLL_STEP)}
                    >
                        ›
                    </button>
                )}
            </div>
        </header>
    );
}
