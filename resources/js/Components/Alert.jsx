import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Alert as UiAlert, AlertDescription } from '@/Components/ui/alert';

export default function Alert({ type, message }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => setIsVisible(true), [message]);

    if (!message || !isVisible) return null;

    const isError = type === 'error';
    const Icon = isError ? AlertCircle : type === 'success' ? CheckCircle2 : Info;

    return (
        <UiAlert variant={isError ? 'destructive' : 'default'} className="my-2 pr-10">
            <Icon className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
            <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="absolute right-3 top-3 rounded-sm opacity-60 hover:opacity-100"
                aria-label="Close alert"
            >
                <X className="h-4 w-4" />
            </button>
        </UiAlert>
    );
}
