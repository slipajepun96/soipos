import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import Alert from '@/Components/Alert';
import { usePage } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InventoryIndex() {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
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

                    {/* <Tabs defaultValue="product" className="w-full px-2">
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
                    </Tabs> */}
                    <div className="overflow-hidden sm:rounded-lg m-2 p-2">
                        <div className='font-bold text-2xl mb-2'>Inventory</div>
                        <div className=' grid grid-cols-2 md:grid-cols-4 gap-2'>
                            <Link href={route('inventory.stockIn.index')}>
                                <div className='p-3 bg-white rounded-xl shadow-md h-24 border'>
                                    {/* <ClockPlus /> */}
                                    Stock In
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white rounded-xl shadow-md h-24 border'>
                                    {/* <ClockPlus /> */}
                                    Stock Out
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white rounded-xl shadow-md h-24 border'>
                                    {/* <ClockPlus /> */}
                                    Stock Card
                                </div>
                            </Link>
                            <Link href={route('inventory.index')}>
                                <div className='p-3 bg-white rounded-xl shadow-md h-24 border'>
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
