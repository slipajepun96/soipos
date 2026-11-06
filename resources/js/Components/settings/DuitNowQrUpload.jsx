import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Loader2, QrCode, Trash2, Upload } from 'lucide-react';
import { Button } from '@/Components/ui/button';

const MAX_SIDE = 1200; // keeps the QR sharp while keeping the file small

/** Shrinks big photos/screenshots; PNG keeps the QR's edges crisp. */
async function prepare(file) {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
        throw new Error(/heic|heif/i.test(file.type + file.name)
            ? 'This browser cannot read HEIC photos. Use a screenshot or a JPG/PNG.'
            : 'This file is not a picture the browser can read.');
    }
    if (Math.max(bitmap.width, bitmap.height) <= MAX_SIDE && file.size < 1.5 * 1024 * 1024) {
        bitmap.close?.();
        return file;
    }
    const scale = MAX_SIDE / Math.max(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not process the picture.');
    return new File([blob], 'duitnow-qr.png', { type: 'image/png' });
}

/** Upload / replace / remove the store's DuitNow QR. Saves immediately. */
export default function DuitNowQrUpload({ current }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const pick = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        try {
            const ready = await prepare(file);
            router.post(route('settings.duitnow.store'), { duitnow_qr: ready }, {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setBusy(false),
            });
        } catch (err) {
            toast.error('QR not uploaded', { description: err.message });
            setBusy(false);
        }
    };

    const remove = () => {
        if (!window.confirm('Remove the DuitNow QR? E-wallet payments at the POS will no longer show a QR.')) return;
        router.delete(route('settings.duitnow.destroy'), { preserveScroll: true });
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-foreground/40"
                aria-label="Choose DuitNow QR picture"
            >
                {busy ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    : current ? <img src={current} alt="DuitNow QR" className="h-full w-full object-contain" />
                        : <QrCode className="h-10 w-10 text-muted-foreground" />}
            </button>
            <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                    Upload the DuitNow QR from your bank or e-wallet merchant app (a screenshot is fine).
                    It appears at the POS when <span className="font-medium text-foreground">E-Wallet</span> is chosen, so the customer can scan and pay.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
                        <Upload />{current ? 'Replace QR' : 'Upload QR'}
                    </Button>
                    {current && (
                        <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
                            <Trash2 />Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Saved immediately for this store only.</p>
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
    );
}
