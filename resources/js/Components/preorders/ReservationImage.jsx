import { forwardRef, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageDown, Loader2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { pickupDate } from '@/Components/preorders/PublicShell';
import { formatMoney } from '@/lib/format';

/**
 * Fixed-width reservation card used only as the source of the saved picture.
 * Plain colours (no theme variables) so the image looks the same on every phone.
 */
const ReservationCard = forwardRef(function ReservationCard({ shop, session, order }, ref) {
    const status = order.status === 'cancelled' ? 'CANCELLED'
        : order.status === 'collected' ? 'COLLECTED'
            : `PAY RM ${formatMoney(order.total)} AT PICKUP`;

    return (
        <div ref={ref} style={{ width: 400 }} className="bg-white p-6 text-left text-[13px] leading-snug text-neutral-950">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-base font-bold">{shop?.name || 'Pre-order'}</p>
                    {shop?.phone && <p className="text-neutral-500">{shop.phone}</p>}
                </div>
                {order.ordered_at && <p className="text-right text-[11px] text-neutral-500">Ordered<br />{order.ordered_at}</p>}
            </div>

            <p className="mt-4 border-b-2 border-neutral-950 pb-1 text-[11px] font-bold uppercase tracking-[0.15em]">Pre-order reservation</p>

            <div className="mt-4 text-center">
                <div className="mx-auto inline-block border-2 border-neutral-950 px-6 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Order number</p>
                    <p className="font-mono text-3xl font-bold tracking-wider">{order.order_no}</p>
                </div>
                <div>
                    <span className="mt-2 inline-block rounded-full bg-neutral-950 px-3 py-1 text-[11px] font-bold tracking-wide text-white">{status}</span>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Customer</p>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p>{order.customer_phone}</p>
                    {order.customer_address && <p className="whitespace-pre-line text-neutral-600">{order.customer_address}</p>}
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Pickup</p>
                    <p className="font-semibold">{pickupDate(session.pickup_date) || '—'}</p>
                    {session.pickup_time && <p>{session.pickup_time}</p>}
                    {session.pickup_location && <p className="text-neutral-600">{session.pickup_location}</p>}
                </div>
            </div>

            <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{session.name}</p>
                <div className="mt-1 border-t border-neutral-950">
                    {order.lines.map((line) => (
                        <div key={line.id} className="flex justify-between gap-3 border-b border-neutral-200 py-1.5">
                            <span><span className="font-bold">{line.quantity} ×</span> {line.label}</span>
                            <span className="tabular-nums">{formatMoney(line.line_total)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between border-t-2 border-neutral-950 pt-2 text-base font-bold">
                    <span>Total{order.status === 'pending' ? ' (pay at pickup)' : ''}</span>
                    <span className="tabular-nums">RM {formatMoney(order.total)}</span>
                </div>
            </div>

            {order.notes && (
                <div className="mt-4 rounded bg-neutral-100 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Your note</p>
                    <p>{order.notes}</p>
                </div>
            )}
            {session.remarks && (
                <div className="mt-3 rounded bg-neutral-100 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">From {shop?.name || 'the shop'}</p>
                    <p className="whitespace-pre-line">{session.remarks}</p>
                </div>
            )}

            <p className="mt-5 border-t border-dashed border-neutral-400 pt-3 text-center font-semibold">Show this order number when you pick up.</p>
        </div>
    );
});

function pictureError(e) {
    const text = `${e?.name || ''} ${e?.message || ''}`;
    if (/dynamically imported module|Loading chunk|Failed to fetch/i.test(text)) return 'The picture tool could not load (check your internet connection).';
    if (e?.name === 'SecurityError') return 'Your browser blocked reading the page to make a picture.';
    if (e?.message === 'empty') return 'Your browser returned an empty picture.';
    if (/memory|too large|canvas/i.test(text)) return 'Your phone ran out of memory making the picture.';
    if (e?.name === 'NotAllowedError') return 'Your browser blocked saving the file.';
    return `Your browser could not make the picture${e?.message ? ` (${e.message})` : ''}.`;
}

/** "Save reservation" button: turns the card into a PNG and shares or downloads it. */
export default function SaveReservationButton({ shop, session, order }) {
    const cardRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const filename = `Reservation-${order.order_no}.png`;

    const save = async () => {
        setBusy(true);
        try {
            const { toBlob } = await import('html-to-image');
            const options = { pixelRatio: 3, backgroundColor: '#ffffff', cacheBust: true };
            await toBlob(cardRef.current, options); // first pass warms fonts (Safari draws blank text otherwise)
            const blob = await toBlob(cardRef.current, options);
            if (!blob) throw new Error('empty');

            const file = new File([blob], filename, { type: 'image/png' });
            // Phones: the share sheet has "Save Image" (Photos). Desktop: normal download.
            if (navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: `Reservation ${order.order_no}` });
                    return;
                } catch (e) {
                    if (e?.name === 'AbortError') return; // customer closed the share sheet
                }
            }
            const url = URL.createObjectURL(blob);
            const a = Object.assign(document.createElement('a'), { href: url, download: filename });
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            toast.success('Reservation picture saved', { description: 'Check your Downloads or Photos.' });
        } catch (e) {
            toast.error('Could not create the picture', { description: `${pictureError(e)} Take a screenshot of this page instead.` });
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Button size="lg" className="mt-3 w-full" onClick={save} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <ImageDown />}Save reservation
            </Button>
            {/* Off-screen source for the picture */}
            <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0">
                <ReservationCard ref={cardRef} shop={shop} session={session} order={order} />
            </div>
        </>
    );
}
