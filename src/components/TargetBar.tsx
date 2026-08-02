import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { TargetThumb } from './TargetThumb';
import { pickName } from '../lib/catalog';
import type { Target } from '../lib/catalog';
import type { Lang, StringKey } from '../i18n';

interface Props {
    current: string;
    onSelect: (id: string) => void;
    lang: Lang;
    targets: Target[];
    /** Подпись ряда слева; у основного ряда её нет */
    title?: string;
    /** Компактный ряд — для зодиака */
    compact?: boolean;
    /** Кнопка поиска в конце ряда: с тридцатью объектами лента длинная */
    onSearch?: () => void;
    tr?: (key: StringKey) => string;
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
                    title={`${pickName(t.name, lang)} — ${pickName(t.subtitle, lang)}`}
                    onClick={() => onSelect(t.id)}
                >
                    <TargetThumb id={t.id} className="target-thumb" />
                    <span className="target-name">{pickName(t.name, lang)}</span>
                </button>
            ))}
        </>
    );
});

/** Лента объектов над эскизом: на десктопе выбор всегда перед глазами.
 *  На телефоне она скрыта — там объект меняют через полноэкранное окно. */
export function TargetBar({
    current, onSelect, lang, targets, title, compact, onSearch, tr,
}: Props) {
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
        <div className={compact ? 'targetbar compact' : 'targetbar'}>
            {title && <span className="targetbar-title">{title}</span>}
            <div
                className={
                    'targetbar-viewport' +
                    (edges.left ? ' fade-left' : '') +
                    (edges.right ? ' fade-right' : '')
                }
            >
                <div className="targetbar-scroll" ref={scrollRef} onScroll={updateEdges}>
                    <TargetCards
                        current={current}
                        onSelect={onSelect}
                        lang={lang}
                        targets={targets}
                    />
                </div>

                {edges.left && (
                    <button
                        className="targetbar-arrow left"
                        aria-label="←"
                        onClick={() => scrollBy(-SCROLL_STEP)}
                    >
                        ‹
                    </button>
                )}
                {edges.right && (
                    <button
                        className="targetbar-arrow right"
                        aria-label="→"
                        onClick={() => scrollBy(SCROLL_STEP)}
                    >
                        ›
                    </button>
                )}
            </div>

            {onSearch && tr && (
                <button
                    className="targetbar-search"
                    title={tr('searchObject')}
                    onClick={onSearch}
                >
                    ⌕
                </button>
            )}
        </div>
    );
}
