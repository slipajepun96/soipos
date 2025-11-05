import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AddProduct from './Partials/AddProduct';
import DeleteProduct from './Partials/DeleteProduct';
import ViewProductDetail from './Partials/ViewProductDetail';

export default function ProductIndex({ products , product_categories , suppliers}) {
    const { flash } = usePage().props;

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId) => {
        const supplier = suppliers?.find(s => s.id === supplierId);
        return supplier ? supplier.supplier_name : 'Unknown Supplier';
    };

    const columns = [
    // { Header: 'Nama', accessor: 'allottee_name' },
    // { Header: 'No. Fail / Geran', accessor: 'lot_file_num' },
        {
            Header: 'Product Name',
            accessor: ['product_name'],
            Cell: ({ row }) => (
                <div className="flex flex-col ">
                    <div className='font-bold'>{row.product_name}</div>
                    <div>{row.product_num_of_measure} {row.product_unit}</div>
                </div>
            ),
        },
        {
            Header: 'Product Details',
            accessor: ['product_name'],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2">
                    <div className='font-bold'>
                        {getSupplierName(row.product_supplier_id)}
                    </div>
                    <div>{row.product_sku_code}</div>
                </div>
            ),
        },  
        {
            Header: 'Status',
            accessor: [''],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2">
                    {row.is_active === 1 ? (
                        <div className='text-sm bg-green-300 px-1 py-0.5 rounded-full font-bold text-green-700 text-center'>Active</div>
                    ) : (
                        <div className='text-sm bg-red-300 px-1 py-0.5 rounded-full text-red-700 font-bold text-center'>Inactive</div>
                    )}
                </div>
            ),
        },
        {
            Header: '',
            accessor: 'actions',
            Cell: ({ row }) => (
                <div className="flex space-x-2 justify-end">
                    {/* <PrimaryButton>Edit</PrimaryButton> */}
                    <ViewProductDetail product={ row } suppliers={ suppliers } product_categories={ product_categories }/>
                    <DeleteProduct product={row} />
                </div>
                
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Product
                </h2>
            }
        >
            <Head title="Product" />

            <div className="py-2">
                <div className="mx-auto max-w-7xl sm:px-2 lg:px-2">
                    {flash?.message && flash.message.trim() !== '' && (
                        <Alert 
                            type={flash?.type || 'info'} 
                            message={flash.message}
                        />
                    )}
                    <div className='px-4'>
                         <AddProduct product_categories={product_categories} suppliers={suppliers} />                   
                    </div>

                    <div className="overflow-hidden sm:rounded-lg m-2 p-2">
                        {/* <div className='font-bold text-2xl mb-2'>Products</div> */}
                        <DataTable columns={columns} data={products} />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
