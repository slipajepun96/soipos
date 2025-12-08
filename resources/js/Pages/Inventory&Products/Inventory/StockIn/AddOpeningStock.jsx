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
import { Calendar } from "@/Components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/Components/ui/popover";
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AddProduct from '../Partials/AddProduct';
import DeleteProduct from '../Partials/DeleteProduct';
import ViewProductDetail from '../Partials/ViewProductDetail';
import { useForm } from '@inertiajs/react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AddOpeningStock({ products , product_categories , suppliers}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        supplier_id: '',
        opening_stock_date: '',
    });

    const [date, setDate] = useState();
    const [open, setOpen] = useState(false);
    
    const [expiryDate, setExpiryDate] = useState();
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [shouldSubmit, setShouldSubmit] = useState(false);

    const { data: productData, setData: setProductData, reset: resetProduct } = useForm({
        product_id: '',
        quantity: '',
        unit_cost: '',
        total_cost: '',
        expiry_date: '',
    });

    // State for OS items
    const [OSItems, setOSItems] = useState([]);
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

    const getSupplierName = (supplierId) => {
        const supplier = suppliers?.find(s => s.id === supplierId);
        return supplier ? supplier.supplier_name : 'Unknown Supplier';
    };

    const handleAddProduct = () => {
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
        };

        setOSItems([...OSItems, newItem]);
        resetProduct();
        setExpiryDate(null); // Reset expiry date state
        setIsAddProductDialogOpen(false);
        console.log('Added Product:', newItem);
    };

    // remove product from OS
    const removeProduct = (id) => {
        setOSItems(OSItems.filter(item => item.id !== id));
    };

    //-----------------------------------------------------------------------
        // Add useEffect to handle the actual submission
    useEffect(() => {
        if (shouldSubmit) {
            // Reset the flag first
            setShouldSubmit(false);
            
            // Now post the data
            post(route('inventory.stockIn.saveOpeningStock'), {
                supplier_id: data.supplier_id,
                opening_stock_date: data.opening_stock_date,
                items: data.items,
            }, {
                preserveScroll: true,
                onError: errors => {
                    console.group('Submission Errors');
                    console.error('Errors:', errors);
                    console.groupEnd();
                },
                onSuccess: () => {
                    reset();
                    // setRowAmounts({});
                    // setDate(undefined);
                },
            });
        }
    }, [data, shouldSubmit]); // Watch for changes in data and shouldSubmit

    const submit = (e) => {
        e.preventDefault();

        const items = OSItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            expiry_date: item.expiry_date || "",
        }));

        setData(prev => ({
            ...prev,
            items: items
        }));

        // Set flag to trigger submission
        setShouldSubmit(true);
    };

    // Calculate total for productData when quantity or unit_cost changes
    useEffect(() => {
        const quantity = parseFloat(productData.quantity) || 0;
        const unitCost = parseFloat(productData.unit_cost) || 0;
        const total = (quantity * unitCost).toFixed(2);
        setProductData('total_cost', total);
    }, [productData.quantity, productData.unit_cost]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Stock In / Add Opening Stock
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
                        <form onSubmit={submit}>
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
                                            htmlFor="opening_stock_date"
                                            value={
                                                <>
                                                    Date of Opening Stock<span className="text-red-500">*</span>
                                                </>
                                            }
                                        />
                                        <Popover open={open} onOpenChange={setOpen} modal={false}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        "w-full text-left font-normal bg-white border rounded-md px-3 py-2",
                                                        !date && "text-muted-foreground"
                                                    )}
                                                >
                                                    {date ? format(date, "dd/MM/yyyy") : "Select date"}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" trapFocus={false}>
                                                <Calendar
                                                    mode="single"
                                                    selected={date}
                                                    onSelect={selectedDate => {
                                                        setDate(selectedDate);
                                                        setData('opening_stock_date', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
                                                        setOpen(false);
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError
                                            message={errors.opening_stock_date}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </div>

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
                                            <DialogTitle>Add Product to Opening Stock</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleAddProduct();
                                        }}>
                                            <div className="grid gap-4 py-4">
                                                <div className="">
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
                                                                        {product.product_name} - {product.product_num_of_measure} {product.product_unit} (SKU : {product.product_sku_code})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <InputLabel htmlFor="quantity" value="Quantity *" />
                                                        <TextInput
                                                            id="quantity"
                                                            type="number"
                                                            className="bg-white w-full"
                                                            step="0.01"
                                                            value={productData.quantity}
                                                            onChange={(e) => setProductData('quantity', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="unit_cost" value="Unit Cost (RM)" />
                                                        <TextInput
                                                            id="unit_cost"
                                                            type="number"
                                                            step="0.01"
                                                            className="bg-white w-full"
                                                            value={productData.unit_cost}
                                                            onChange={(e) => setProductData('unit_cost', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel htmlFor="total_cost" value="Total Cost (RM)" />
                                                        <TextInput
                                                            id="total_cost"
                                                            type="number"
                                                            step="0.01"
                                                            className="bg-white w-full"
                                                            value={productData.total_cost}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <InputLabel htmlFor="expiry_date" value="Expiry Date" />
                                                        <Popover open={expiryOpen} onOpenChange={setExpiryOpen} modal={false}>
                                                            <PopoverTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className={cn(
                                                                        "w-full text-left font-normal bg-white border rounded-md px-3 py-2",
                                                                        !expiryDate && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "Select expiry date"}
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" trapFocus={false}>
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={expiryDate}
                                                                    onSelect={selectedDate => {
                                                                        setExpiryDate(selectedDate);
                                                                        setProductData('expiry_date', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
                                                                        setExpiryOpen(false);
                                                                    }}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
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
                                                    Add
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* GRN Items Table */}
                            {OSItems.length > 0 && (
                                <div className="mt-4 bg-white p-4 rounded-xl shadow-md">
                                    <h3 className="text-lg font-semibold mb-4">Opening Stock Items</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                                                    {/* <th className="border border-gray-300 px-4 py-2 text-left">SKU</th> */}
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Unit Cost</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-left">Expiry Date</th>
                                                    <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {OSItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="border border-gray-300 px-4 py-2 font-bold">{item.product_name}</td>
                                                        {/* <td className="border border-gray-300 px-4 py-2">{item.product_sku}</td> */}
                                                        <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-right">RM {parseFloat(item.unit_cost).toFixed(2)}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-right">RM {item.total_cost}</td>
                                                        <td className="border border-gray-300 px-4 py-2">{item.expiry_date || '-'}</td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            <PrimaryButton
                                                                type="button"
                                                                onClick={() => removeProduct(item.id)}
                                                                className="bg-red-500 hover:bg-red-700 focus:bg-red-400 text-red-600 hover:text-red-800"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </PrimaryButton>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="bg-gray-50 font-semibold">
                                                    <td colSpan="4" className="border border-gray-300 px-4 py-2 text-right">Total:</td>
                                                    <td className="border border-gray-300 px-4 py-2 text-right">
                                                        RM {OSItems.reduce((total, item) => total + parseFloat(item.total_cost), 0).toFixed(2)}
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
                                    disabled={processing || OSItems.length === 0}
                                    className="flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Save Opening Stock
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>


                </div>
            </div>
        </AuthenticatedLayout>
    );
}
