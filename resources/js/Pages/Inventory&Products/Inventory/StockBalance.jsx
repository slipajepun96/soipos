import InventoryPage from '@/Components/inventory/InventoryPage';
import BalanceTable from '@/Components/inventory/BalanceTable';

export default function StockBalance({ balance = [] }) {
    return (
        <InventoryPage
            title="Stock Balance"
            description="Quantity on hand and value for every active product."
            backHref={route('inventory.index')}
        >
            <BalanceTable balance={balance} />
        </InventoryPage>
    );
}
