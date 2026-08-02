import type { WristImage } from './types';

/** Читает файл изображения, уменьшает до maxDim по большей стороне
 *  и возвращает jpeg data-URL с пропорциями */
export function fileToWristImage(file: File, maxDim = 1400): Promise<WristImage> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const k = Math.min(1, maxDim / Math.max(img.width, img.height));
            const w = Math.round(img.width * k);
            const h = Math.round(img.height * k);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, w, h);
            resolve({
                url: canvas.toDataURL('image/jpeg', 0.85),
                aspect: h / w,
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Не удалось прочитать изображение'));
        };
        img.src = url;
    });
}
