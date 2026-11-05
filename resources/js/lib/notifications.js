import { router } from '@inertiajs/react';
import { toast } from 'sonner';

/**
 * One place that tells the user whether an action worked:
 * - flash message from the server  -> success / error toast
 * - validation errors              -> "Not saved" toast with the first problem
 * - server error / expired page    -> error toast with the server's specific reason
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

/** The specific reason a request failed (validation, server message, status or network). */
export function errorMessage(error) {
    const response = error?.response;
    const bag = response?.data?.errors;
    if (bag) return [...new Set(Object.values(bag).flat())].join(' ');
    if (typeof response?.data?.message === 'string' && response.data.message) return response.data.message;
    if (response) return statusMessage(response.status);
    if (error?.request) return 'Could not reach the server. Check your internet connection and try again.';
    return error?.message || 'Unknown error.';
}

function statusMessage(status) {
    return {
        401: 'You are signed out. Sign in again and retry.',
        403: 'You are not allowed to do that.',
        404: 'Not found. It may have been deleted or the link is wrong.',
        413: 'The upload is too large. Use a smaller file.',
        419: 'Your session expired. Refresh the page and try again.',
        429: 'Too many attempts. Please wait a minute and try again.',
        500: 'Server error (500). Nothing was saved. Check storage/logs/laravel.log for the cause.',
        502: 'The server is not responding (502). Try again shortly.',
        503: 'The system is under maintenance (503). Try again in a few minutes.',
        504: 'The server took too long to respond (504). Try again.',
    }[status] || `Request failed (error ${status}).`;
}

export function registerNotifications(initialPage) {
    showFlash(initialPage?.props?.flash);

    router.on('success', (event) => showFlash(event.detail.page.props.flash));

    router.on('start', (event) => { lastMethod = event.detail.visit.method; });

    router.on('error', (event) => {
        const messages = [...new Set(Object.values(event.detail.errors || {}).flat().filter(Boolean))];
        toast.error(lastMethod === 'get' ? 'Could not load' : 'Not saved', {
            description: messages.length
                ? messages.slice(0, 4).join(' ') + (messages.length > 4 ? ` (+${messages.length - 4} more, see the form)` : '')
                : 'Please check the form and try again.',
        });
    });

    router.on('invalid', (event) => {
        const response = event.detail.response;
        const data = response?.data;
        const specific = typeof data === 'object' && typeof data?.message === 'string' && data.message;
        toast.error(lastMethod === 'get' ? 'Could not load' : 'Not saved', {
            description: specific || statusMessage(response?.status),
        });
        // Our server sends a JSON reason; anything else (e.g. Laravel's debug page) is kept in development.
        if (specific || !import.meta.env.DEV) event.preventDefault();
    });

    router.on('exception', (event) => {
        toast.error(lastMethod === 'get' ? 'Could not load' : 'Not saved', {
            description: errorMessage(event.detail.exception),
        });
    });
}
