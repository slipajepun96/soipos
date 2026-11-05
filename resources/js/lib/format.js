import { format } from 'date-fns';

export const today = () => format(new Date(), 'yyyy-MM-dd');

export function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
}

export function formatMoney(value) {
    return Number(value || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatQty(value) {
    return Number(value || 0).toLocaleString('en-MY', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

/** Document type metadata shared across inventory pages. */
export const DOC_TYPES = {
    GRN: { label: 'Goods Received Note', short: 'GRN', party: 'Supplier' },
    'Opening Stock': { label: 'Opening Stock', short: 'Opening', party: 'Supplier' },
    SOD: { label: 'Stock Out Document', short: 'SOD', party: 'Recipient' },
    'Sales Invoice': { label: 'Sales Invoice', short: 'Invoice', party: 'Customer' },
    'Stock Adjustment': { label: 'Stock Adjustment', short: 'Adjustment', party: 'Source' },
    'Item Disposal Note': { label: 'Item Disposal Note', short: 'Disposal', party: 'Source' },
};
