import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import DataTable from '@/Components/DataTable';
import PrimaryButton from '@/Components/PrimaryButton';
import { Plus, FileText } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import AddSupplier from './Partials/AddSupplier';
import EditSupplier from './Partials/EditSupplier';
import ViewSupplierDetail from './Partials/ViewSupplierDetail';
import DeleteSupplier from './Partials/DeleteSupplier';

export default function AgentIndex({ agents }) {
    const { flash } = usePage().props;

    const columns = [
    // { Header: 'Nama', accessor: 'allottee_name' },
    // { Header: 'No. Fail / Geran', accessor: 'lot_file_num' },
        {
            Header: 'Agent',
            accessor: ['agent_name', 'agent_nric'],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2 ">
                    {row.agent_name}
                    <div className='text-sm'>{row.agent_nric}</div>
                </div>
            ),
        },
        {
            // Header: 'Contact Details',
            accessor: ['agent_phone_num', 'agent_email', 'agent_address'],
            Cell: ({ row }) => (
                <div className="flex flex-col ">
                    <div className='text-sm'><b>Phone Num. :</b> {row.agent_phone_num}</div>
                    <div className='text-sm'><b>E-Mail :</b> {row.agent_email}</div>
                    <div className='text-sm'><b>Address :</b> {row.agent_address}</div>
                </div>
            ),
        },
        {
            Header: 'Status',
            accessor: [''],
            Cell: ({ row }) => (
                <div className="flex flex-col space-x-2">
                    {row.agent_status === 'pending' ? (
                        <div className='text-sm bg-gray-200 px-1 py-0.5 rounded-full font-bold text-gray-700 text-center'>Pending</div>
                    ) : row.agent_status === 'verified' ? (
                        <div className='text-sm bg-primary px-2 py-0.5 rounded-md font-medium text-primary-foreground text-center'>Verified</div>
                    ) : row.agent_status === 'inactive' ? (
                        <div className='text-sm border px-2 py-0.5 rounded-md text-muted-foreground font-medium text-center'>Inactive</div>
                    ) : (
                        <div className='text-sm bg-secondary px-2 py-0.5 rounded-md font-medium text-secondary-foreground text-center'>Unknown</div>
                        )
                    }

                </div>
            ),
        },
        {
            Header: '',
            accessor: 'actions',
            Cell: ({ row }) => (
                <div className="flex space-x-2 justify-end">
                    {/* <ViewSupplierDetail supplier={ row }/>
                    <EditSupplier supplier={ row }/>
                    <DeleteSupplier supplier={ row }/> */}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Agent
                </h2>
            }
        >
            <Head title="Inventory & Products" />

            <div className="py-2">
                <div className="mx-auto max-w-7xl sm:px-2 lg:px-2">

                    <div className='px-4'>
                        {/* <AddSupplier /> */}
                    </div>
                    <DataTable columns={columns} data={agents} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
