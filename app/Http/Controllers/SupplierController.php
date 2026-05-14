<?php

namespace App\Http\Controllers;
use App\Models\Supplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use App\Models\Entity;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::orderBy('supplier_name')->orderBy('is_active', 'desc')->get();
        return Inertia::render('Supplier/SupplierIndex', [
            'suppliers' => $suppliers
        ]);
    }

    public function saveSupplier(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'supplier_name' => 'required|string|max:255',
            'supplier_address' => 'required|string|max:255',
            'supplier_rob_num' => 'required|string|max:255',
            'supplier_contact_person' => 'nullable|string|max:255',
            'supplier_phone_num' => 'required|string|max:20',
            'supplier_email' => 'required|email|max:255',
            'supplier_tax_identification_num' => 'nullable|string|max:255',
            'supplier_remark' => 'nullable|string|max:1000',
        ]);

        $supplier = new Supplier($validatedData);
        $supplier->save();
        return Redirect::route('supplier.index')->with('success', 'Supplier added successfully.');
    }

    public function updateSupplier(Request $request): RedirectResponse
    {
        try {
            $supplier = Supplier::findOrFail($request->id);
            $validatedData = $request->validate([
                'supplier_name' => 'required|string|max:255',
                'supplier_address' => 'required|string|max:255',
                'supplier_rob_num' => 'required|string|max:255',
                'supplier_contact_person' => 'nullable|string|max:255',
                'supplier_phone_num' => 'required|string|max:20',
                'supplier_email' => 'required|email|max:255',
                'supplier_tax_identification_num' => 'nullable|string|max:255',
                'supplier_remark' => 'nullable|string|max:1000',
            ]);

            $supplier->supplier_name = $validatedData['supplier_name'];
            $supplier->supplier_address = $validatedData['supplier_address'];
            $supplier->supplier_rob_num = $validatedData['supplier_rob_num'];
            $supplier->supplier_contact_person = $validatedData['supplier_contact_person'];
            $supplier->supplier_phone_num = $validatedData['supplier_phone_num'];
            $supplier->supplier_email = $validatedData['supplier_email'];
            $supplier->supplier_tax_identification_num = $validatedData['supplier_tax_identification_num'];
            $supplier->supplier_remark = $validatedData['supplier_remark'];
            $supplier->is_active = '1';
            $supplier->save();

            return redirect()->route('supplier.index')->with('success', 'Supplier updated');
        } catch (\Exception $e) {
            // Handle any unexpected errors
            return redirect()->back()->withErrors(['error' => 'An error occurred while updating this supplier. Please try again.']);
        }


    }

    public function deactivateSupplier(Request $request): RedirectResponse
    {
        // dd($request->all());
        $supplier = Supplier::findOrFail($request->id);
        $supplier->is_active = '0';
        $supplier->save();

        return Redirect::route('supplier.index')->with('success', 'Supplier deactivated successfully.');
    }

    public function deleteSupplier(Request $request): RedirectResponse
    {
        try {
            DB::beginTransaction();
            
            Supplier::findOrFail($request->id)->delete();

            DB::commit();
            return redirect()->back()->with([
                'message' => 'Deleted Successfully',
                'type' => 'success'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Database error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()
                ->with('error', 'Failed to save transactions')
                ->withErrors(['database' => $e->getMessage()]);
        }

    }

        
}
