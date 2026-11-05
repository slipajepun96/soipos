import StockInForm from '@/Components/inventory/StockInForm';

export default function AddOpeningStock({ products = [], suppliers = [] }) {
    return <StockInForm type="Opening Stock" products={products} suppliers={suppliers} />;
}
