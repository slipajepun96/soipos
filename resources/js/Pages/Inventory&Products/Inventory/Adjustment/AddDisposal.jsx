import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Textarea } from '@/Components/ui/textarea';
import { today } from '@/lib/format';
import DatePicker from '@/Components/inventory/DatePicker';
import DocumentForm from '@/Components/inventory/DocumentForm';
import FormField from '@/Components/inventory/FormField';
import LineItemsEditor, { emptyLine, linesPayload } from '@/Components/inventory/LineItemsEditor';

export default function AddDisposal({ products = [], availableStock = {} }) {
    const [lines, setLines] = useState([emptyLine()]);
    const form = useForm({ document_date: today(), remarks: '' });

    const overdrawn = lines.some((l) => l.product_id && Number(l.quantity || 0) > Number(availableStock[l.product_id] || 0));

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({ ...data, items: linesPayload(lines, ['quantity']) }));
        form.post(route('inventory.adjustment.saveDisposal'), { preserveScroll: true });
    };

    return (
        <DocumentForm
            title="Item Disposal Note"
            description="Write off damaged, expired or lost stock."
            backHref={route('inventory.adjustment.index')}
            onSubmit={submit}
            processing={form.processing}
            canSubmit={lines.some((l) => l.product_id) && !overdrawn}
            submitLabel="Save disposal"
            details={(
                <>
                    <FormField label="Disposal date" htmlFor="document_date" required error={form.errors.document_date}>
                        <DatePicker id="document_date" value={form.data.document_date} onChange={(v) => form.setData('document_date', v)} />
                    </FormField>
                    <FormField label="Reason" htmlFor="remarks" required error={form.errors.remarks}>
                        <Textarea
                            id="remarks"
                            rows={1}
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            placeholder="e.g. Expired, damaged in transit"
                        />
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
                    errors={form.errors}
                />
            )}
        />
    );
}
