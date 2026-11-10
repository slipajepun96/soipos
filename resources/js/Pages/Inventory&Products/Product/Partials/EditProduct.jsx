import { useEffect, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TrackStockField from '@/Components/inventory/TrackStockField';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/Components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useForm } from '@inertiajs/react';
import ProductImageInput from '@/Components/inventory/ProductImageInput';

const NO_CATEGORY = '__none';

const bundleItemsOf = (product) => (product.bundle_items ?? []).map((i) => ({ product_id: i.component_product_id, quantity: i.quantity }));

export default function EditProduct({ product, product_categories, products = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id: product.id || '',
        product_category_id: product.product_category_id || '',
        product_name: product.product_name || '',
        product_unit: product.product_unit || '',
        product_sku_code: product.product_sku_code || '',
        product_image: null,
        remove_image: false,
        product_code: product.product_code || '',
        product_description: product.product_description || '',
        product_price: product.product_price || '',
        product_num_of_measure: product.product_num_of_measure || '',
        product_supplier_id: product.product_supplier_id || '',
        product_low_stock_limit: product.product_low_stock_limit || '',
        track_stock: product.track_stock !== false && product.track_stock !== 0,
        is_bundle: !!product.is_bundle,
        bundle_items: bundleItemsOf(product),
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setData({
            id: product.id,
            product_category_id: product.product_category_id || '',
            product_name: product.product_name || '',
            product_unit: product.product_unit || '',
            product_sku_code: product.product_sku_code || '',
            product_image: null,
        remove_image: false,
            product_code: product.product_code || '',
            product_description: product.product_description || '',
            product_price: product.product_price || '',
            product_num_of_measure: product.product_num_of_measure || '',
            product_supplier_id: product.product_supplier_id || '',
            product_low_stock_limit: product.product_low_stock_limit || '',
            track_stock: product.track_stock !== false && product.track_stock !== 0,
            is_bundle: !!product.is_bundle,
            bundle_items: bundleItemsOf(product),
        });
    }, [product, setData]);

    const submit = (e) => {
        e.preventDefault();

        post(route('product.updateProduct'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
            },
        });
    };

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset();
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline">Edit</PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                        {Object.keys(errors).length > 0 && (
                            <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
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
                                    currentUrl={product.product_img_address}
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
                                    onChange={(e) => setData('product_name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.product_name} className="mt-2" />
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
                                    onChange={(e) => setData('product_num_of_measure', e.target.value)}
                                    required
                                />
                                <InputError message={errors.product_num_of_measure} className="mt-2" />
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
                                <Select value={data.product_unit} onValueChange={(value) => setData('product_unit', value)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select size unit" />
                                    </SelectTrigger>
                                    <SelectContent id="product_unit" name="product_unit">
                                        <SelectItem value="KG">KG</SelectItem>
                                        <SelectItem value="Gram">Gram</SelectItem>
                                        <SelectItem value="Liter">Liter</SelectItem>
                                        <SelectItem value="Milliliter">Milliliter</SelectItem>
                                        <SelectItem value="Meter">Meter</SelectItem>
                                        <SelectItem value="Unit">Unit</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_unit} className="mt-2" />
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
                                    onChange={(e) => setData('product_price', e.target.value)}
                                    required
                                />
                                <InputError message={errors.product_price} className="mt-2" />
                            </div>
                        </div>
                        <div className="grid flex-1 gap-2 md:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="product_sku_code" value={<>SKU Code</>} />
                                <TextInput
                                    id="product_sku_code"
                                    name="product_sku_code"
                                    value={data.product_sku_code}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('product_sku_code', e.target.value)}
                                />
                                <InputError message={errors.product_sku_code} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="product_code" value={<>Barcode</>} />
                                <TextInput
                                    id="product_code"
                                    name="product_code"
                                    value={data.product_code}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('product_code', e.target.value)}
                                />
                                <InputError message={errors.product_code} className="mt-2" />
                            </div>
                        </div>
                        <div className="grid flex-1 gap-2">
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
                                    onValueChange={(value) => setData('product_category_id', value === NO_CATEGORY ? '' : value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Product Category" />
                                    </SelectTrigger>
                                    <SelectContent id="product_category_id" name="product_category_id">
                                        <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                                        {product_categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.product_categories_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.product_category_id} className="mt-2" />
                            </div>
                            <TrackStockField data={data} setData={setData} errors={errors} products={products} selfId={product.id} />
                        </div>
                        <PrimaryButton disabled={processing}>Update</PrimaryButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
