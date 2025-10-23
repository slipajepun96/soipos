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
// import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import 'leaflet-defaulticon-compatibility';
// import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { useForm } from '@inertiajs/react';
// import { Input } from '@/Components/ui/input';
// import { Label } from '@/Components/ui/label';


export default function AddSupplier({ }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        supplier_name: '',
        supplier_address: '',
        supplier_rob_num: '',
        supplier_contact_person: '',
        supplier_phone_num: '',
        supplier_email: '',
        supplier_rob_num: '',
        supplier_tax_identification_num: '',
        supplier_remark: '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        console.log('Submitting data:', data);

        post(route('supplier.saveSupplier'), {
            onSuccess: () => {
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
                // Close the dialog
                console.log('Supplier saved successfully');
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.log('Error saving supplier:', errors);
            }
        });
    };
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
                    Add New Supplier
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    {/* <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription> */}
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="items-center space-y-2">
                        <div className="grid flex-1 gap-2">
                            <div>
                                <InputLabel
                                    htmlFor="supplier_name"
                                    value={
                                        <>
                                            Supplier Name <span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextInput
                                    id="supplier_name"
                                    name="supplier_name"
                                    value={data.supplier_name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData('supplier_name', e.target.value)
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.supplier_name}
                                    className="mt-2"
                                />
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_rob_num"
                                        value={
                                            <>
                                                ROB / ROC Number <span className="text-red-500">*</span>
                                            </>
                                        }
                                    />
                                    <TextInput
                                        id="supplier_rob_num"
                                        name="supplier_rob_num"
                                        value={data.supplier_rob_num}
                                        className="mt-1 block w-full"
                                        isFocused={true}
                                        onChange={(e) =>
                                            setData('supplier_rob_num', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.supplier_rob_num}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_tax_identification_num"
                                        value="LHDN Tax Identification Number (TIN)"
                                    />
                                    <TextInput
                                        id="supplier_tax_identification_num"
                                        name="supplier_tax_identification_num"
                                        value={data.supplier_tax_identification_num}
                                        className="mt-1 block w-full"
                                        isFocused={false}
                                        onChange={(e) =>
                                            setData(
                                                'supplier_tax_identification_num',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.supplier_tax_identification_num}
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-2'>
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_phone_num"
                                        value={
                                        <>
                                            Phone Number <span className="text-red-500">*</span>
                                        </>
                                    }
                                    />
                                    <TextInput
                                        id="supplier_phone_num"
                                        name="supplier_phone_num"
                                        value={data.supplier_phone_num}
                                        className="mt-1 block w-full"
                                        isFocused={true}
                                        onChange={(e) =>
                                            setData('supplier_phone_num', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.supplier_phone_num}
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_email"
                                        value={
                                        <>
                                            Email Address <span className="text-red-500">*</span>
                                        </>
                                    }
                                    />
                                    <TextInput
                                        id="supplier_email"
                                        name="supplier_email"
                                        value={data.supplier_email}
                                        className="mt-1 block w-full"
                                        isFocused={false}
                                        onChange={(e) =>
                                            setData(
                                                'supplier_email',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.supplier_email}
                                        className="mt-2"
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="supplier_address"
                                    value={
                                        <>
                                            Address <span className="text-red-500">*</span>
                                        </>
                                    }
                                />
                                <TextArea
                                    id="supplier_address"
                                    name="supplier_address"
                                    value={data.supplier_address}
                                    className="mt-1 block w-full"
                                    isFocused={false}
                                    onChange={(e) =>
                                        setData(
                                            'supplier_address',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                                <InputError
                                    message={errors.supplier_address}
                                    className="mt-2"
                                />
                            </div>
                            
                                <div>
                                    <InputLabel
                                        htmlFor="supplier_contact_person"
                                        value="Supplier Contact Person"
                                    />
                                    <TextInput
                                        id="supplier_contact_person"
                                        name="supplier_contact_person"
                                        value={data.supplier_contact_person}
                                        className="mt-1 block w-full"
                                        isFocused={false}
                                        onChange={(e) =>
                                            setData(
                                                'supplier_contact_person',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.supplier_contact_person}
                                        className="mt-2"
                                    />
                                </div>
                                
                            <div>
                                <InputLabel
                                    htmlFor="supplier_remark"
                                    value="Remarks (if any)"
                                />
                                <TextInput
                                    id="supplier_remark"
                                    name="supplier_remark"
                                    value={data.supplier_remark}
                                    className="mt-1 block w-full"
                                    autoComplete="supplier_remark"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData(
                                            'supplier_remark',
                                            e.target.value
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.supplier_remark}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <PrimaryButton disabled={processing}>
                            Save Supplier
                        </PrimaryButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
