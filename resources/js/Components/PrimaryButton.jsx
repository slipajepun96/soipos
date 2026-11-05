import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const PrimaryButton = forwardRef(({ className = '', disabled, children, ...props }, ref) => {
    return (
        <button
            {...props}
            ref={ref}
            className={cn(
                'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
                className,
            )}
            disabled={disabled}
        >
            {children}
        </button>
    );
});

PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;
