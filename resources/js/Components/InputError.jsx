import { cn } from '@/lib/utils';

export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p {...props} className={cn('text-sm text-destructive', className)}>
            {message}
        </p>
    ) : null;
}
