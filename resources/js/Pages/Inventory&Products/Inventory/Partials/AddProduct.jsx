// import { Inertia } from '@inertiajs/inertia'; 
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"
import { useForm } from '@inertiajs/react';
// import { Input } from '@/Components/ui/input';
// import { Label } from '@/Components/ui/label';


export default function AddProduct({ product_categories, suppliers }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        product_category_id: '',
        product_name: '',
        product_unit: '',
        product_sku_code: '',
        product_img_address: '',
        product_code: '',
        product_description: '',
        product_price: '',
        product_num_of_measure: '',
        product_supplier_id: '',
        product_low_stock_limit: '',
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
                    'product_img_address',
                    'product_code',
                    'product_description',
                    'product_price',
                    'product_num_of_measure',
                    'product_supplier_id',
                    'product_low_stock_limit',
                );
                // Close the dialog
                console.log('Product saved successfully');
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Error saving product:', errors);
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
                'product_img_address',
                'product_code',
                'product_description',
                'product_price',
                'product_num_of_measure',
                'product_supplier_id',
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
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    {/* <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription> */}
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="items-center space-y-2">
                        <div className="grid flex-1 gap-2">
                            <div>
                                <InputLabel
                                    htmlFor="product_name"
                                    value={
                                        <>
                                            Name of Product<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_name"
                                    name="product_name"
                                    value={data.product_name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
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
                        <div className="grid flex-1 gap-2 md:grid-cols-3">
                            <div>
                                <InputLabel
                                    htmlFor="product_num_of_measure"
                                    value={
                                        <>
                                            Number of Measure<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_num_of_measure"
                                    name="product_num_of_measure"
                                    value={data.product_num_of_measure}
                                    className="mt-1 block w-full"
                                    isFocused={true}
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
                                            Unit Of Measure<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_unit', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select UOM" />
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
                                    message={errors.product_name}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_price"
                                    value={
                                        <>
                                            Sales Price (RM)<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_price"
                                    name="product_price"
                                    value={data.product_price}
                                    className="mt-1 block w-full"
                                    isFocused={true}
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
                                            {/* <span className="text-red-500">*</span> */}
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_sku_code"
                                    name="product_sku_code"
                                    value={data.product_sku_code}
                                    className="mt-1 block w-full"
                                    isFocused={true}
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
                                            {/* <span className="text-red-500">*</span> */}
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_code"
                                    name="product_code"
                                    value={data.product_code}
                                    className="mt-1 block w-full"
                                    isFocused={true}
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
                                            Product Category<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <Select
                                    onValueChange={(value) =>
                                        setData('product_category_id', value)
                                }>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Product Category" />
                                    </SelectTrigger>
                                    <SelectContent 
                                        id="product_category_id"
                                        name="product_category_id"
                                    >
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
                            <div>
                                <InputLabel
                                    htmlFor="product_supplier_id"
                                    value={
                                        <>
                                            Supplier<span className="text-red-500">*</span>
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
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_low_stock_limit"
                                    value={
                                        <>
                                            Low Stock Limit<span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="product_low_stock_limit"
                                    name="product_low_stock_limit"
                                    value={data.product_low_stock_limit}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData('product_low_stock_limit', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.product_low_stock_limit}
                                    className="mt-2"
                                />
                            </div>
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
