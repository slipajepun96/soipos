import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { today } from '@/lib/format';
import DatePicker from '@/Components/inventory/DatePicker';
import DocumentForm from '@/Components/inventory/DocumentForm';
import FormField from '@/Components/inventory/FormField';
import LineItemsEditor, { emptyLine, linesPayload } from '@/Components/inventory/LineItemsEditor';

export default function AddStockOut({ documentType, products = [], availableStock = {} }) {
    const isInvoice = documentType === 'Sales Invoice';
    const [lines, setLines] = useState([emptyLine()]);
    const form = useForm({
        document_type: documentType,
        document_date: today(),
        recipient_name: '',
        recipient_reference: '',
        remarks: '',
    });

    const overdrawn = lines.some((l) => l.product_id && Number(l.quantity || 0) > Number(availableStock[l.product_id] || 0));

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            items: linesPayload(lines, isInvoice ? ['quantity', 'sales_unit_price'] : ['quantity']),
        }));
        form.post(route('inventory.stockOut.save'), { preserveScroll: true });
    };

    return (
        <DocumentForm
            title={isInvoice ? 'New Sales Invoice' : 'New Stock Out Document'}
            description={isInvoice
                ? 'Sell stock to a customer. Stock is costed at its average cost.'
                : 'Issue stock for internal use, samples or transfers.'}
            backHref={route('inventory.stockOut.index')}
            onSubmit={submit}
            processing={form.processing}
            canSubmit={lines.some((l) => l.product_id) && !overdrawn}
            submitLabel={isInvoice ? 'Save invoice' : 'Save stock out'}
            details={(
                <>
                    <FormField label="Date" htmlFor="document_date" required error={form.errors.document_date}>
                        <DatePicker id="document_date" value={form.data.document_date} onChange={(v) => form.setData('document_date', v)} />
                    </FormField>
                    <FormField label={isInvoice ? 'Customer' : 'Recipient'} htmlFor="recipient_name" required={isInvoice}
                        error={form.errors.recipient_name} hint={isInvoice ? undefined : 'Leave blank for internal use'}>
                        <Input
                            id="recipient_name"
                            value={form.data.recipient_name}
                            onChange={(e) => form.setData('recipient_name', e.target.value)}
                            placeholder={isInvoice ? 'Customer name' : 'Department or person'}
                        />
                    </FormField>
                    <FormField label="Reference no." htmlFor="recipient_reference" error={form.errors.recipient_reference}>
                        <Input
                            id="recipient_reference"
                            value={form.data.recipient_reference}
                            onChange={(e) => form.setData('recipient_reference', e.target.value)}
                            placeholder={isInvoice ? 'PO / customer ref' : 'Optional'}
                        />
                    </FormField>
                    <FormField label="Remarks" htmlFor="remarks" error={form.errors.remarks}>
                        <Textarea id="remarks" rows={1} value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} />
                    </FormField>
                </>
            )}
            items={(
                <LineItemsEditor
                    mode="out"
                    products={products}
                    available={availableStock}
                    lines={lines}
                    onChange={setLines}
                    showSalesPrice={isInvoice}
                    errors={form.errors}
                />
            )}
        />
    );
}
