import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AddSupplier from './Partials/AddSupplier';
import EditSupplier from './Partials/EditSupplier';
import ViewSupplierDetail from './Partials/ViewSupplierDetail';
import DeleteSupplier from './Partials/DeleteSupplier';

export default function SupplierIndex({ suppliers }) {
    const { flash } = usePage().props;

        const columns = [
    // { Header: 'Nama', accessor: 'allottee_name' },
    // { Header: 'No. Fail / Geran', accessor: 'lot_file_num' },
        {
            Header: 'Supplier',
            accessor: ['supplier_name', 'supplier_rob_num'],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2 font-bold ">
                    {row.supplier_name}
                    <div className='text-sm'>{row.supplier_rob_num}</div>
                </div>
            ),
        },
        {
            Header: 'Contact Details',
            accessor: ['supplier_phone_num', 'supplier_email', 'supplier_address'],
            Cell: ({ row }) => (
                <div className="flex flex-col ">
                    <div className='text-sm'><b>Phone Number :</b> {row.supplier_phone_num}</div>
                    <div className='text-sm'><b>E-Mail :</b> {row.supplier_email}</div>
                    <div className='text-sm'><b>Address :</b> {row.supplier_address}</div>
                </div>
            ),
        },
        {
            Header: 'Status',
            accessor: [''],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2">
                    {row.is_active === 1 ? (
                        <div className='text-sm bg-green-500 px-1 py-0.5 rounded-full text-white text-center'>Active</div>
                    ) : (
                        <div className='text-sm bg-red-500 px-1 py-0.5 rounded-full text-white text-center'>Inactive</div>
                    )}
                </div>
            ),
        },
        // { Header: 'No. Telefon', accessor: 'allottee_phone_num' },
        {
            Header: '',
            accessor: 'actions',
            Cell: ({ row }) => (
                <div className="flex space-x-2 justify-end">
                    <ViewSupplierDetail supplier={ row }/>
                    <EditSupplier supplier={ row }/>
                    <DeleteSupplier supplier={ row }/>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Supplier Management
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

                    {/* <div className="overflow-hidden sm:rounded-lg m-2 p-2 border-b-2">
                        <div className='font-bold text-2xl mb-2'>Products</div>
                        <div className=' grid grid-cols-2 md:grid-cols-4 gap-2'>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    Product Categories
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    Products List & Registration
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white border-gray-700 rounded-lg shadow-md h-24'>
                                    Supplier Management
                                </div>
                            </Link>
                        </div>
                    </div> */}
                    <div className='px-4'>
                        <AddSupplier />
                    </div>
                    <DataTable columns={columns} data={suppliers} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
