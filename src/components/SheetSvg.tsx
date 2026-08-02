import { forwardRef } from 'react';
import photoUrl from '../assets/pleiades.jpg';
import { rad } from '../lib/catalog';
import { sheetSize } from '../lib/model';
import type { DrawnStar, Settings, WristImage } from '../lib/types';

const FONT = 'Helvetica, Arial, sans-serif';

// пропорции src/assets/pleiades.jpg (1280×923)
const PHOTO_ASPECT = 923 / 1280;

// Центр снимка не совпадает с центроидом именованных звёзд —
// сдвиг подобран по совмещению ярких звёзд (тангенс-единицы: u — восток, v — север)
const PHOTO_CENTER = { du: 0.00131, dv: -0.00115 };

interface Props {
    settings: Settings;
    drawn: DrawnStar[];
    wrist: WristImage | null;
}

function gridStroke(pos: number, stepMm: number): string {
    if (pos % 10 === 0) return '#dcdce6';
    if (stepMm < 5 && pos % 5 === 0) return '#e6e6ee';
    return '#f1f1f6';
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

    return (
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`}>
            <defs>
                <clipPath id="sheet">
                    <rect x={0} y={0} width={W} height={H} />
                </clipPath>
            </defs>

            <rect x={0} y={0} width={W} height={H} fill="#ffffff" />

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

            {settings.showPhoto && (() => {
                // фото привязано к небу: центр — центроид скопления,
                // трансформации те же, что у звёзд (fov, pan, rotation, flips)
                const scale = Math.min(W, H) / 2 / Math.tan(rad(settings.fovDeg));
                const wMm = 2 * Math.tan(rad(settings.photoFovDeg / 2)) * scale;
                const hMm = wMm * PHOTO_ASPECT;
                const fx = settings.flipX ? -1 : 1;
                const fy = settings.flipY ? -1 : 1;
                // центр фото проходит ту же трансформацию, что и звезда с (u, v) = PHOTO_CENTER
                const th = rad(settings.rotation);
                const x0 = fx * -PHOTO_CENTER.du;
                const y0 = fy * PHOTO_CENTER.dv;
                const cx = W / 2 + settings.panX + (x0 * Math.cos(th) - y0 * Math.sin(th)) * scale;
                const cy = H / 2 + settings.panY - (x0 * Math.sin(th) + y0 * Math.cos(th)) * scale;
                const rot = -(settings.rotation + settings.photoRotDeg * fx * fy);
                return (
                    <g clipPath="url(#sheet)" data-export="exclude">
                        <g
                            transform={
                                `translate(${cx} ${cy}) rotate(${rot}) scale(${fx} ${fy}) ` +
                                `translate(${-wMm / 2} ${-hMm / 2})`
                            }
                        >
                            <image
                                href={photoUrl}
                                x={0} y={0}
                                width={wMm} height={hMm}
                                opacity={settings.photoOpacity}
                                preserveAspectRatio="none"
                            />
                        </g>
                    </g>
                );
            })()}

            {step > 0 && (
                <g clipPath="url(#sheet)">
                    {gridX.map(x => (
                        <line
                            key={`x${x}`}
                            x1={x} y1={0} x2={x} y2={H}
                            stroke={gridStroke(x, step)}
                            strokeWidth={0.06}
                        />
                    ))}
                    {gridY.map(y => (
                        <line
                            key={`y${y}`}
                            x1={0} y1={y} x2={W} y2={y}
                            stroke={gridStroke(y, step)}
                            strokeWidth={0.06}
                        />
                    ))}
                </g>
            )}

            <g clipPath="url(#sheet)">
                {drawn.map((s, i) =>
                    settings.showPhoto ? (
                        // поверх фото — контур, чтобы точки были видны на тёмном снимке
                        <circle
                            key={i}
                            cx={s.X} cy={s.Y} r={s.d / 2}
                            fill="none" stroke="#ff4d5e" strokeWidth={0.12}
                        />
                    ) : (
                        <circle key={i} cx={s.X} cy={s.Y} r={s.d / 2} fill="#000" />
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
                                        x={lx} y={s.Y - 0.3}
                                        fontFamily={FONT} fontSize={1.4} fontWeight={600}
                                        fill={settings.showPhoto ? '#f0f0f5' : '#33343d'}
                                        textAnchor={anchor}
                                    >
                                        {s.name}
                                    </text>
                                    {settings.labels === 'full' && (
                                        <text
                                            x={lx} y={s.Y + 1.0}
                                            fontFamily={FONT} fontSize={0.85}
                                            fill={settings.showPhoto ? '#c9cad6' : '#8a8b96'}
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

            <g stroke="#b9bac4" strokeWidth={0.15}>
                <line x1={bx} y1={by} x2={bx + 10} y2={by} />
                <line x1={bx} y1={by - 0.8} x2={bx} y2={by + 0.8} />
                <line x1={bx + 10} y1={by - 0.8} x2={bx + 10} y2={by + 0.8} />
            </g>
            <text
                x={bx + 5} y={by - 1.4}
                fontFamily={FONT} fontSize={1.7}
                fill="#b9bac4" textAnchor="middle"
            >
                1 см
            </text>

            <rect
                x={0} y={0} width={W} height={H}
                fill="none" stroke="#c9cad4" strokeWidth={0.2}
            />
        </svg>
    );
});
