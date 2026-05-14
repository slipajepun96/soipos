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


export default function ViewSupplierDetail({ supplier }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        id: supplier.id,
        supplier_name: supplier.supplier_name || '',
        supplier_address: supplier.supplier_address || '',
        supplier_rob_num: supplier.supplier_rob_num || '',
        supplier_contact_person: supplier.supplier_contact_person || '',
        supplier_phone_num: supplier.supplier_phone_num || '',
        supplier_email: supplier.supplier_email || '',
        supplier_rob_num: supplier.supplier_rob_num || '',
        supplier_tax_identification_num: supplier.supplier_tax_identification_num || '',
        supplier_remark: supplier.supplier_remark || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        setData({
            id: supplier.id ,
            supplier_name: supplier.supplier_name ,
            supplier_address: supplier.supplier_address ,
            supplier_rob_num: supplier.supplier_rob_num ,
            supplier_contact_person: supplier.supplier_contact_person ,
            supplier_phone_num: supplier.supplier_phone_num ,
            supplier_email: supplier.supplier_email ,
            supplier_rob_num: supplier.supplier_rob_num ,
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
                    View
                </PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>View Supplier Detail</DialogTitle>
                    {/* <DialogDescription>
                        Anyone who has this link will be able to view this.
                    </DialogDescription> */}
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
                            <span className="font-bold">{data.supplier_name}</span>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <InputLabel
                                    htmlFor="supplier_rob_num"
                                    value={
                                        <>
                                            ROB / ROC Number
                                        </>
                                    }
                                />
                                <span className="font-bold">{data.supplier_rob_num}</span>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="supplier_tax_identification_num"
                                    value="LHDN Tax Identification Number (TIN)"
                                />
                                <span className="font-bold">{data.supplier_tax_identification_num || "-"}</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <InputLabel
                                    htmlFor="supplier_phone_num"
                                    value={
                                    <>
                                        Phone Number
                                    </>
                                }
                                />
                                <span className="font-bold">{data.supplier_phone_num || "-"}</span>
                            </div>
                            <div>
                                <InputLabel
                                    htmlFor="supplier_email"
                                    value={
                                    <>
                                        Email Address
                                    </>
                                }
                                />
                                <span className="font-bold">{data.supplier_email || "-"}</span>
                            </div>
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="supplier_address"
                                value={
                                    <>
                                        Address
                                    </>
                                }
                            />
                            <span className="font-bold">{data.supplier_address || "-"}</span>
                        </div>
                        
                            <div>
                                <InputLabel
                                    htmlFor="supplier_contact_person"
                                    value="Supplier Contact Person"
                                />
                            <span className="font-bold">{data.supplier_contact_person || "-"}</span>
                            </div>
                            
                        <div>
                            <InputLabel
                                htmlFor="supplier_remark"
                                value="Remarks (if any)"
                            />
                        <span className="font-bold">{data.supplier_remark || "-"}</span>
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
