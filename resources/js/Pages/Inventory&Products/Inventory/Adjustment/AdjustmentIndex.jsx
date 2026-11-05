import { Link } from '@inertiajs/react';
import { ClipboardCheck, Trash } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DocumentTable from '@/Components/inventory/DocumentTable';

export default function AdjustmentIndex({ stock_docs = [] }) {
    return (
        <InventoryPage
            title="Adjustment & Dispose"
            description="Correct stock after a physical count, or write off damaged and expired items."
            backHref={route('inventory.index')}
            actions={(
                <>
                    <Button variant="outline" asChild>
                        <Link href={route('inventory.adjustment.dispose')}>
                            <Trash />
                            Dispose items
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('inventory.adjustment.create')}>
                            <ClipboardCheck />
                            Stock count
                        </Link>
                    </Button>
                </>
            )}
        >
            <DocumentTable
                docs={stock_docs}
                types={['Stock Adjustment', 'Item Disposal Note']}
                deleteRoute="inventory.adjustment.delete"
                partyLabel="Reason"
            />
        </InventoryPage>
    );
}
