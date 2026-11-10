// import { Inertia } from '@inertiajs/inertia'; 
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TrackStockField from '@/Components/inventory/TrackStockField';
import TextArea from '@/Components/TextArea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"
import { useForm } from '@inertiajs/react';
import ProductImageInput from '@/Components/inventory/ProductImageInput';
// import { Input } from '@/Components/ui/input';
// import { Label } from '@/Components/ui/label';


const NO_CATEGORY = '__none';

export default function AddProduct({ product_categories, suppliers, products = [] }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        product_category_id: '',
        product_name: '',
        product_unit: '',
        product_sku_code: '',
        product_image: null,
        remove_image: false,
        product_code: '',
        product_description: '',
        product_price: '',
        product_num_of_measure: '',
        product_supplier_id: '',
        product_low_stock_limit: '',
        track_stock: true,
        is_bundle: false,
        bundle_items: [],
    });

    // console.log(product_categories);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const submit = (e) => {
        // console.log('Submitting data:', data);
        e.preventDefault();

        post(route('product.saveProduct'), {
            onSuccess: () => {
                reset(
                    'product_category_id',
                    'product_name',
                    'product_unit',
                    'product_sku_code',
                    'product_image',
                    'remove_image',
                    'product_code',
                    'product_description',
                    'product_price',
                    'product_num_of_measure',
                    'product_low_stock_limit',
                    'track_stock',
                    'is_bundle',
                    'bundle_items',
                );
                // Close the dialog
                console.log('Product saved successfully');
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Error saving product:', errors);
                console.log('Current form data:', data);
            }
        });
    };
    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset(
                'product_category_id',
                'product_name',
                'product_unit',
                'product_sku_code',
                'product_image',
                    'remove_image',
                'product_code',
                'product_description',
                'product_price',
                'product_num_of_measure',
                'product_low_stock_limit',
            );
        }
    };
    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline" className=''>
                    Add New Product
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>
                        {Object.keys(errors).length > 0 && (
                            <div className='bg-destructive/10 p-2 rounded rounded-lg text-destructive'>
                                {Object.values(errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="items-center space-y-2">
                        <div>
                            <InputLabel htmlFor="product_image" value="Photo" />
                            <div className="mt-1">
                                <ProductImageInput
                                    currentUrl={null}
                                    error={errors.product_image}
                                    onChange={({ file, remove }) => setData((d) => ({ ...d, product_image: file, remove_image: remove }))}
                                />
                            </div>
                        </div>
                        <div className="grid flex-1 gap-2">
                            <div>
                                <InputLabel
                                    htmlFor="product_name"
                                    value={
                                        <>
                                            Name of Product<span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_name"
                                    name="product_name"
                                    value={data.product_name}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('product_name', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.product_name}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Size only describes one unit (e.g. 500 Milliliter bottle). Stock, sales and orders are always counted in units.</p>
                        <div className="grid flex-1 gap-2 md:grid-cols-3">
                            <div>
                                <InputLabel
                                    htmlFor="product_num_of_measure"
                                    value={
                                        <>
                                            Size<span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_num_of_measure"
                                    name="product_num_of_measure"
                                    value={data.product_num_of_measure}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('product_num_of_measure', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.product_num_of_measure}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_unit"
                                    value={
                                        <>
                                            Size Unit<span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_unit', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select size unit" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        id="product_unit"
                                        name="product_unit"
                                    >
                                        <SelectItem value="KG">KG</SelectItem>
                                        <SelectItem value="Gram">Gram</SelectItem>
                                        <SelectItem value="Liter">Liter</SelectItem>
                                        <SelectItem value="Milliliter">Milliliter</SelectItem>
                                        <SelectItem value="Meter">Meter</SelectItem>
                                        <SelectItem value="Unit">Unit</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.product_unit}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_price"
                                    value={
                                        <>
                                            Sales Price (RM)<span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_price"
                                    name="product_price"
                                    value={data.product_price}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('product_price', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.product_price}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div className="grid flex-1 gap-2 md:grid-cols-2">
                            <div>
                                <InputLabel
                                    htmlFor="product_sku_code"
                                    value={
                                        <>
                                            SKU Code
                                            {/* <span className="text-destructive">*</span> */}
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_sku_code"
                                    name="product_sku_code"
                                    value={data.product_sku_code}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('product_sku_code', e.target.value)
                                    }
                                    // required
                                />
                                <InputError
                                    message={errors.product_sku_code}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_code"
                                    value={
                                        <>
                                            Barcode
                                            {/* <span className="text-destructive">*</span> */}
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_code"
                                    name="product_code"
                                    value={data.product_code}
                                    className="mt-1 block w-full"
                                    onChange={(e) =>
                                        setData('product_code', e.target.value)
                                    }
                                    // required
                                />
                                <InputError
                                    message={errors.product_code}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div className="grid flex-1 gap-2 ">
                            <div>
                                <InputLabel
                                    htmlFor="product_category_id"
                                    value={
                                        <>
                                            Product Category <span className="text-muted-foreground">(optional)</span>
                                        </>
                                    }
                                />
                                <Select
                                    value={data.product_category_id || NO_CATEGORY}
                                    onValueChange={(value) =>
                                        setData('product_category_id', value === NO_CATEGORY ? '' : value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Product Category" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        id="product_category_id"
                                        name="product_category_id"
                                    >
                                        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                                        {product_categories.map((category) => (
                                            <SelectItem 
                                                key={category.id}
                                                value={category.id}
                                            >
                                                {category.product_categories_name}
                                            </SelectItem>
                                        ))}

                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.product_category_id}
                                    className="mt-2"
                                />
                            </div>
                            {/* disable supplier sebab supplier tak perlu */}
                            {/* <div>
                                <InputLabel
                                    htmlFor="product_supplier_id"
                                    value={
                                        <>
                                            Supplier<span className="text-destructive">*</span>
                                        </>
                                    }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_supplier_id', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Supplier" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        id="product_supplier_id"
                                        name="product_supplier_id"
                                    >
                                        {suppliers.map((supplier) => (
                                            <SelectItem 
                                                key={supplier.id}
                                                value={supplier.id}
                                            >
                                                {supplier.supplier_name} ({supplier.supplier_rob_num})
                                            </SelectItem>
                                        ))}

                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.product_supplier_id}
                                    className="mt-2"
                                />
                            </div> */}
                            <TrackStockField data={data} setData={setData} errors={errors} products={products} />
                        </div>
                        <PrimaryButton disabled={processing}>
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
