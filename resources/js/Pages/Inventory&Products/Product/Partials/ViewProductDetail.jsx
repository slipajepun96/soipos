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
import { useForm } from '@inertiajs/react';


export default function ViewProductDetail({ product, suppliers, product_categories }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        id: product.id,
        product_name: product.product_name || '',
        product_description: product.product_description || '',
        product_price: product.product_price || '',
        product_num_of_measure: product.product_num_of_measure || '',
        product_unit: product.product_unit || '',
        product_sku_code: product.product_sku_code || '',
        product_code: product.product_code || '',
        product_supplier_id: product.product_supplier_id || '',
        product_category_id: product.product_category_id || '',
        product_low_stock_limit: product.product_low_stock_limit || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setData({
        id: product.id,
        product_name: product.product_name,
        product_description: product.product_description,
        product_price: product.product_price,
        product_num_of_measure: product.product_num_of_measure,
        product_unit: product.product_unit,
        product_sku_code: product.product_sku_code,
        product_code: product.product_code,
        product_supplier_id: product.product_supplier_id,
        product_category_id: product.product_category_id,
        product_low_stock_limit: product.product_low_stock_limit,
        });
    }, [product, setData]);

    // Helper function to get supplier name by ID
    const getSupplierName = (product_supplier_id) => {
        console.log('Suppliers List:', suppliers);
        const supplier = suppliers?.find(s => s.id === product_supplier_id);
        return supplier ? supplier.supplier_name : 'Unknown Supplier';
    };

    // Helper function to get product category name by ID
    const getProductCategoryName = (product_category_id) => {
        const product_category = product_categories?.find(c => c.id === product_category_id);
        return product_category ? product_category.product_categories_name : 'Unknown Product Category';
    };

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset(
                'id',
                'product_name',
                'product_description',
                'product_price',
                'product_num_of_measure',
                'product_unit',
                'product_sku_code',
                'product_code',
                'product_supplier_id',
                'product_category_id',
                'product_low_stock_limit',
            );
        }
    };
    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline" className=''>
                    View
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                {/* <DialogHeader> */}
                    {/* <DialogTitle>View Product Detail</DialogTitle> */}
                    {/* <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription> */}
                {/* </DialogHeader> */}
                <div className="items-center space-y-2">
                    <div className="grid flex-1 gap-2">
                        <div className='mt-3'>
                            <span className="font-bold text-2xl">{data.product_name}</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <InputLabel
                                    htmlFor="id"
                                    value={
                                        <>
                                            UUID
                                        </>
                                    }
                                />
                                <span className="font-bold">{data.id}</span>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_price"
                                    value="Recommended Retail Price"
                                />
                                <span className="font-bold">RM {data.product_price || "-"}</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <InputLabel
                                    htmlFor="measurement"
                                    value={
                                    <>
                                        Measurement
                                    </>
                                }
                                />
                                <span className="font-bold">{data.product_num_of_measure || "-"} {data.product_unit || "-"}</span>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_sku_code"
                                    value={
                                    <>
                                        Low Stock Limit
                                    </>
                                }
                                />
                                <span className="font-bold">{data.product_low_stock_limit || "-"} Unit</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <InputLabel
                                    htmlFor="product_code"
                                    value={
                                    <>
                                        Barcode
                                    </>
                                }
                                />
                                <span className="font-bold">{data.product_code || "-"}</span>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="product_sku_code"
                                    value={
                                    <>
                                        SKU Code
                                    </>
                                }
                                />
                                <span className="font-bold">{data.product_sku_code || "-"}</span>
                            </div>
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="supplier_name"
                                value="Supplier Name"
                            />
                            <span className="font-bold">{getSupplierName(data.product_supplier_id) || "-"}</span>
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="category_name"
                                value="Category Name"
                            />
                            <span className="font-bold">{getProductCategoryName(data.product_category_id) || "-"}</span>
                        </div>
                    </div>

                    {/* <hr /> */}
                    {/* <PrimaryButton disabled={processing}>
                        Print Detail
                    </PrimaryButton> */}
                </div>
            </DialogContent>
        </Dialog>
    );
}
