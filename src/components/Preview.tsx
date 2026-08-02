import {
    useEffect, useLayoutEffect, useRef,
    type Dispatch, type ForwardedRef, type SetStateAction,
} from 'react';
import { sheetSize } from '../lib/model';
import type { DrawnStar, Settings, WristImage } from '../lib/types';
import type { DrawnMarker } from '../lib/model';
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

/** Жест двумя пальцами: щипок меняет размер, разворот пальцев — поворот,
 *  а перемещение середины между ними двигает поле */
interface PinchState {
    distance: number;
    angle: number;
    midX: number;
    midY: number;
    fovDeg: number;
    rotation: number;
    panX: number;
    panY: number;
    mmPerPx: number;
}

const MIN_FOV = 0.05;
const MAX_FOV = 45;

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
    markers: DrawnMarker[];
    wrist: WristImage | null;
    svgRef: ForwardedRef<SVGSVGElement>;
}

export function Preview({ settings, setSettings, drawn, markers, wrist, svgRef }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const zoomRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<DragState | null>(null);
    const pinchRef = useRef<PinchState | null>(null);
    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
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

    /** Сколько миллиметров полотна в экранном пикселе */
    const mmPerPx = () => {
        const svg = zoomRef.current?.querySelector('svg');
        if (!svg) return 1;
        return sheetSize(settings).W / svg.getBoundingClientRect().width;
    };

    const twoPointers = () => {
        const [a, b] = [...pointersRef.current.values()];
        return {
            distance: Math.hypot(a.x - b.x, a.y - b.y),
            angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2,
        };
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomEl = zoomRef.current;
        if (!zoomEl) return;
        try {
            zoomEl.setPointerCapture(e.pointerId);
        } catch {
            // захват не критичен: жест продолжит работать и без него
        }
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointersRef.current.size === 2) {
            // второй палец — переходим к щипку, обычное перетаскивание отменяем
            dragRef.current = null;
            const { distance, angle, midX, midY } = twoPointers();
            pinchRef.current = {
                distance,
                angle,
                midX,
                midY,
                fovDeg: settings.fovDeg,
                rotation: settings.rotation,
                panX: settings.panX,
                panY: settings.panY,
                mmPerPx: mmPerPx(),
            };
            return;
        }

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            panX: settings.panX,
            panY: settings.panY,
            rotation: settings.rotation,
            rotating: e.shiftKey,
            mmPerPx: mmPerPx(),
        };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (pointersRef.current.has(e.pointerId)) {
            pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        const pinch = pinchRef.current;
        if (pinch && pointersRef.current.size >= 2) {
            const { distance, angle, midX, midY } = twoPointers();
            if (pinch.distance < 20) return;
            // рисунок растёт во столько же раз, во сколько разъехались пальцы:
            // размер обратно пропорционален тангенсу поля зрения
            const k = distance / pinch.distance;
            const tan = Math.tan((pinch.fovDeg * Math.PI) / 180) / k;
            const fovDeg = Math.min(
                MAX_FOV,
                Math.max(MIN_FOV, (Math.atan(tan) * 180) / Math.PI),
            );
            // пальцы развернулись — на столько же поворачивается рисунок.
            // Угол на экране растёт по часовой, а поворот рисунка — против,
            // поэтому знак меняем, иначе фигура крутится в обратную сторону
            let turn = angle - pinch.angle;
            if (turn > 180) turn -= 360;
            if (turn < -180) turn += 360;
            const rotation = ((pinch.rotation - turn) % 360 + 360) % 360;

            setSettings(s => ({
                ...s,
                fovDeg: Math.round(fovDeg * 100) / 100,
                rotation: Math.round(rotation),
                panX: pinch.panX + (midX - pinch.midX) * pinch.mmPerPx,
                panY: pinch.panY + (midY - pinch.midY) * pinch.mmPerPx,
            }));
            return;
        }

        const drag = dragRef.current;
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (drag.rotating) {
            const rotation = ((drag.rotation - dx * 0.5) % 360 + 360) % 360;
            setSettings(s => ({ ...s, rotation }));
        } else {
            setSettings(s => ({
                ...s,
                panX: drag.panX + dx * drag.mmPerPx,
                panY: drag.panY + dy * drag.mmPerPx,
            }));
        }
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size < 2) pinchRef.current = null;
        if (pointersRef.current.size === 0) dragRef.current = null;
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
                <SheetSvg
                    ref={svgRef}
                    settings={settings}
                    drawn={drawn}
                    markers={markers}
                    wrist={wrist}
                />
            </div>
        </div>
    );
}
