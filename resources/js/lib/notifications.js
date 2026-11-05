import { router } from '@inertiajs/react';
import { toast } from 'sonner';

/**
 * One place that tells the user whether an action worked:
 * - flash message from the server  -> success / error toast
 * - validation errors              -> "Not saved" toast with the first problem
 * - server error / expired page    -> error toast
 * - no connection                  -> error toast
 */
let lastFlash = null;
let lastMethod = 'get';

export function showFlash(flash) {
    // Partial reloads keep the previous flash object; only show a new one.
    if (!flash || flash === lastFlash) return;
    lastFlash = flash;
    if (!flash.message) return;
    if (flash.type === 'error') toast.error(flash.message);
    else toast.success(flash.message);
}

export function errorMessage(error) {
    const bag = error?.response?.data?.errors;
    if (bag) return [...new Set(Object.values(bag).flat())].join(' ');
    return error?.response?.data?.message || 'Something went wrong. Please try again.';
}

export function registerNotifications(initialPage) {
    showFlash(initialPage?.props?.flash);

    router.on('success', (event) => showFlash(event.detail.page.props.flash));

    router.on('start', (event) => { lastMethod = event.detail.visit.method; });

    router.on('error', (event) => {
        const messages = Object.values(event.detail.errors || {}).flat().filter(Boolean);
        toast.error(lastMethod === 'get' ? 'Could not load' : 'Not saved', {
            description: messages.length
                ? messages.slice(0, 2).join(' ') + (messages.length > 2 ? ` (+${messages.length - 2} more)` : '')
                : 'Please check the form and try again.',
        });
    });

    router.on('invalid', (event) => {
        const status = event.detail.response?.status;
        const message = status === 419
            ? 'Your session expired. Refresh the page and try again.'
            : status === 403 ? 'You are not allowed to do that.'
            : status === 404 ? 'Not found. It may have been deleted.'
            : status === 429 ? 'Too many attempts. Please wait a minute and try again.'
            : `Something went wrong${status ? ` (error ${status})` : ''}. Nothing was saved.`;
        toast.error(message);
        // Keep Laravel's error page in development for debugging; just the toast in production.
        if (!import.meta.env.DEV) event.preventDefault();
    });

    router.on('exception', () => {
        toast.error('Could not reach the server. Check your connection and try again.');
    });
}
