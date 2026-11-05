import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

/** Read-only public link with Copy and Open buttons. */
export function PublicLink({ url, className }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard API needs https; fall back to the old way.
            const el = document.createElement('textarea');
            el.value = url;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            el.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className={cn('flex gap-2', className)}>
            <Input readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 font-mono text-xs" />
            <Button type="button" variant="outline" onClick={copy} className="shrink-0">
                {copied ? <Check /> : <Copy />}
                {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button type="button" variant="outline" size="icon" asChild className="shrink-0">
                <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open form"><ExternalLink /></a>
            </Button>
        </div>
    );
}

export function OrderStatusBadge({ status }) {
    if (status === 'collected') return <Badge variant="secondary">Collected</Badge>;
    if (status === 'cancelled') return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
    return <Badge>Pending</Badge>;
}

/** "Open · taking orders" / "Closed" etc. */
export function FormStatusBadge({ session, accepting }) {
    if (session.status === 'closed') return <Badge variant="outline">Closed</Badge>;
    if (accepting) return <Badge>Taking orders</Badge>;
    return <Badge variant="outline">Not taking orders</Badge>;
}

export const pickupText = (s) => [s.pickup_date ? formatDate(s.pickup_date) : null, s.pickup_time].filter(Boolean).join(', ');
