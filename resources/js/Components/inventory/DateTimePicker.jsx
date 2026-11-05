import { X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import DatePicker from '@/Components/inventory/DatePicker';
import TimePicker from '@/Components/inventory/TimePicker';
import { today } from '@/lib/format';

/**
 * Date + time picker working with 'yyyy-MM-ddTHH:mm' strings ('' = not set).
 * Picking a date with no time yet defaults to the end of that day.
 */
export default function DateTimePicker({ id, value, onChange, defaultTime = '23:59', clearable = true }) {
    const [date = '', time = ''] = value ? value.split('T') : [];

    const setDate = (d) => onChange(d ? `${d}T${time || defaultTime}` : '');
    const setTime = (t) => onChange(`${date || today()}T${t}`);

    return (
        <div className="flex gap-2">
            <DatePicker id={id} value={date} onChange={setDate} className="min-w-0 flex-1" />
            <TimePicker value={time.slice(0, 5)} onChange={setTime} className="w-36 shrink-0" />
            {clearable && value && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => onChange('')} aria-label="Clear">
                    <X />
                </Button>
            )}
        </div>
    );
}
