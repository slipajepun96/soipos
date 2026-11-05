import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { today } from '@/lib/format';
import DatePicker from './DatePicker';
import DocumentForm from './DocumentForm';
import FormField from './FormField';
import LineItemsEditor, { emptyLine, linesPayload } from './LineItemsEditor';

const NO_SUPPLIER = '__none__';

/** Shared form for GRN and Opening Stock. */
export default function StockInForm({ type, products, suppliers }) {
    const isGrn = type === 'GRN';
    const [lines, setLines] = useState([emptyLine()]);
    const form = useForm({
        supplier_id: '',
        document_date: today(),
        transportation_mode: '',
        remarks: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            supplier_id: data.supplier_id || null,
            items: linesPayload(lines, ['quantity', 'unit_cost', 'expiry_date']),
        }));
        form.post(route(isGrn ? 'inventory.stockIn.saveGRN' : 'inventory.stockIn.saveOpeningStock'), {
            preserveScroll: true,
        });
    };

    return (
        <DocumentForm
            title={isGrn ? 'New Goods Received Note' : 'New Opening Stock'}
            description={isGrn
                ? 'Record stock received from a supplier.'
                : 'Record the stock you already hold when you start using the system.'}
            backHref={route('inventory.stockIn.index')}
            onSubmit={submit}
            processing={form.processing}
            canSubmit={lines.some((l) => l.product_id)}
            submitLabel={isGrn ? 'Save GRN' : 'Save opening stock'}
            itemsDescription="Unit cost is used to value stock and to cost later stock-outs."
            details={(
                <>
                    <FormField label="Supplier" htmlFor="supplier_id" required={isGrn} error={form.errors.supplier_id}
                        hint={isGrn ? undefined : 'Optional'}>
                        <Select
                            value={form.data.supplier_id || (isGrn ? undefined : NO_SUPPLIER)}
                            onValueChange={(v) => form.setData('supplier_id', v === NO_SUPPLIER ? '' : v)}
                        >
                            <SelectTrigger id="supplier_id">
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {!isGrn && <SelectItem value={NO_SUPPLIER}>No supplier</SelectItem>}
                                {suppliers.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.supplier_name}{s.supplier_rob_num ? ` (${s.supplier_rob_num})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField label={isGrn ? 'Received date' : 'Opening stock date'} htmlFor="document_date" required error={form.errors.document_date}>
                        <DatePicker id="document_date" value={form.data.document_date} onChange={(v) => form.setData('document_date', v)} />
                    </FormField>

                    {isGrn && (
                        <FormField label="Transportation mode" htmlFor="transportation_mode" error={form.errors.transportation_mode}>
                            <Input
                                id="transportation_mode"
                                value={form.data.transportation_mode}
                                onChange={(e) => form.setData('transportation_mode', e.target.value)}
                                placeholder="e.g. Lorry, courier, self pick-up"
                            />
                        </FormField>
                    )}

                    <FormField label="Remarks" htmlFor="remarks" error={form.errors.remarks} className={isGrn ? '' : 'md:col-span-2'}>
                        <Textarea
                            id="remarks"
                            rows={1}
                            value={form.data.remarks}
                            onChange={(e) => form.setData('remarks', e.target.value)}
                        />
                    </FormField>
                </>
            )}
            items={(
                <LineItemsEditor
                    mode="in"
                    products={products}
                    lines={lines}
                    onChange={setLines}
                    showExpiry
                    errors={form.errors}
                />
            )}
        />
    );
}
