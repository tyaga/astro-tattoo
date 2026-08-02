import { useEffect, useState } from 'react';
import type { StringKey } from '../i18n';

interface Props {
    tr: (key: StringKey) => string;
    onReset: () => void;
}

/** Сброс лежит на виду во всех вкладках, поэтому спрашивает подтверждение:
 *  он стирает подгонку всех объектов, а случайно задеть его теперь легко. */
export function ResetButton({ tr, onReset }: Props) {
    const [armed, setArmed] = useState(false);

    useEffect(() => {
        if (!armed) return;
        const timer = setTimeout(() => setArmed(false), 4000);
        return () => clearTimeout(timer);
    }, [armed]);

    return (
        <button
            className={armed ? 'btn ghost danger armed' : 'btn ghost danger'}
            title={tr('resetAllHint')}
            onClick={() => {
                if (!armed) {
                    setArmed(true);
                    return;
                }
                setArmed(false);
                onReset();
            }}
        >
            {tr('resetAll')}
            {armed && <span className="reset-confirm"> — {tr('confirmReset')}</span>}
        </button>
    );
}
