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

/** Stock is counted in whole units: "1 unit", "12 units". */
export function formatUnits(value) {
    const n = Number(value || 0);
    return `${formatQty(n)} ${n === 1 ? 'unit' : 'units'}`;
}

/** A product's size is only a description of one unit, e.g. "500 Milliliter". */
export function productSize(product) {
    return [product?.product_num_of_measure, product?.product_unit].filter(Boolean).join(' ');
}

/** Whole-unit quantity from an input value (never negative). */
export function wholeUnits(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}

/** Product name followed by its size and unit, e.g. "Spritzer Mineral Water 500 Milliliter". */
export function productLabel(product) {
    return [product?.product_name, productSize(product)].filter(Boolean).join(' ');
}
