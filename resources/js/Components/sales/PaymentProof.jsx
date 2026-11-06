import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Camera, ImageIcon, Loader2, ReceiptText, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { shrinkImage } from '@/lib/image';
import { errorMessage } from '@/lib/notifications';

/** Long side of the saved photo: big enough to read the amount and transaction ID. */
const PROOF_SIDE = 1600;

/** Methods where the customer pays on their own phone / bank, so a screenshot is the proof. */
export const PROOF_METHODS = ['E-Wallet', 'Bank Transfer', 'Card'];

/** Shrinks and uploads a proof photo for one payment. Returns the updated payment. */
export async function uploadPaymentProof(saleId, paymentId, file) {
    const body = new FormData();
    body.append('proof', file);
    const { data } = await axios.post(route('sales.payments.proof.store', [saleId, paymentId]), body);
    return data.payment;
}

/**
 * After a sale is saved, attach the proof photo to the payment it just made.
 * Never throws: the sale is already saved, so a failed upload is only a warning.
 */
export async function attachProofToNewSale(sale, file) {
    const payment = sale?.payments?.[sale.payments.length - 1];
    if (!file || !payment) return;
    try {
        await uploadPaymentProof(sale.id, payment.id, file);
    } catch (error) {
        toast.warning('Sale saved, but the payment proof photo was not', {
            description: `${errorMessage(error)} Add it again from Sales → ${sale.receipt_no}.`,
            duration: 10000,
        });
    }
}

async function prepare(file) {
    return shrinkImage(file, { maxSide: PROOF_SIDE, quality: 0.82, name: 'payment-proof' });
}

/** Hidden camera / gallery inputs that hand back a shrunk photo. */
function usePhotoPicker(onPicked) {
    const cameraRef = useRef(null);
    const galleryRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const onChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        try {
            await onPicked(await prepare(file));
        } catch (err) {
            toast.error('Payment proof not added', { description: err.message || errorMessage(err) });
        } finally {
            setBusy(false);
        }
    };

    const inputs = (
        <>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
        </>
    );

    return { busy, inputs, snap: () => cameraRef.current?.click(), choose: () => galleryRef.current?.click() };
}

/**
 * POS / collect: snap the customer's transfer or e-wallet success screen before charging.
 * Controlled: `file` is the shrunk photo (or null), `onChange(file|null)`.
 */
export function PaymentProofInput({ file, onChange }) {
    const [preview, setPreview] = useState(null);
    const [viewing, setViewing] = useState(false);
    const picker = usePhotoPicker(async (small) => onChange(small));

    useEffect(() => {
        if (!file) { setPreview(null); return undefined; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Payment proof (optional)</p>
            {preview ? (
                <div className="flex items-center gap-3 rounded-md border bg-background p-2">
                    <button type="button" onClick={() => setViewing(true)} className="h-16 w-12 shrink-0 overflow-hidden rounded border bg-muted" aria-label="View payment proof">
                        <img src={preview} alt="Payment proof" className="h-full w-full object-cover" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">Proof attached</p>
                        <p className="text-xs text-muted-foreground">Saved with the sale when you charge.</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={picker.snap} disabled={picker.busy}>Retake</Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(null)} aria-label="Remove payment proof"><X /></Button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 bg-background" onClick={picker.snap} disabled={picker.busy}>
                        {picker.busy ? <Loader2 className="animate-spin" /> : <Camera />}
                        Snap payment proof
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="shrink-0 bg-background" onClick={picker.choose} disabled={picker.busy} aria-label="Choose payment proof from gallery">
                        <ImageIcon />
                    </Button>
                </div>
            )}
            {picker.inputs}
            <ProofViewer url={viewing ? preview : null} onClose={() => setViewing(false)} />
        </div>
    );
}

/** Sale details: view the saved proof, or add / replace one for an earlier payment. */
export function PaymentProofCell({ saleId, payment, canEdit, onChanged }) {
    const [viewing, setViewing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const picker = usePhotoPicker(async (small) => {
        setUploading(true);
        try {
            await uploadPaymentProof(saleId, payment.id, small);
            toast.success('Payment proof saved.');
            onChanged?.();
        } catch (error) {
            toast.error('Payment proof not saved', { description: errorMessage(error) });
        } finally {
            setUploading(false);
        }
    });
    const busy = picker.busy || uploading;

    const remove = async () => {
        if (!window.confirm('Remove this payment proof photo?')) return;
        try {
            await axios.delete(route('sales.payments.proof.destroy', [saleId, payment.id]));
            toast.success('Payment proof removed.');
            setViewing(false);
            onChanged?.();
        } catch (error) {
            toast.error('Payment proof not removed', { description: errorMessage(error) });
        }
    };

    if (payment.proof_url) {
        return (
            <>
                <button type="button" onClick={() => setViewing(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline">
                    <ReceiptText className="h-3.5 w-3.5" />View proof
                </button>
                <ProofViewer
                    url={viewing ? payment.proof_url : null}
                    onClose={() => setViewing(false)}
                    actions={canEdit && (
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={picker.snap} disabled={busy}>
                                {busy ? <Loader2 className="animate-spin" /> : <Camera />}Replace
                            </Button>
                            <Button type="button" variant="outline" className="flex-1" onClick={remove} disabled={busy}>Remove</Button>
                        </div>
                    )}
                />
                {picker.inputs}
            </>
        );
    }

    if (!canEdit || payment.method === 'Cash') return null;

    return (
        <>
            <button type="button" onClick={picker.snap} disabled={busy} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50">
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}Add proof
            </button>
            {picker.inputs}
        </>
    );
}

function ProofViewer({ url, onClose, actions }) {
    return (
        <Dialog open={Boolean(url)} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[100dvh] flex-col gap-3 overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Payment proof</DialogTitle>
                    <DialogDescription>The customer's transfer / e-wallet success screen.</DialogDescription>
                </DialogHeader>
                {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border bg-muted">
                        <img src={url} alt="Payment proof" className="mx-auto max-h-[70dvh] w-auto object-contain" />
                    </a>
                )}
                {actions}
            </DialogContent>
        </Dialog>
    );
}
