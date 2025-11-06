import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import { useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import TextArea from '@/Components/TextArea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select"
import { useForm } from '@inertiajs/react';

export default function AgentRegister({ }) {
    const { flash } = usePage().props;

        const { data, setData, post, processing, errors, reset } = useForm({
            agent_name: '',
            agent_nric: '',
            agent_address: '',
            agent_phone_num: '',
            agent_email: '',
            agent_social_media: '',
            agent_social_media_link: '',
            agent_status: '',

        });

        const submit = (e) => {
            console.log('Submitting data:', data);
            e.preventDefault();
    
            post(route('agent.register.save'), {
                onSuccess: () => {
                    reset(
                        'agent_name',
                        'agent_nric',
                        'agent_address',
                        'agent_phone_num',
                        'agent_email',
                        'agent_social_media',
                        'agent_social_media_link',
                        'agent_status',
                    );
                    // Close the dialog
                    console.log('Product saved successfully');
                },
                onError: (errors) => {
                    console.log('Error saving product:', errors);
                }
            });
        };

    return (
        <AgentLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Agent
                </h2>
            }
        >
            <Head title="Inventory & Products" />

            <div className="py-2">
                <div className="mx-auto max-w-7xl sm:px-2 lg:px-2">
                    {flash?.message && flash.message.trim() !== '' && (
                        <Alert 
                            type={flash?.type || 'info'} 
                            message={flash.message}
                        />
                    )}

                    <div className="overflow-hidden sm:rounded-lg m-2 p-2 ">
                        <div className='font-bold text-2xl mb-2'>Pendaftaran Ejen Kambing Perap Dihati</div>
                        <div className='md:flex md:flex-row'>
                            <div className="rounded-2xl bg-white p-2 m-2 shadow-md text-gray-900 md:w-1/3">
                                <img src="/img/agent-register.jpeg" className="" alt="" />
                            </div>
                            <div className='bg-white p-4 m-2 rounded-2xl shadow-md md:w-2/3'>
                                <form onSubmit={submit}>
                                    <div className="items-center space-y-2">
                                        <div className="grid flex-1 gap-2">
                                            <div>
                                                <InputLabel
                                                    htmlFor="agent_name"
                                                    value={
                                                        <>
                                                            Nama<span className="text-red-500">*</span>
                                                        </>
                                                    }
                                                />
                                                <TextInput
                                                    id="agent_name"
                                                    name="agent_name"
                                                    value={data.agent_name}
                                                    className="mt-1 block w-full"
                                                    isFocused={true}
                                                    onChange={(e) =>
                                                        setData('agent_name', e.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.agent_name}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid flex-1 gap-2 md:grid-cols-3">
                                            <div>
                                                <InputLabel
                                                    htmlFor="agent_nric"
                                                    value={
                                                        <>
                                                            No. Kad Pengenalan<span className="text-red-500">*</span>
                                                        </>
                                                    }
                                                />
                                                <TextInput
                                                    id="agent_nric"
                                                    name="agent_nric"
                                                    value={data.agent_nric}
                                                    className="mt-1 block w-full"
                                                    isFocused={true}
                                                    onChange={(e) =>
                                                        setData('agent_nric', e.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.agent_nric}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="agent_phone_num"
                                                    value={
                                                        <>
                                                            No. Telefon<span className="text-red-500">*</span>
                                                        </>
                                                    }
                                                />
                                                <TextInput
                                                    id="agent_phone_num"
                                                    name="agent_phone_num"
                                                    value={data.product_num_of_measure}
                                                    className="mt-1 block w-full"
                                                    isFocused={true}
                                                    onChange={(e) =>
                                                        setData('agent_phone_num', e.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.agent_phone_num}
                                                    className="mt-2"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="agent_email"
                                                    value={
                                                        <>
                                                            Alamat E-Mel<span className="text-red-500">*</span>
                                                        </>
                                                    }
                                                />
                                                <TextInput
                                                    id="agent_email"
                                                    name="agent_email"
                                                    value={data.agent_email}
                                                    className="mt-1 block w-full"
                                                    isFocused={true}
                                                    onChange={(e) =>
                                                        setData('agent_email', e.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.agent_email}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>
                                            <div>
                                                <InputLabel
                                                    htmlFor="agent_address"
                                                    value={
                                                        <>
                                                            Alamat <span className="text-red-500">*</span>
                                                        </>
                                                    }
                                                />
                                                <TextArea
                                                    id="agent_address"
                                                    name="agent_address"
                                                    value={data.agent_address}
                                                    className="mt-1 block w-full"
                                                    isFocused={true}
                                                    onChange={(e) =>
                                                        setData('agent_address', e.target.value)
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.agent_address}
                                                    className="mt-2"
                                                />
                                            </div>
                                        <PrimaryButton disabled={processing}>
                                            Daftar
                                        </PrimaryButton>
                                    </div>
                                </form>                         
                            </div>
                        </div>


                    </div>
                    <div className='px-4'>
                    </div>
                    {/* <DataTable columns={columns} data={suppliers} /> */}
                </div>
            </div>
        </AgentLayout>
    );
}
