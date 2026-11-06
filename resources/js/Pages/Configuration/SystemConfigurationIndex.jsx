import { useForm } from '@inertiajs/react';
import { Building2, Mail, MapPin, Phone, QrCode, ReceiptText, Store } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import InventoryPage from '@/Components/inventory/InventoryPage';
import FormField from '@/Components/inventory/FormField';
import DuitNowQrUpload from '@/Components/settings/DuitNowQrUpload';

export default function SystemConfigurationIndex({ settings }) {
    const form = useForm({
        store_name: settings.store_name ?? '',
        company_name: settings.company_name ?? '',
        company_reg_no: settings.company_reg_no ?? '',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        receipt_footer: settings.receipt_footer ?? '',
    });
    const { data, setData, errors } = form;

    const submit = (e) => {
        e.preventDefault();
        form.put(route('settings.update'), { preserveScroll: true });
    };

    const field = (name) => ({
        id: name,
        value: data[name],
        onChange: (e) => setData(name, e.target.value),
    });

    return (
        <InventoryPage title="Settings" description="Store and company details shown on receipts.">
            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4" />Store</CardTitle>
                            <CardDescription>The name customers see at the top of the receipt.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField label="Store name" htmlFor="store_name" required error={errors.store_name}>
                                <Input {...field('store_name')} placeholder="e.g. Kedai Soi" />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Company</CardTitle>
                            <CardDescription>The registered business behind the store.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <FormField label="Company name" htmlFor="company_name" required error={errors.company_name}>
                                <Input {...field('company_name')} placeholder="e.g. Soi Trading Sdn. Bhd." />
                            </FormField>
                            <FormField label="Registration no." htmlFor="company_reg_no" error={errors.company_reg_no} hint="Optional">
                                <Input {...field('company_reg_no')} placeholder="e.g. 202301234567 (1234567-A)" />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" />Contact</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <FormField label="Address" htmlFor="address" error={errors.address} className="md:col-span-2">
                                <Textarea {...field('address')} rows={3} placeholder="Street, postcode, city, state" />
                            </FormField>
                            <FormField label="Phone number" htmlFor="phone" error={errors.phone}>
                                <Input {...field('phone')} type="tel" placeholder="e.g. 011-2345 6789" />
                            </FormField>
                            <FormField label="Email" htmlFor="email" error={errors.email}>
                                <Input {...field('email')} type="email" placeholder="e.g. hello@store.com" />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ReceiptText className="h-4 w-4" />Receipt</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField label="Footer message" htmlFor="receipt_footer" error={errors.receipt_footer}>
                                <Input {...field('receipt_footer')} placeholder="e.g. Thank you. Please come again." />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><QrCode className="h-4 w-4" />DuitNow QR</CardTitle>
                            <CardDescription>Shown to customers at the POS for e-wallet payments.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DuitNowQrUpload current={settings.duitnow_qr} />
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        {form.recentlySuccessful && <span className="text-sm text-muted-foreground">Saved.</span>}
                        <Button type="button" variant="outline" disabled={!form.isDirty || form.processing} onClick={() => form.reset()}>
                            Reset
                        </Button>
                        <Button type="submit" disabled={!form.isDirty || form.processing}>
                            {form.processing ? 'Saving…' : 'Save settings'}
                        </Button>
                    </div>
                </div>

                <div className="lg:sticky lg:top-20 lg:self-start">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Receipt preview</p>
                    <div className="rounded-lg border bg-background p-5 font-mono text-xs shadow-sm">
                        <div className="space-y-0.5 text-center">
                            <p className="text-sm font-bold">{data.store_name || 'Store name'}</p>
                            {data.company_name && (
                                <p>
                                    {data.company_name}
                                    {data.company_reg_no && <span className="text-muted-foreground"> ({data.company_reg_no})</span>}
                                </p>
                            )}
                            {data.address && <p className="whitespace-pre-line text-muted-foreground">{data.address}</p>}
                            {data.phone && (
                                <p className="flex items-center justify-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{data.phone}</p>
                            )}
                            {data.email && (
                                <p className="flex items-center justify-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{data.email}</p>
                            )}
                        </div>
                        <div className="my-3 border-t border-dashed" />
                        <div className="flex justify-between"><span>Item × 1</span><span>10.00</span></div>
                        <div className="my-3 border-t border-dashed" />
                        <div className="flex justify-between font-bold"><span>TOTAL (RM)</span><span>10.00</span></div>
                        <div className="my-3 border-t border-dashed" />
                        <p className="text-center">{data.receipt_footer}</p>
                    </div>
                </div>
            </form>
        </InventoryPage>
    );
}
