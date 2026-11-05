import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { formatMoney } from '@/lib/format';

export default function VoidSaleDialog({ sale, onClose }) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => { setReason(''); setError(''); }, [sale]);

    if (!sale) return null;
    const label = sale.document_type === 'invoice' ? 'invoice' : 'sale';

    const submit = () => {
        setProcessing(true);
        router.post(route('sales.void', sale.id), { reason }, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: (errors) => setError(errors.reason || errors.delete || `Could not void this ${label}.`),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Void {sale.receipt_no}?</DialogTitle>
                    <DialogDescription>
                        RM {formatMoney(sale.total)} will be cancelled and the items returned to stock.
                        {sale.amount_paid > 0 && ` RM ${formatMoney(sale.amount_paid)} was already paid — refund the customer separately.`}
                        {' '}The {label} stays in the history as voided.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="void-reason">Reason</Label>
                    <Textarea
                        id="void-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Wrong item, customer cancelled"
                        autoFocus
                    />
                    {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>Back</Button>
                    <Button variant="destructive" onClick={submit} disabled={processing || !reason.trim()}>
                        {processing ? 'Saving…' : `${isOpenOrder ? 'Cancel' : 'Void'} ${label}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
