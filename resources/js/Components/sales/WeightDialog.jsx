import { useState } from 'react';
import { Scale } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { formatKg, formatMoney, productLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const QUICK_KG = [0.25, 0.5, 1, 2];
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const round3 = (n) => Math.round((n + Number.EPSILON) * 1000) / 1000;

/** Keep only digits and one decimal point (comma counts as a point), with at most `decimals` places. */
function clean(value, decimals) {
    let v = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
    const dot = v.indexOf('.');
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, decimals);
    return v.replace(/^0+(?=\d)/, '');
}

/**
 * Weight entry for a product sold by weight: the cashier reads the scale and types kg (numeric
 * keypad on phones and tablets), or types a RM amount and the weight is worked out.
 */
export default function WeightDialog({ product, initialKg = null, maxKg = Infinity, onConfirm, onClose }) {
    const price = Number(product.product_price || 0);
    const [mode, setMode] = useState('kg'); // kg | rm
    const [value, setValue] = useState(initialKg ? String(initialKg) : '');

    const entered = Number(value || 0);
    const kg = mode === 'kg' ? round3(entered) : price > 0 ? round3(entered / price) : 0;
    const total = round2(kg * price);
    const tooMuch = kg > maxKg + 0.0005;
    const ok = kg > 0 && !tooMuch;

    const submit = (e) => {
        e?.preventDefault();
        if (ok) onConfirm(kg);
    };
    const switchMode = (next) => {
        if (next === mode) return;
        // Carry the current amount over so the cashier can see both.
        setValue(next === 'rm' ? (total ? String(total) : '') : (kg ? String(kg) : ''));
        setMode(next);
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-sm">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Scale className="h-5 w-5" />{productLabel(product)}</DialogTitle>
                        <DialogDescription>RM {formatMoney(price)} per kg · read the weight off the scale</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 rounded-md border bg-muted p-0.5 text-sm">
                        {[['kg', 'Weight (kg)'], ['rm', 'Amount (RM)']].map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => switchMode(key)}
                                className={cn('rounded py-1.5 font-medium', mode === key ? 'bg-background shadow-sm' : 'text-muted-foreground')}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        {mode === 'rm' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">RM</span>}
                        <input
                            key={mode}
                            type="text"
                            inputMode="decimal"
                            pattern="[0-9]*[.,]?[0-9]*"
                            enterKeyHint="done"
                            autoComplete="off"
                            autoFocus
                            value={value}
                            onChange={(e) => setValue(clean(e.target.value, mode === 'kg' ? 3 : 2))}
                            placeholder={mode === 'kg' ? '0.000' : '0.00'}
                            className={cn(
                                'h-16 w-full rounded-md border bg-background text-right text-4xl font-semibold tabular-nums shadow-sm focus:border-ring focus:ring-1 focus:ring-ring',
                                mode === 'kg' ? 'pl-4 pr-16' : 'pl-16 pr-4',
                                tooMuch && 'border-destructive',
                            )}
                            aria-label={mode === 'kg' ? 'Weight in kg' : 'Amount in RM'}
                        />
                        {mode === 'kg' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">kg</span>}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {QUICK_KG.map((q) => (
                            <Button key={q} type="button" variant="outline" size="sm" onClick={() => { setMode('kg'); setValue(String(q)); }}>
                                {q < 1 ? `${q * 1000} g` : `${q} kg`}
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Weight</span>
                            <span className="tabular-nums">{formatKg(kg)} kg</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className="font-medium">Price</span>
                            <span className="text-2xl font-bold tabular-nums">RM {formatMoney(total)}</span>
                        </div>
                        {tooMuch && <p className="text-xs text-destructive">Only {formatKg(maxKg)} kg left in stock.</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={!ok}>{initialKg ? 'Update' : 'Add to cart'}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
