import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import InventoryPage from '@/Components/inventory/InventoryPage';
import DocumentTable from '@/Components/inventory/DocumentTable';

export default function StockInIndex({ stock_docs = [] }) {
    return (
        <InventoryPage
            title="Stock In"
            description="Goods received from suppliers and opening balances."
            backHref={route('inventory.index')}
            actions={(
                <>
                    <Button variant="outline" asChild>
                        <Link href={route('inventory.stockIn.addOpeningStock')}>
                            <Plus />
                            Opening stock
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={route('inventory.stockIn.addGRN')}>
                            <Plus />
                            New GRN
                        </Link>
                    </Button>
                </>
            )}
        >
            <DocumentTable
                docs={stock_docs}
                types={['GRN', 'Opening Stock']}
                deleteRoute="inventory.stockIn.delete"
                partyLabel="Supplier"
            />
        </InventoryPage>
    );
}
