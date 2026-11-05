import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { PickupInfo, PublicShell } from '@/Components/preorders/PublicShell';
import SaveReservationButton from '@/Components/preorders/ReservationImage';
import { formatMoney } from '@/lib/format';

export default function PreorderThanks({ token, shop, session, order }) {
    return (
        <PublicShell title={`Order ${order.order_no}`} shop={shop}>
            <Card>
                <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <CheckCircle2 className="h-12 w-12" />
                    <p className="text-lg font-semibold">Thank you, {order.customer_name}!</p>
                    <p className="text-sm text-muted-foreground">Your order has been received. Show this order number when you pick up.</p>
                    <p className="mt-2 rounded-lg border-2 border-foreground px-5 py-2 font-mono text-3xl font-bold tracking-wider">{order.order_no}</p>
                    <SaveReservationButton shop={shop} session={session} order={order} />
                    <p className="text-xs text-muted-foreground">Saves a picture with your order number, items and pickup details.</p>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-2 p-5 text-sm">
                    <p className="font-semibold">{session.name}</p>
                    {order.lines.map((line) => (
                        <div key={line.id} className="flex justify-between gap-3">
                            <span>{line.quantity} × {line.label}</span>
                            <span className="tabular-nums">RM {formatMoney(line.line_total)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between border-t pt-2 text-base font-semibold">
                        <span>Total to pay at pickup</span>
                        <span className="tabular-nums">RM {formatMoney(order.total)}</span>
                    </div>
                    <div className="border-t pt-2 text-muted-foreground">
                        <p>{order.customer_phone}</p>
                        {order.customer_address && <p className="whitespace-pre-line">{order.customer_address}</p>}
                        {order.notes && <p className="italic">“{order.notes}”</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-3 p-5">
                    <p className="font-semibold">Pickup</p>
                    <PickupInfo session={{ ...session, closes_at: null }} />
                    {session.remarks && <p className="whitespace-pre-line rounded-md bg-muted p-3 text-sm">{session.remarks}</p>}
                </CardContent>
            </Card>

            <Button variant="outline" className="w-full" asChild>
                <a href={route('preorder.form', token)}>Place another order</a>
            </Button>
        </PublicShell>
    );
}
