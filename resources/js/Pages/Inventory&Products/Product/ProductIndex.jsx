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
import AddProductCategories from './Partials/AddProductCategories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductIndex({ products , product_categories , suppliers}) {
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

    const ProductCategoriescolumns = [
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

    // Helper function to get supplier name by ID
    const getSupplierName = (supplierId) => {
        const supplier = suppliers?.find(s => s.id === supplierId);
        return supplier ? supplier.supplier_name : 'Supplier not defined';
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
            Header: 'Code',
            accessor: ['product_supplier_id', 'product_category_id'],
            Cell: ({ row }) => (
                <div className="flex flex-col">
                    <div className='font-base'>
                        {row.product_code}
                    </div>
                    {row.product_sku_code && <div>SKU  : {row.product_sku_code}</div> }
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
                <h2 className="text-xl font-semibold leading-tight text-white">
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
                    <Tabs defaultValue="product" className="w-full px-2">
                        <TabsList>
                            <TabsTrigger value="product">Product</TabsTrigger>
                            <TabsTrigger value="productCategories">Product Categories</TabsTrigger>
                        </TabsList>
                        <TabsContent value="product">
                            <div className='py-2'>
                                <AddProduct product_categories={product_categories} suppliers={suppliers} />  
                            </div>
                              
                            <DataTable columns={columns} data={products} />
                        </TabsContent>
                        <TabsContent value="productCategories">
                            {flash?.message && flash.message.trim() !== '' && (
                                <Alert 
                                    type={flash?.type || 'info'} 
                                    message={flash.message}
                                />
                            )}
                            <div className='py-2'>
                                    <AddProductCategories product_categories={product_categories} />                   
                            </div>
                            <DataTable columns={ProductCategoriescolumns} data={product_categories} />
                        </TabsContent>
                    </Tabs>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
