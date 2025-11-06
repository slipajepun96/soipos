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

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    public function registerIndex()
    {
        return inertia('Agent/Public/AgentRegister');
    }

    public function saveAgentRegistration(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'agent_name' => 'required|string|max:255',
            'agent_nric' => 'required|string|max:255|unique:agents,agent_nric',
            'agent_address' => 'required|string|max:500',
            'agent_phone_num' => 'required|string|max:20',
            'agent_email' => 'required|email|max:255',
            'agent_social_media' => 'nullable|string|max:100',
            'agent_social_media_link' => 'nullable|string|max:255',
        ]);

        $agent = new Agent($validated);
        $agent->save();

        //get id of the newly created agent
        $agentId = DB::getPdo()->lastInsertId();
        // dd($agentId);
        

        return Redirect::route('agent.register.success')->with('success', 'Agent registration submitted successfully and is pending approval.');
    }

    public function agentRegistrationSuccess()
    {
        return inertia('Agent/Public/AgentRegistrationSuccess');
    }
}
