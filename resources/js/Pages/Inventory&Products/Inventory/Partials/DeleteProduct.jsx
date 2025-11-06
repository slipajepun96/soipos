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


export default function DeleteProduct({ product }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        id: product.id,
        product_name: product.product_name || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = (e) => {
        e.preventDefault();

        post(route('product.deleteProduct', { id: product.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.error('Delete failed:', errors);
            },
        });
    };

    const handleDeactivate = (e) => {
        e.preventDefault();
        // console.log('Deactivating supplier with ID:', supplier.id);

        post(route('product.deactivateProduct', { id: product.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.error('Deactivate failed:', errors);
            },
        });
    };

    useEffect(() => {
        setData({
            id: product.id ,
            product_name: product.product_name ,
        });
    }, [product, setData]);

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset(
                'id',
                'product_name',
            );
        }
    };
    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline" className=''>
                    Delete
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Delete Product ?</DialogTitle>
                </DialogHeader>
                <div className="items-center space-y-2">
                    <div className="grid flex-1 gap-2">
                        <div>
                            {/* <InputLabel
                                htmlFor="supplier_name"
                                value={
                                    <>
                                        Supplier Name
                                    </>
                                }
                            /> */}
                            {data.product_name} -  {product.product_num_of_measure} {product.product_unit}
                        </div>
                        <div className='text-base p-3 bg-amber-300 text-black rounded-sm'>Delete the product only if there is no other data associated with it. Otherwise, select Deactivate.</div>
                    </div>
                    <div className='flex gap-2'>
                        <form onSubmit={handleDeactivate} className='flex gap-2'>
                            <PrimaryButton disabled={processing} className=''>
                                Deactivate
                            </PrimaryButton>
                        </form>
                        <form onSubmit={handleDelete} className='flex gap-2'>
                            <PrimaryButton disabled={processing} className='bg-red-500'>
                                Delete
                            </PrimaryButton>
                        </form>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
