import { getPhotoUrl } from '../../lib/catalog';
import { INKS, SKIN_TONES } from '../../lib/palette';
import { Segmented, Slider, Swatches } from '../controls';
import { RotationDial } from '../RotationDial';
import type { PanelProps } from './types';

/** На чём: кожа, чернила, фото места на теле, снимок неба для сверки */
export function BodyPanel({
    settings, set, lang, tr, target, bodyPhoto, onBodyPhotoFile, onBodyPhotoRemove,
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
                    <h2>{tr('bodyPlace')}</h2>
                    {bodyPhoto && (
                        <Segmented
                            options={onOff}
                            value={settings.showBodyPhoto}
                            onChange={set('showBodyPhoto')}
                        />
                    )}
                </div>
                <div className="row wrap">
                    <label className="btn file-btn">
                        {bodyPhoto ? tr('replacePhoto') : tr('uploadPhoto')}
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={e => {
                                onBodyPhotoFile(e.target.files?.[0]);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {bodyPhoto && (
                        <button className="btn ghost" onClick={onBodyPhotoRemove}>
                            {tr('removePhoto')}
                        </button>
                    )}
                </div>

                {!bodyPhoto && <p className="stat">{tr('bodyPlaceHint')}</p>}

                {bodyPhoto && settings.showBodyPhoto && (
                    <>
                        <Slider
                            label={tr('frameSize')}
                            value={settings.bodyWidthCm}
                            min={3} max={30} step={0.1}
                            format={v => v.toFixed(1) + ' ' + cm}
                            editHint={tr('typeValueHint')}
                            onChange={set('bodyWidthCm')}
                        />
                        <Slider
                            label={tr('offsetX')}
                            value={settings.bodyOffX}
                            min={-100} max={100} step={1}
                            format={v => Math.round(v) + ' ' + mm}
                            editHint={tr('typeValueHint')}
                            onChange={set('bodyOffX')}
                        />
                        <Slider
                            label={tr('offsetY')}
                            value={settings.bodyOffY}
                            min={-100} max={100} step={1}
                            format={v => Math.round(v) + ' ' + mm}
                            editHint={tr('typeValueHint')}
                            onChange={set('bodyOffY')}
                        />
                        <RotationDial
                            value={settings.bodyRotDeg}
                            onChange={set('bodyRotDeg')}
                            lang={lang}
                        />
                        <Slider
                            label={tr('opacity')}
                            value={settings.bodyOpacity}
                            min={0.2} max={1} step={0.05}
                            format={v => Math.round(v * 100) + '%'}
                            editScale={100}
                            editHint={tr('typeValueHint')}
                            onChange={set('bodyOpacity')}
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
