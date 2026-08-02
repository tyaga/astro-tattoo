export function downloadBlob(filename: string, blob: Blob): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/** Сериализует отрисованный SVG в автономный файл с физическими размерами в мм.
 *  Узлы с data-export="exclude" (фото-подложка) в файл не попадают. */
export function svgToStandalone(
    svg: SVGSVGElement,
    widthMm: number,
    heightMm: number,
): string {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('[data-export="exclude"]').forEach(el => el.remove());
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', `${widthMm}mm`);
    clone.setAttribute('height', `${heightMm}mm`);
    return new XMLSerializer().serializeToString(clone);
}

export function exportPng(
    svgString: string,
    widthMm: number,
    heightMm: number,
    filename: string,
    dpi = 300,
): void {
    const pxPerMm = dpi / 25.4;
    const img = new Image();
    const url = URL.createObjectURL(
        new Blob([svgString], { type: 'image/svg+xml' }),
    );
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(widthMm * pxPerMm);
        canvas.height = Math.round(heightMm * pxPerMm);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => {
            if (blob) downloadBlob(filename, blob);
        }, 'image/png');
    };
    img.src = url;
}
