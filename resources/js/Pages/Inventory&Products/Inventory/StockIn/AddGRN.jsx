import StockInForm from '@/Components/inventory/StockInForm';

export default function AddGRN({ products = [], suppliers = [] }) {
    return <StockInForm type="GRN" products={products} suppliers={suppliers} />;
}
