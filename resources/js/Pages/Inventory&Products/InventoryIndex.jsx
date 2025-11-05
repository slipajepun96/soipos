import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';

export default function InventoryIndex() {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Inventory & Products
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

                    <div className="overflow-hidden sm:rounded-lg m-2 p-2 border-b-2">
                        <div className='font-bold text-2xl mb-2'>Products</div>
                        <div className=' grid grid-cols-2 md:grid-cols-4 gap-2'>
                            <Link href={route('productCategories.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    {/* <ClockPlus /> */}
                                    Product Categories
                                </div>
                            </Link>
                            <Link href={route('product.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    {/* <ClockPlus /> */}
                                    Products
                                </div>
                            </Link>
                        </div>
                    </div>
                    <div className="overflow-hidden sm:rounded-lg m-2 p-2 border-b-2">
                        <div className='font-bold text-2xl mb-2'>Inventory</div>
                        <div className=' grid grid-cols-2 md:grid-cols-4 gap-2'>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    {/* <ClockPlus /> */}
                                    Stock In
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    {/* <ClockPlus /> */}
                                    Stock Card
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    {/* <ClockPlus /> */}
                                    Inventory Adjustment & Dispose
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
