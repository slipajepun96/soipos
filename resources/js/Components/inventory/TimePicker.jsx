import { Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { cn } from '@/lib/utils';

/** 'HH:mm' -> '4:30 PM' */
export function formatTime(value) {
    if (!value) return '';
    const [h, m] = value.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** '4:30 PM' -> '16:30' (null if it does not look like a time) */
export function parseTime(text) {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(text || '').trim());
    if (!match) return null;
    const h = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    return `${String(h).padStart(2, '0')}:${match[2]}`;
}

// Every 30 minutes, plus 11:59 PM for "end of day".
const TIMES = [
    ...Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`),
    '23:59',
];

/** Time select working with 'HH:mm' strings. */
export default function TimePicker({ id, value, onChange, placeholder = 'Time', className }) {
    const options = value && !TIMES.includes(value) ? [...TIMES, value].sort() : TIMES;

    return (
        <Select value={value || undefined} onValueChange={onChange}>
            <SelectTrigger
                id={id}
                className={cn(
                    'mt-0 w-full gap-2 border-input bg-background focus:border-input focus:ring-ring',
                    !value && 'text-muted-foreground',
                    className,
                )}
            >
                <Clock className="h-4 w-4 shrink-0 opacity-60" />
                <SelectValue placeholder={placeholder} className="flex-1 text-left" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
                {options.map((t) => <SelectItem key={t} value={t}>{formatTime(t)}</SelectItem>)}
            </SelectContent>
        </Select>
    );
}
