import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Expand, QrCode } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { formatMoney } from '@/lib/format';

/**
 * The store's DuitNow QR for e-wallet payments. Small in the payment panel; "Show to customer"
 * opens it full screen with the amount, so the customer can scan it from the merchant's device.
 */
export default function DuitNowQr({ qr, total }) {
    const [open, setOpen] = useState(false);

    if (!qr) {
        return (
            <div className="flex items-start gap-2 rounded-md border border-dashed bg-background p-3 text-xs text-muted-foreground">
                <QrCode className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                    No DuitNow QR yet. Upload it in{' '}
                    <Link href={route('settings.edit')} className="font-medium text-foreground underline">Settings</Link>
                    {' '}to show it here for e-wallet payments.
                </span>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-3 rounded-md border bg-background p-2">
                <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded bg-white p-1" aria-label="Show DuitNow QR full screen">
                    <img src={qr} alt="DuitNow QR" className="h-24 w-24 object-contain" />
                </button>
                <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">Customer scans to pay</p>
                    <p className="text-lg font-semibold tabular-nums">RM {formatMoney(total)}</p>
                    <Button type="button" size="sm" className="w-full" onClick={() => setOpen(true)}>
                        <Expand />Show to customer
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[100dvh] flex-col items-center gap-4 overflow-y-auto bg-white p-6 text-black sm:max-w-md">
                    <DialogHeader className="items-center text-center">
                        <DialogTitle className="text-base font-medium text-neutral-600">Scan with any e-wallet or banking app</DialogTitle>
                        <DialogDescription className="text-4xl font-bold tabular-nums text-black">RM {formatMoney(total)}</DialogDescription>
                    </DialogHeader>
                    <img src={qr} alt="DuitNow QR" className="w-full max-w-sm object-contain" />
                    <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(false)}>Done</Button>
                </DialogContent>
            </Dialog>
        </>
    );
}
