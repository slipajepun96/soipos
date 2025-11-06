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

export default function AgentRegistrationSuccess({ }) {
    const { flash } = usePage().props;


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
                        <div className='md:flex md:flex-row justify-center'>
                            <div className='bg-white p-4 m-2 rounded-2xl shadow-md md:w-2/3 justify-center items-center text-center'>
                                <img src="http://www.pkppagro.com.my/img/logo dihati.webp" alt="Success" className='mx-auto w-48' />
                                <div className='text-lg font-semibold mb-2'>Terima Kasih!</div>
                                <div className='text-md font-base mb-2'>Pendaftaran anda telah berjaya. Pegawai dari Unit Pemasaran PKPP Agro Sdn. Bhd. akan menghubungi anda dalam masa terdekat untuk penerangan dan informasi selanjutnya.</div>
                                <div className='text-md font-base mb-2'>Kenali PKPP Agro Sdn. Bhd. dengan lebih lanjut di <Link href="https://www.pkppagro.com.my" className="text-blue-500 hover:underline">sini</Link></div>
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
