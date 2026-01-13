import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { runRCAAgent } from '@/lib/agents/rca';
import { Alert, SensorReading } from '@/types';

/**
 * POST /api/rca
 * Generate Root Cause Analysis report for an alert
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { alert_id, vehicle_id } = body;

        if (!alert_id && !vehicle_id) {
            return NextResponse.json(
                { success: false, error: 'Either alert_id or vehicle_id is required' },
                { status: 400 }
            );
        }

        let alert: Alert | null = null;

        // Get alert details
        if (alert_id) {
            const { data, error } = await supabaseAdmin
                .from('alerts')
                .select('*')
                .eq('id', alert_id)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'Alert not found' },
                    { status: 404 }
                );
            }

            alert = data as Alert;
        } else if (vehicle_id) {
            // Get most recent critical/high alert
            const { data, error } = await supabaseAdmin
                .from('alerts')
                .select('*')
                .eq('vehicle_id', vehicle_id)
                .in('severity', ['HIGH', 'CRITICAL'])
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'No high-severity alerts found for vehicle' },
                    { status: 404 }
                );
            }

            alert = data as Alert;
        }

        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            );
        }

        // Get historical context
        const { data: similarAlerts } = await supabaseAdmin
            .from('alerts')
            .select('id')
            .eq('vehicle_id', alert.vehicle_id)
            .eq('alert_type', alert.alert_type);

        const { data: recentSensors } = await supabaseAdmin
            .from('sensor_readings')
            .select('*')
            .eq('vehicle_id', alert.vehicle_id)
            .order('timestamp', { ascending: false })
            .limit(10);

        // Run RCA Agent
        const rcaResult = await runRCAAgent({
            vehicle_id: alert.vehicle_id,
            alert: alert,
            historical_data: {
                similar_alerts: similarAlerts?.length || 0,
                recent_sensors: (recentSensors as SensorReading[]) || []
            }
        });

        // Log RCA generation
        await supabaseAdmin
            .from('agent_logs')
            .insert({
                vehicle_id: alert.vehicle_id,
                agent_type: 'RCA',
                action: 'RCA report generated',
                input_data: { alert_id: alert.id },
                reasoning: rcaResult.reasoning,
                decision: rcaResult,
                confidence_score: rcaResult.confidence,
                alert_id: alert.id,
                execution_time_ms: Date.now() - startTime
            });

        return NextResponse.json({
            success: true,
            data: {
                alert: alert,
                rca: rcaResult,
                execution_time_ms: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('RCA API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rca
 * Fetch RCA reports from agent logs
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const limit = parseInt(searchParams.get('limit') || '10');

        let query = supabaseAdmin
            .from('agent_logs')
            .select('*')
            .eq('agent_type', 'RCA')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch RCA reports' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('RCA GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
