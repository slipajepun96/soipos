import { cn } from '@/lib/utils';

export default function InputLabel({ value, className = '', children, ...props }) {
    return (
        <label {...props} className={cn('block text-sm font-medium leading-none text-foreground', className)}>
            {value ? value : children}
        </label>
    );
}
