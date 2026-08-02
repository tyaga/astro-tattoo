import { forwardRef } from 'react';
import { getPhotoUrl, getTarget, rad } from '../lib/catalog';
import { sheetSize } from '../lib/model';
import { isDark } from '../lib/palette';
import type { DrawnStar, Settings, WristImage } from '../lib/types';

const FONT = 'Helvetica, Arial, sans-serif';

interface Props {
    settings: Settings;
    drawn: DrawnStar[];
    wrist: WristImage | null;
}

/** Сетка рисуется полупрозрачным контрастом к фону, чтобы читаться
 *  и на бумаге, и на тёмной коже */
function gridStroke(pos: number, stepMm: number, onDark: boolean): string {
    const major = pos % 10 === 0;
    const medium = stepMm < 5 && pos % 5 === 0;
    const alpha = major ? 0.34 : medium ? 0.2 : 0.11;
    return onDark
        ? `rgba(255, 255, 255, ${alpha})`
        : `rgba(60, 62, 78, ${alpha})`;
}

export const SheetSvg = forwardRef<SVGSVGElement, Props>(function SheetSvg(
    { settings, drawn, wrist },
    ref,
) {
    const { W, H } = sheetSize(settings);
    const step = settings.gridMm;

    const gridX: number[] = [];
    const gridY: number[] = [];
    if (step > 0) {
        for (let x = step; x < W; x += step) gridX.push(x);
        for (let y = step; y < H; y += step) gridY.push(y);
    }

    // масштабная линейка 1 см
    const bx = W - 13;
    const by = H - 3;

    const target = getTarget(settings.targetId);
    const photoUrl = getPhotoUrl(target.id);
    const skyPhoto = settings.showPhoto && Boolean(photoUrl);
    // подписи и разметка подстраиваются под тёмный фон: кожу или снимок неба
    const onDark = skyPhoto || isDark(settings.skinTone);
    const nameFill = onDark ? '#f0f0f5' : '#33343d';
    const infoFill = onDark ? '#c9cad6' : '#8a8b96';
    const chromeStroke = onDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(60, 62, 78, 0.32)';

    return (
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`}>
            <defs>
                <clipPath id="sheet">
                    <rect x={0} y={0} width={W} height={H} />
                </clipPath>
            </defs>

            <rect
                data-role="sheet-bg"
                x={0} y={0} width={W} height={H}
                fill={settings.skinTone}
            />

            {settings.showWrist && wrist && (() => {
                // фото запястья привязано к полотну: тату «лежит» на коже
                const wMm = settings.wristWidthCm * 10;
                const hMm = settings.wristHeightCm * 10;
                const cx = W / 2 + settings.wristOffX;
                const cy = H / 2 + settings.wristOffY;
                return (
                    <g clipPath="url(#sheet)" data-export="exclude">
                        <g
                            transform={
                                `translate(${cx} ${cy}) rotate(${settings.wristRotDeg}) ` +
                                `translate(${-wMm / 2} ${-hMm / 2})`
                            }
                        >
                            <image
                                href={wrist.url}
                                x={0} y={0}
                                width={wMm} height={hMm}
                                opacity={settings.wristOpacity}
                                preserveAspectRatio="none"
                            />
                        </g>
                    </g>
                );
            })()}

            {skyPhoto && (() => {
                // снимок отрендерен в той же TAN-проекции и с тем же центром,
                // что и эскиз, поэтому геометрия точная: остаётся перевести
                // угловой размер снимка в миллиметры полотна
                const scale = Math.min(W, H) / 2 / Math.tan(rad(settings.fovDeg));
                const halfDeg = (target.photoFovDeg * settings.photoScale) / 2;
                const size = 2 * Math.tan(rad(halfDeg)) * scale; // снимок квадратный
                const fx = settings.flipX ? -1 : 1;
                const fy = settings.flipY ? -1 : 1;
                const cx = W / 2 + settings.panX;
                const cy = H / 2 + settings.panY;
                const rot = -(settings.rotation + settings.photoRotDeg * fx * fy);
                return (
                    <g clipPath="url(#sheet)" data-export="exclude">
                        <g
                            transform={
                                `translate(${cx} ${cy}) rotate(${rot}) scale(${fx} ${fy}) ` +
                                `translate(${-size / 2} ${-size / 2})`
                            }
                        >
                            <image
                                href={photoUrl!}
                                x={0} y={0}
                                width={size} height={size}
                                opacity={settings.photoOpacity}
                                preserveAspectRatio="none"
                            />
                        </g>
                    </g>
                );
            })()}

            {step > 0 && (
                <g clipPath="url(#sheet)" data-role="grid">
                    {gridX.map(x => (
                        <line
                            key={`x${x}`}
                            x1={x} y1={0} x2={x} y2={H}
                            stroke={gridStroke(x, step, onDark)}
                            strokeWidth={0.06}
                        />
                    ))}
                    {gridY.map(y => (
                        <line
                            key={`y${y}`}
                            x1={0} y1={y} x2={W} y2={y}
                            stroke={gridStroke(y, step, onDark)}
                            strokeWidth={0.06}
                        />
                    ))}
                </g>
            )}

            <g clipPath="url(#sheet)">
                {drawn.map((s, i) =>
                    skyPhoto ? (
                        // поверх снимка неба — контур, чтобы совмещать точки со звёздами
                        <circle
                            key={i}
                            data-role="star"
                            cx={s.X} cy={s.Y} r={s.d / 2}
                            fill="none" stroke="#ff4d5e" strokeWidth={0.12}
                        />
                    ) : (
                        <circle
                            key={i}
                            data-role="star"
                            cx={s.X} cy={s.Y} r={s.d / 2}
                            fill={settings.inkColor}
                            opacity={settings.inkOpacity}
                        />
                    ),
                )}
            </g>

            {settings.labels !== 'none' && (
                <g clipPath="url(#sheet)">
                    {drawn
                        .filter(s => s.name)
                        .map(s => {
                            const left = s.X > W - 12;
                            const lx = left ? s.X - s.d / 2 - 0.9 : s.X + s.d / 2 + 0.9;
                            const anchor = left ? 'end' : 'start';
                            return (
                                <g key={s.name}>
                                    <text
                                        data-role="name"
                                        x={lx} y={s.Y - 0.3}
                                        fontFamily={FONT} fontSize={1.4} fontWeight={600}
                                        fill={nameFill}
                                        textAnchor={anchor}
                                    >
                                        {s.name}
                                    </text>
                                    {settings.labels === 'full' && (
                                        <text
                                            data-role="info"
                                            x={lx} y={s.Y + 1.0}
                                            fontFamily={FONT} fontSize={0.85}
                                            fill={infoFill}
                                            textAnchor={anchor}
                                        >
                                            {s.mag.toFixed(1)}ᵐ · ⌀ {s.d.toFixed(2)} мм
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                </g>
            )}

            <g data-role="chrome" stroke={chromeStroke} strokeWidth={0.15}>
                <line x1={bx} y1={by} x2={bx + 10} y2={by} />
                <line x1={bx} y1={by - 0.8} x2={bx} y2={by + 0.8} />
                <line x1={bx + 10} y1={by - 0.8} x2={bx + 10} y2={by + 0.8} />
            </g>
            <text
                data-role="info"
                x={bx + 5} y={by - 1.4}
                fontFamily={FONT} fontSize={1.7}
                fill={infoFill} textAnchor="middle"
            >
                1 см
            </text>

            <rect
                data-role="chrome"
                x={0} y={0} width={W} height={H}
                fill="none" stroke={chromeStroke} strokeWidth={0.2}
            />
        </svg>
    );
});
