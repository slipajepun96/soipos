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


export default function DeleteSupplier({ supplier }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        id: supplier.id,
        supplier_name: supplier.supplier_name || '',
        supplier_address: supplier.supplier_address || '',
        supplier_rob_num: supplier.supplier_rob_num || '',
        supplier_contact_person: supplier.supplier_contact_person || '',
        supplier_phone_num: supplier.supplier_phone_num || '',
        supplier_email: supplier.supplier_email || '',
        supplier_tax_identification_num: supplier.supplier_tax_identification_num || '',
        supplier_remark: supplier.supplier_remark || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = (e) => {
        e.preventDefault();

        post(route('supplier.deleteSupplier', { id: supplier.id }), {
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

        post(route('supplier.deactivateSupplier', { id: supplier.id }), {
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
            id: supplier.id ,
            supplier_name: supplier.supplier_name ,
            supplier_address: supplier.supplier_address ,
            supplier_rob_num: supplier.supplier_rob_num ,
            supplier_contact_person: supplier.supplier_contact_person ,
            supplier_phone_num: supplier.supplier_phone_num ,
            supplier_email: supplier.supplier_email ,
            supplier_tax_identification_num: supplier.supplier_tax_identification_num ,
            supplier_remark: supplier.supplier_remark ,
        });
    }, [supplier, setData]);

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset(
                'supplier_name',
                'supplier_address',
                'supplier_rob_num',
                'supplier_contact_person',
                'supplier_phone_num',
                'supplier_email',
                'supplier_tax_identification_num',
                'supplier_remark',
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
                    <DialogTitle>Delete Supplier ?</DialogTitle>
                </DialogHeader>
                <div className="items-center space-y-2">
                    <div className="grid flex-1 gap-2">
                        <div>
                            <InputLabel
                                htmlFor="supplier_name"
                                value={
                                    <>
                                        Supplier Name
                                    </>
                                }
                            />
                            {data.supplier_name}
                        </div>
                        <div className='text-base p-3 border-2 border-red-500 text-red-500 rounded-xl'>Delete the supplier only if there is no other data associated with it. Otherwise, select Deactivate.</div>
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
