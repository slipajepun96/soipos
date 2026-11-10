import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Check, Copy, Landmark } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { formatMoney } from '@/lib/format';

/** The store's bank account, shown in the payment panel when Bank Transfer is selected. */
export default function BankDetails({ account, total }) {
    const [copied, setCopied] = useState(false);

    if (!account) {
        return (
            <div className="flex items-start gap-2 rounded-md border border-dashed bg-background p-3 text-xs text-muted-foreground">
                <Landmark className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                    No bank account yet. Add it in{' '}
                    <Link href={route('settings.edit')} className="font-medium text-foreground underline">Settings</Link>
                    {' '}to show it here for bank transfers.
                </span>
            </div>
        );
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(account.account_no.replace(/[\s-]/g, ''));
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable (e.g. non-HTTPS); the number is still on screen
        }
    };

    return (
        <div className="space-y-1 rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark className="h-3.5 w-3.5" />Transfer to</span>
                <span className="font-semibold tabular-nums">RM {formatMoney(total)}</span>
            </div>
            <p className="font-medium">{account.bank_name}</p>
            <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-semibold tracking-wide">{account.account_no}</span>
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={copy} aria-label="Copy account number">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
            </div>
            {account.account_name && <p className="text-xs text-muted-foreground">{account.account_name}</p>}
        </div>
    );
}
