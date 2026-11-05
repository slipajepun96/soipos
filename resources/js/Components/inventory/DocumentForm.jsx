import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import InventoryPage from './InventoryPage';

/**
 * Layout for every "create document" page: details card, items card and a
 * footer with cancel / save.
 */
export default function DocumentForm({
    title,
    description,
    backHref,
    onSubmit,
    processing,
    canSubmit = true,
    submitLabel = 'Save',
    details,
    itemsDescription,
    items,
    extra,
}) {
    return (
        <InventoryPage title={title} description={description} backHref={backHref}>
            <form onSubmit={onSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">{details}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                        {itemsDescription && <CardDescription>{itemsDescription}</CardDescription>}
                    </CardHeader>
                    <CardContent>{items}</CardContent>
                </Card>

                {extra}

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" asChild>
                        <Link href={backHref}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing || !canSubmit}>
                        {processing ? 'Saving…' : submitLabel}
                    </Button>
                </div>
            </form>
        </InventoryPage>
    );
}
