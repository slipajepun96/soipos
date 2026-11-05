import { useEffect, useState } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { useForm } from '@inertiajs/react';

export default function DeleteProductCategories({ product_category }) {
    const { data, setData, post, processing, reset } = useForm({
        id: product_category.id,
        product_categories_name: product_category.product_categories_name || '',
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = (e) => {
        e.preventDefault();

        post(route('productCategory.deleteProductCategory', { id: product_category.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDialogOpen(false);
            },
            onError: (errors) => {
                console.error('Delete failed:', errors);
            },
        });
    };

    useEffect(() => {
        setData({
            id: product_category.id,
            product_categories_name: product_category.product_categories_name,
        });
    }, [product_category, setData]);

    const handleDialogClose = (isOpen) => {
        setIsDialogOpen(isOpen);

        if (!isOpen) {
            reset('id', 'product_categories_name');
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
                <PrimaryButton variant="outline">Delete</PrimaryButton>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Delete Product Category?</DialogTitle>
                </DialogHeader>
                <div className="items-center space-y-2">
                    <div className="grid flex-1 gap-2">
                        <div>{data.product_categories_name}</div>
                        <div className="rounded-sm border bg-muted p-3 text-base text-foreground">
                            Deleting this category can affect products linked to it.
                        </div>
                    </div>
                    <form onSubmit={handleDelete} className="flex gap-2">
                        <PrimaryButton disabled={processing} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </PrimaryButton>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
