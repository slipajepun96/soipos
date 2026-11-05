import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DocumentTable from '@/Components/inventory/DocumentTable';

export default function StockOutIndex({ stock_docs = [] }) {
    return (
        <InventoryPage
            title="Stock Out"
            description="Stock issued for internal use and sold to customers."
            backHref={route('inventory.index')}
            actions={(
                <>
                    <Button variant="outline" asChild>
                        <Link href={route('inventory.stockOut.create', { type: 'sod' })}>
                            <Plus />
                            Stock out (SOD)
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('sales.invoices.create')}>
                            <Plus />
                            Sales invoice
                        </Link>
                    </Button>
                </>
            )}
        >
            <DocumentTable
                docs={stock_docs}
                types={['SOD', 'Sales Invoice']}
                deleteRoute="inventory.stockOut.delete"
                partyLabel="Recipient / Customer"
                showSales
            />
        </InventoryPage>
    );
}
