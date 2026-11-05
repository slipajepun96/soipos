import { Toaster as Sonner } from 'sonner';

/** shadcn Sonner toaster, black & white. */
const Toaster = (props) => (
    <Sonner
        theme="light"
        className="toaster group"
        position="top-center"
        closeButton
        toastOptions={{
            classNames: {
                toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                description: 'group-[.toast]:text-muted-foreground',
                actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                error: 'group-[.toaster]:border-destructive group-[.toaster]:text-destructive',
            },
        }}
        {...props}
    />
);

export { Toaster };
