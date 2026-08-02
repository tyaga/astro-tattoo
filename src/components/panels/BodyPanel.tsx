import { getPhotoUrl } from '../../lib/catalog';
import { INKS, SKIN_TONES } from '../../lib/palette';
import { Segmented, Slider, Swatches } from '../controls';
import { RotationDial } from '../RotationDial';
import type { PanelProps } from './types';

/** На чём: кожа, чернила, фото своего тела, снимок неба для сверки */
export function BodyPanel({
    settings, set, lang, tr, target, wrist, onWristFile, onWristRemove,
}: PanelProps) {
    const cm = tr('cm');
    const mm = tr('mm');
    const onOff = [
        { value: true, label: tr('on'), title: tr('show') },
        { value: false, label: tr('off'), title: tr('hide') },
    ];

    return (
        <>
            <section className="group">
                <h2>{tr('skinAndInk')}</h2>
                <Swatches
                    label={tr('skinTone')}
                    options={SKIN_TONES}
                    value={settings.skinTone}
                    onChange={set('skinTone')}
                    customLabel={tr('ownColor')}
                    customTitle={tr('customColor')}
                    lang={lang}
                />
                <Swatches
                    label={tr('ink')}
                    options={INKS}
                    value={settings.inkColor}
                    onChange={set('inkColor')}
                    customLabel={tr('ownColor')}
                    customTitle={tr('customColor')}
                    lang={lang}
                />
                <Slider
                    label={tr('inkOpacity')}
                    value={settings.inkOpacity}
                    min={0.3} max={1} step={0.02}
                    format={v => Math.round(v * 100) + '%'}
                    editScale={100}
                    editHint={tr('typeValueHint')}
                    onChange={set('inkOpacity')}
                />
            </section>

            <section className="group">
                <div className="group-head">
                    <h2>{tr('wrist')}</h2>
                    {wrist && (
                        <Segmented
                            options={onOff}
                            value={settings.showWrist}
                            onChange={set('showWrist')}
                        />
                    )}
                </div>
                <div className="row wrap">
                    <label className="btn file-btn">
                        {wrist ? tr('replacePhoto') : tr('uploadPhoto')}
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={e => {
                                onWristFile(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {wrist && (
                        <button className="btn ghost" onClick={onWristRemove}>
                            {tr('removePhoto')}
                        </button>
                    )}
                </div>

                {!wrist && <p className="stat">{tr('wristHint')}</p>}

                {wrist && settings.showWrist && (
                    <>
                        <Slider
                            label={tr('frameSize')}
                            value={settings.wristWidthCm}
                            min={3} max={30} step={0.1}
                            format={v => v.toFixed(1) + ' ' + cm}
                            editHint={tr('typeValueHint')}
                            onChange={set('wristWidthCm')}
                        />
                        <Slider
                            label={tr('offsetX')}
                            value={settings.wristOffX}
                            min={-100} max={100} step={1}
                            format={v => Math.round(v) + ' ' + mm}
                            editHint={tr('typeValueHint')}
                            onChange={set('wristOffX')}
                        />
                        <Slider
                            label={tr('offsetY')}
                            value={settings.wristOffY}
                            min={-100} max={100} step={1}
                            format={v => Math.round(v) + ' ' + mm}
                            editHint={tr('typeValueHint')}
                            onChange={set('wristOffY')}
                        />
                        <RotationDial
                            value={settings.wristRotDeg}
                            onChange={set('wristRotDeg')}
                            lang={lang}
                        />
                        <Slider
                            label={tr('opacity')}
                            value={settings.wristOpacity}
                            min={0.2} max={1} step={0.05}
                            format={v => Math.round(v * 100) + '%'}
                            editScale={100}
                            editHint={tr('typeValueHint')}
                            onChange={set('wristOpacity')}
                        />
                    </>
                )}
            </section>

            {getPhotoUrl(target.id) && (
                <section className="group">
                    <div className="group-head">
                        <h2>{tr('skyPhoto')}</h2>
                        <Segmented
                            options={onOff}
                            value={settings.showPhoto}
                            onChange={set('showPhoto')}
                        />
                    </div>
                    {settings.showPhoto && (
                        <Slider
                            label={tr('opacity')}
                            value={settings.photoOpacity}
                            min={0.2} max={1} step={0.05}
                            format={v => Math.round(v * 100) + '%'}
                            editScale={100}
                            editHint={tr('typeValueHint')}
                            onChange={set('photoOpacity')}
                        />
                    )}
                </section>
            )}
        </>
    );
}
