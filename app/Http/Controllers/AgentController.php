<?php

namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Models\User;
use App\Models\Agent;
use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Store;
use App\Support\CurrentStore;
use Illuminate\Validation\Rule;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    /** Old shared link: go straight to the only store, otherwise let the agent pick. */
    public function registerPicker()
    {
        $stores = Store::where('is_active', true)->orderBy('name')->get(['name', 'code']);
        if ($stores->count() === 1) {
            return redirect()->route('agent.register', $stores->first()->code);
        }

        return inertia('Agent/Public/AgentStorePicker', ['stores' => $stores]);
    }

    public function registerIndex(string $code)
    {
        return inertia('Agent/Public/AgentRegister', ['store' => $this->publicStore($code)->only(['name', 'code'])]);
    }

    public function saveAgentRegistration(Request $request, string $code): RedirectResponse
    {
        $store = $this->publicStore($code);
        $validated = $request->validate([
            'agent_name' => 'required|string|max:255',
            'agent_nric' => ['required', 'string', 'max:255', Rule::unique('agents', 'agent_nric')->where('store_id', $store->id)],
            'agent_address' => 'required|string|max:500',
            'agent_phone_num' => 'required|string|max:20',
            'agent_email' => 'required|email|max:255',
            'agent_social_media' => 'nullable|string|max:100',
            'agent_social_media_link' => 'nullable|string|max:255',
        ]);

        $agent = new Agent($validated);
        $agent->save();



        return Redirect::route('agent.register.success', $store->code)->with('success', 'Agent registration submitted successfully and is pending approval.');
    }

    public function agentRegistrationSuccess(string $code)
    {
        return inertia('Agent/Public/AgentRegistrationSuccess', ['store' => $this->publicStore($code)->only(['name', 'code'])]);
    }

    /** The store a public agent link belongs to; new agents are saved under it. */
    private function publicStore(string $code): Store
    {
        $store = Store::where('code', $code)->where('is_active', true)->firstOrFail();
        CurrentStore::set($store->id);

        return $store;
    }

    public function index()
    {
        $agents = Agent::where('agent_status', '!=', 'inactive')->get();
        return Inertia::render('Agent/AgentIndex', [
            'agents' => $agents,
            'registerUrl' => route('agent.register', Store::whereKey(CurrentStore::id())->value('code')),
        ]);
    }
}
