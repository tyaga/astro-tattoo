import type { Tab } from './panels/types';

/** Значки вкладок: рисуем сами, чтобы не тащить шрифт иконок ради четырёх штук.
 *  Все в сетке 16×16, обводкой currentColor — цвет берут от вкладки. */
const PATHS: Record<Tab, JSX.Element> = {
    // созвездие: точки, соединённые линиями
    draw: (
        <>
            <path d="M3.2 12.2 7.4 5.2 12.6 8.6" />
            <circle cx="3.2" cy="12.2" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="7.4" cy="5.2" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="12.6" cy="8.6" r="1.3" fill="currentColor" stroke="none" />
        </>
    ),
    // глаз: как эскиз выглядит
    look: (
        <>
            <path d="M1.6 8S4.2 3.6 8 3.6 14.4 8 14.4 8 11.8 12.4 8 12.4 1.6 8 1.6 8Z" />
            <circle cx="8" cy="8" r="2.1" />
        </>
    ),
    // силуэт: на чём будет тату
    body: (
        <>
            <circle cx="8" cy="5" r="2.6" />
            <path d="M3.2 14.2c0-2.7 2.1-4.6 4.8-4.6s4.8 1.9 4.8 4.6" />
        </>
    ),
    // принтер: что уходит мастеру
    print: (
        <>
            <path d="M4.6 6V2.6h6.8V6" />
            <path d="M2.6 6h10.8v4.6h-2V13H5.6v-2.4h-3Z" />
            <path d="M5.6 9.4h4.8" />
        </>
    ),
};

export function TabIcon({ name }: { name: Tab }) {
    return (
        <svg
            className="tab-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {PATHS[name]}
        </svg>
    );
}
