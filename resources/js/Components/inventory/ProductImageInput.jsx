import { useEffect, useRef, useState } from 'react';
import { Camera, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { shrinkImage } from '@/lib/image';

const MAX_SIDE = 800; // px: plenty for POS tiles, keeps uploads ~100 KB
const shrink = (file) => shrinkImage(file, { maxSide: MAX_SIDE });

/**
 * Product photo picker with preview.
 * `currentUrl` is the saved photo; `onChange({ file, remove })` reports what to send.
 */
export default function ProductImageInput({ currentUrl, onChange, error }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(currentUrl || null);
    const [busy, setBusy] = useState(false);

    useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);
    useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

    const pick = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        try {
            const small = await shrink(file);
            setPreview(URL.createObjectURL(small));
            onChange({ file: small, remove: false });
        } catch (err) {
            toast.error('Photo not added', { description: err.message });
        } finally {
            setBusy(false);
        }
    };

    const remove = () => {
        setPreview(null);
        onChange({ file: null, remove: Boolean(currentUrl) });
    };

    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted hover:border-foreground/40"
                aria-label="Choose product photo"
            >
                {busy ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    : preview ? <img src={preview} alt="" className="h-full w-full object-cover" />
                        : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
            </button>
            <div className="space-y-1.5">
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
                        <Camera />{preview ? 'Change photo' : 'Add photo'}
                    </Button>
                    {preview && (
                        <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={busy}>
                            <Trash2 />Remove
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">Shown on the POS and pre-order form. JPG, PNG, WebP or GIF.</p>
                {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
    );
}
