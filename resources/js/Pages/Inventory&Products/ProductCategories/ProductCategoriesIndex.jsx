import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import AddProductCategories from './Partials/AddProductCategories';

export default function ProductCategoriesIndex({ product_categories }) {
    const { flash } = usePage().props;

        // Function to sort categories hierarchically
    const getSortedCategories = () => {
        if (!product_categories || product_categories.length === 0) {
            return [];
        }

        // Filter only level 1 and 2 categories
        const validCategories = product_categories.filter((category) =>
            category.product_categories_sub_level == 1 || 
            category.product_categories_sub_level == 2
        );

        // Separate parents (level 1) and children (level 2)
        const parents = validCategories.filter(cat => cat.product_categories_sub_level == 1);
        const children = validCategories.filter(cat => cat.product_categories_sub_level == 2);

        // Build sorted hierarchical list
        const sortedCategories = [];

        // First, add all parents sorted by name
        parents
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach(parent => {
                // Add parent
                sortedCategories.push(parent);
                
                // Add children of this parent, sorted by name
                children
                    .filter(child => child.product_categories_parent_uuid === parent.uuid)
                    .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
                    .forEach(child => {
                        sortedCategories.push(child);
                    });
            });

        // Add orphaned level 2 categories (those without a valid parent)
        const orphanedChildren = children.filter(child => 
            !parents.some(parent => parent.uuid === child.product_categories_parent_uuid)
        );
        orphanedChildren
            .sort((a, b) => a.product_categories_name.localeCompare(b.product_categories_name))
            .forEach(child => {
                sortedCategories.push(child);
            });

        return sortedCategories;
    };

    const columns = [
    // { Header: 'Nama', accessor: 'allottee_name' },
    // { Header: 'No. Fail / Geran', accessor: 'lot_file_num' },
        {
            Header: 'Product Categories',
            accessor: ['product_categories_name'],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2 font-bold ">
                    {row.product_categories_name}
                </div>
            ),
        },

        // { Header: 'No. Telefon', accessor: 'allottee_phone_num' },
        {
            Header: '',
            accessor: 'actions',
            Cell: ({ row }) => (
                <div className="flex space-x-2 justify-end">
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Product Categories
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
                    <div className='px-4'>
                         <AddProductCategories product_categories={product_categories} />                   
                    </div>

                    <div className="overflow-hidden sm:rounded-lg m-2 p-2">
                        {/* <div className='font-bold text-2xl mb-2'>Products</div> */}
                        <DataTable columns={columns} data={product_categories} />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
