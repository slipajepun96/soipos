import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import DataTable from '@/Components/DataTable';
import { Plus, FileText, Trash2 } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AddProduct from '../Partials/AddProduct';
import DeleteProduct from '../Partials/DeleteProduct';
import ViewProductDetail from '../Partials/ViewProductDetail';
import { useForm } from '@inertiajs/react';

export default function AddGRN({ products , product_categories , suppliers}) {
    const { flash } = usePage().props;

    // GRN Header form
    const { data, setData, post, processing, errors, reset } = useForm({
        supplier_id: '',
        received_date: '',
        transportation_mode: '',
        remarks: '',
    });

    // Add Product Dialog form
    const { data: productData, setData: setProductData, reset: resetProduct } = useForm({
        product_id: '',
        quantity: '',
        unit_cost: '',
        total_cost: '',
        expiry_date: '',
        batch_number: '',
    });

    // State for GRN items
    const [grnItems, setGrnItems] = useState([]);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    
    // Helper functions
    const getProductName = (productId) => {
        const product = products?.find(p => p.id === productId);
        return product ? product.product_name : 'Unknown Product';
    };

    const getProductDetails = (productId) => {
        const product = products?.find(p => p.id === productId);
        return product;
    };

    // Add product to GRN
    const handleAddProduct = (e) => {
        e.preventDefault();
        
        const product = getProductDetails(productData.product_id);
        if (!product) return;

        const newItem = {
            id: Date.now(), // Temporary ID for frontend
            product_id: productData.product_id,
            product_name: product.product_name,
            product_sku: product.product_sku_code,
            quantity: productData.quantity,
            unit_cost: productData.unit_cost,
            total_cost: (parseFloat(productData.quantity) * parseFloat(productData.unit_cost)).toFixed(2),
            expiry_date: productData.expiry_date,
            batch_number: productData.batch_number,
        };

        setGrnItems([...grnItems, newItem]);
        resetProduct();
        setIsAddProductDialogOpen(false);
    };

    // Remove product from GRN
    const removeProduct = (id) => {
        setGrnItems(grnItems.filter(item => item.id !== id));
    };

    // Submit GRN
    const submitGRN = (e) => {
        e.preventDefault();
        
        const grnData = {
            ...data,
            items: grnItems
        };

        console.log('Submitting GRN:', grnData);
        
        // You would typically post to a GRN route
        // post(route('grn.store'), grnData, {
        //     onSuccess: () => {
        //         reset();
        //         setGrnItems([]);
        //         console.log('GRN saved successfully');
        //     },
        //     onError: (errors) => {
        //         console.log('Error saving GRN:', errors);
        //     }
        // });
    };

    // Calculate total for productData when quantity or unit_cost changes
    useEffect(() => {
        const quantity = parseFloat(productData.quantity) || 0;
        const unitCost = parseFloat(productData.unit_cost) || 0;
        const total = (quantity * unitCost).toFixed(2);
        setProductData('total_cost', total);
    }, [productData.quantity, productData.unit_cost]);

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId) => {
        const supplier = suppliers?.find(s => s.id === supplierId);
        return supplier ? supplier.supplier_name : 'Unknown Supplier';
    };


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Stock In / Add GRN
                </h2>
            }
        >
            <Head title="Stock In" />

            <div className="py-2">
                <div className="mx-auto max-w-7xl sm:px-2 lg:px-2">
                    {flash?.message && flash.message.trim() !== '' && (
                        <Alert 
                            type={flash?.type || 'info'} 
                            message={flash.message}
                        />
                    )}
                    <div className='px-4 gap-1 flex'>
                        {/* <PrimaryButton>Add GRN</PrimaryButton> */}
                         {/* <AddProduct product_categories={product_categories} suppliers={suppliers} />                  */}
                    </div>

                    <div className='m-4'>
                        <form onSubmit={submitGRN}>
                            {/* GRN Header Form */}
                            <div className="items-center space-y-2 bg-white p-4 rounded-xl shadow-md">
                                <div className="grid flex-1 gap-2 ">
                                    <div>
                                        <InputLabel
                                            htmlFor="supplier_id"
                                            value={
                                                <>
                                                    Supplier<span className="text-red-500">*</span>
                                                </>
                                            }
                                        />
                                        <Select
                                            onValueChange={(value) =>
                                                setData('supplier_id', value)
                                        }
                                        >
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select Supplier" />
                                            </SelectTrigger>
                                            <SelectContent 
                                                id="supplier_id"
                                                name="supplier_id"
                                            >
                                                {suppliers.map((supplier) => (
                                                    <SelectItem 
                                                        key={supplier.id}
                                                        value={supplier.id.toString()}
                                                    >
                                                        {supplier.supplier_name} ({supplier.supplier_rob_num})
                                                    </SelectItem>
                                                ))}

                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.supplier_id}
                                            className="mt-2"
                                        />
                                    </div>

                                        
                                </div>
                                <div className="grid flex-1 gap-2 md:grid-cols-3">
                                    <div>
                                        <InputLabel
                                            htmlFor="received_date"
                                            value={
                                                <>
                                                    Date of Received<span className="text-red-500">*</span>
                                                </>
                                            }
                                        />
                                        <TextInput
                                            id="received_date"
                                            name="received_date"
                                            type="date"
                                            value={data.received_date}
                                            className="mt-1 block w-full"
                                            onChange={(e) =>
                                                setData('received_date', e.target.value)
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.received_date}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="transportation_mode"
                                            value={
                                                <>
                                                    Mode of Transportation<span className="text-red-500">*</span>
                                                </>
                                            }
                                        />
                                        <Select
                                            onValueChange={(value) =>
                                                setData('transportation_mode', value)
                                        }>
                                            <SelectTrigger className="w-full bg-white">
                                                <SelectValue placeholder="Select Mode of Transportation" />
                                            </SelectTrigger>
                                            <SelectContent 
                                                id="transportation_mode"
                                                name="transportation_mode"
                                            >
                                                <SelectItem value="courier">Courier</SelectItem>
                                                <SelectItem value="delivery">Delivery</SelectItem>
                                                <SelectItem value="pickup">Pick Up</SelectItem>
                                                <SelectItem value="digital">Digital</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errors.transportation_mode}
                                            className="mt-2"
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="remarks"
                                            value="Remarks"
                                        />
                                        <TextInput
                                            id="remarks"
                                            name="remarks"
                                            value={data.remarks}
                                            className="mt-1 block w-full"
                                            onChange={(e) =>
                                                setData('remarks', e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.remarks}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Add Product Button */}
                            <div className='mt-4 flex justify-between items-center'>
                                <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                                    <DialogTrigger asChild>
                                        <PrimaryButton type="button" className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add Product
                                        </PrimaryButton>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Add Product to GRN</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddProduct}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="product_id" value="Product *" />
                                                        <Select
                                                            onValueChange={(value) => setProductData('product_id', value)}
                                                            required
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select Product" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {products.map((product) => (
                                                                    <SelectItem key={product.id} value={product.id.toString()}>
                                                                        {product.product_name} ({product.product_sku_code})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="quantity" value="Quantity *" />
                                                        <TextInput
                                                            id="quantity"
                                                            type="number"
                                                            step="0.01"
                                                            value={productData.quantity}
                                                            onChange={(e) => setProductData('quantity', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="unit_cost" value="Unit Cost *" />
                                                        <TextInput
                                                            id="unit_cost"
                                                            type="number"
                                                            step="0.01"
                                                            value={productData.unit_cost}
                                                            onChange={(e) => setProductData('unit_cost', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="total_cost" value="Total Cost" />
                                                        <TextInput
                                                            id="total_cost"
                                                            type="number"
                                                            step="0.01"
                                                            value={productData.total_cost}
                                                            readOnly
                                                            className="bg-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="batch_number" value="Batch Number" />
                                                        <TextInput
                                                            id="batch_number"
                                                            value={productData.batch_number}
                                                            onChange={(e) => setProductData('batch_number', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="expiry_date" value="Expiry Date" />
                                                        <TextInput
                                                            id="expiry_date"
                                                            type="date"
                                                            value={productData.expiry_date}
                                                            onChange={(e) => setProductData('expiry_date', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <PrimaryButton 
                                                    type="button" 
                                                    variant="outline"
                                                    onClick={() => setIsAddProductDialogOpen(false)}
                                                >
                                                    Cancel
                                                </PrimaryButton>
                                                <PrimaryButton type="submit">
                                                    Add to GRN
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* GRN Items Table */}
                            {grnItems.length > 0 && (
                                <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
                                    <h3 className="text-lg font-semibold mb-4">GRN Items</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">SKU</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Cost</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Batch</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Expiry</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grnItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="border border-gray-300 px-4 py-2">{item.product_name}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{item.product_sku}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-right">RM {parseFloat(item.unit_cost).toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-right">RM {item.total_cost}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{item.batch_number || '-'}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{item.expiry_date || '-'}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeProduct(item.id)}
                                                                className="text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50 font-semibold">
                                                    <td colSpan="4" className="border border-gray-300 px-4 py-2 text-right">Total:</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                                        RM {grnItems.reduce((total, item) => total + parseFloat(item.total_cost), 0).toFixed(2)}
                                                    </td>
                                                    <td colSpan="3" className="border border-gray-300"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className='mt-4 w-full flex justify-end'>
                                <PrimaryButton 
                                    type="submit" 
                                    disabled={processing || grnItems.length === 0}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Save GRN
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>


                </div>
            </div>
        </AuthenticatedLayout>
    );
}
