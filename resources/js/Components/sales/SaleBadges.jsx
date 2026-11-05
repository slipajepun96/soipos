import { Badge } from '@/Components/ui/badge';

/** Payment state of a sale: Paid / Partial / Unpaid / Overdue / Voided. */
export function PaymentStatusBadge({ sale }) {
    if (sale.status === 'voided') return <Badge variant="outline">Voided</Badge>;
    if (sale.payment_status === 'paid') return <Badge variant="secondary">Paid</Badge>;
    if (sale.is_overdue) return <Badge variant="destructive">Overdue</Badge>;
    if (sale.payment_status === 'partial') return <Badge variant="outline">Partial</Badge>;
    return <Badge>Unpaid</Badge>;
}

export function DocTypeBadge({ sale }) {
    return (
        <Badge variant="outline" className="font-normal">
            {sale.document_type === 'invoice' ? 'Invoice' : 'Receipt'}
        </Badge>
    );
}
