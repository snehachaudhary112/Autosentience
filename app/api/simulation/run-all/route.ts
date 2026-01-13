import { NextResponse } from 'next/server';
import { runSimulationScenario } from '@/lib/simulation/runner';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { vehicle_id, scenario } = body;

        const results = await runSimulationScenario(vehicle_id || 'vehicle-123', scenario);

        return NextResponse.json({
            success: true,
            scenario,
            results
        });

    } catch (error: any) {
        console.error('Simulation error:', error);
        const urlDebug = process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + '...' : 'UNDEFINED';
        return NextResponse.json(
            { success: false, error: 'Simulation failed: ' + (error.message || error) + ' [URL: ' + urlDebug + ']' },
            { status: 500 }
        );
    }
}
