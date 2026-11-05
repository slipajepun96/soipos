import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Textarea } from '@/Components/ui/textarea';
import { today } from '@/lib/format';
import DatePicker from '@/Components/inventory/DatePicker';
import DocumentForm from '@/Components/inventory/DocumentForm';
import FormField from '@/Components/inventory/FormField';
import LineItemsEditor, { emptyLine, linesPayload } from '@/Components/inventory/LineItemsEditor';

export default function AddAdjustment({ products = [], availableStock = {} }) {
    const [lines, setLines] = useState([emptyLine()]);
    const form = useForm({ document_date: today(), remarks: '' });

    const hasChange = lines.some((l) =>
        l.product_id && l.counted_quantity !== '' &&
        Number(l.counted_quantity) !== Number(availableStock[l.product_id] || 0));

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({ ...data, items: linesPayload(lines, ['counted_quantity']) }));
        form.post(route('inventory.adjustment.save'), { preserveScroll: true });
    };

    return (
        <DocumentForm
            title="Stock Count Adjustment"
            description="Enter what you physically counted. The difference from the system balance is posted as an increase or decrease at average cost."
            backHref={route('inventory.adjustment.index')}
            onSubmit={submit}
            processing={form.processing}
            canSubmit={hasChange}
            submitLabel="Post adjustment"
            itemsDescription="Products whose count matches the system are skipped."
            details={(
                <>
                    <FormField label="Count date" htmlFor="document_date" required error={form.errors.document_date}>
                        <DatePicker id="document_date" value={form.data.document_date} onChange={(v) => form.setData('document_date', v)} />
                    </FormField>
                    <FormField label="Reason" htmlFor="remarks" required error={form.errors.remarks}>
                        <Textarea
                            id="remarks"
                            rows={1}
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                            placeholder="e.g. Month-end stock take"
                        />
                    </FormField>
                </>
            )}
            items={(
                <LineItemsEditor
                    mode="count"
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
