import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Calendar } from '@/Components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/Components/ui/popover';
import { cn } from '@/lib/utils';

/** Date picker that works with 'yyyy-MM-dd' strings. */
export default function DatePicker({ id, value, onChange, placeholder = 'Pick a date', className }) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(`${value}T00:00:00`) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start font-normal', !value && 'text-muted-foreground', className)}
                >
                    <CalendarIcon />
                    {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    defaultMonth={selected}
                    onSelect={(date) => {
                        onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        setOpen(false);
                    }}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}
