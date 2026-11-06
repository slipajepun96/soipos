/**
 * Shrinks a photo so its longest side is at most `maxSide` px and re-encodes it as JPEG
 * (on a white background). GIFs are returned as-is. Throws with a readable message.
 */
export async function shrinkImage(file, { maxSide = 800, quality = 0.85, name } = {}) {
    if (file.type === 'image/gif') return file;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
        throw new Error(/heic|heif/i.test(file.type + file.name)
            ? 'This browser cannot read HEIC photos. Choose a JPG or PNG instead.'
            : 'This file is not a picture the browser can read.');
    }
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) throw new Error('Could not process the photo.');
    const base = name || file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}
