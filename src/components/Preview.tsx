import {
    useEffect, useLayoutEffect, useRef,
    type Dispatch, type ForwardedRef, type SetStateAction,
} from 'react';
import { sheetSize } from '../lib/model';
import type { DrawnStar, Settings, WristImage } from '../lib/types';
import { SheetSvg } from './SheetSvg';

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 8;

interface DragState {
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    rotation: number;
    rotating: boolean;
    mmPerPx: number;
}

/** Точка под курсором, вокруг которой нужно сохранить масштабирование */
interface ZoomAnchor {
    x: number;
    y: number;
    prevZoom: number;
}

interface Props {
    settings: Settings;
    setSettings: Dispatch<SetStateAction<Settings>>;
    drawn: DrawnStar[];
    wrist: WristImage | null;
    svgRef: ForwardedRef<SVGSVGElement>;
}

export function Preview({ settings, setSettings, drawn, wrist, svgRef }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const anchorRef = useRef<ZoomAnchor | null>(null);

    // ⌘/Ctrl + колесо — приблизить предпросмотр (нужен non-passive listener)
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!e.metaKey && !e.ctrlKey) return;
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            setSettings(s => {
                const k = Math.exp(-e.deltaY * 0.002);
                const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, s.previewZoom * k));
                anchorRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    prevZoom: s.previewZoom,
                };
                return { ...s, previewZoom: zoom };
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [setSettings]);

    // после масштабирования подкручиваем прокрутку, чтобы точка под курсором осталась на месте
    useLayoutEffect(() => {
        const el = wrapRef.current;
        const anchor = anchorRef.current;
        anchorRef.current = null;
        if (!el || !anchor) return;
        const k = settings.previewZoom / anchor.prevZoom;
        el.scrollLeft = (el.scrollLeft + anchor.x) * k - anchor.x;
        el.scrollTop = (el.scrollTop + anchor.y) * k - anchor.y;
    }, [settings.previewZoom]);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomEl = zoomRef.current;
        const svg = zoomEl?.querySelector('svg');
        if (!zoomEl || !svg) return;
        zoomEl.setPointerCapture(e.pointerId);
        const rect = svg.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            panX: settings.panX,
            panY: settings.panY,
            rotation: settings.rotation,
            rotating: e.shiftKey,
            mmPerPx: sheetSize(settings).W / rect.width,
        };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (drag.rotating) {
            const rotation = ((drag.rotation + dx * 0.5) % 360 + 360) % 360;
            setSettings(s => ({ ...s, rotation }));
        } else {
            setSettings(s => ({
                ...s,
                panX: drag.panX + dx * drag.mmPerPx,
                panY: drag.panY + dy * drag.mmPerPx,
            }));
        }
    };

    const endDrag = () => {
        dragRef.current = null;
    };

    return (
        <div ref={wrapRef} className="preview-wrap">
            <div
                ref={zoomRef}
                className="preview"
                // масштаб задаём шириной контента: SVG тянется за ней,
                // а контейнер получает настоящую полосу прокрутки
                style={{ width: `${settings.previewZoom * 100}%` }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
            >
                <SheetSvg ref={svgRef} settings={settings} drawn={drawn} wrist={wrist} />
            </div>
        </div>
    );
}
