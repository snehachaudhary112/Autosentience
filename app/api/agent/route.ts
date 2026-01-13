import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { runMasterAgent } from '@/lib/agents/master';
import { detectRuleViolations } from '@/lib/rules/detector';
import { SensorReading, Alert } from '@/types';

/**
 * POST /api/agent
 * Master Agent orchestration endpoint
 * Analyzes current vehicle state and determines next actions
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { vehicle_id, sensor_reading_id } = body;

        if (!vehicle_id) {
            return NextResponse.json(
                { success: false, error: 'vehicle_id is required' },
                { status: 400 }
            );
        }

        // Get sensor data
        let sensorData: SensorReading;

        if (sensor_reading_id) {
            const { data, error } = await supabaseAdmin
                .from('sensor_readings')
                .select('*')
                .eq('id', sensor_reading_id)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'Sensor reading not found' },
                    { status: 404 }
                );
            }

            sensorData = data as SensorReading;
        } else {
            // Get latest sensor reading
            const { data, error } = await supabaseAdmin
                .from('sensor_readings')
                .select('*')
                .eq('vehicle_id', vehicle_id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: 'No sensor data found for vehicle' },
                    { status: 404 }
                );
            }

            sensorData = data as SensorReading;
        }

        // Detect rule violations
        const ruleResult = detectRuleViolations(sensorData);

        // Get existing open alerts
        const { data: existingAlerts } = await supabaseAdmin
            .from('alerts')
            .select('*')
            .eq('vehicle_id', vehicle_id)
            .eq('status', 'OPEN');

        // Run Master Agent
        const masterDecision = await runMasterAgent({
            vehicle_id,
            sensor_data: sensorData,
            violations: ruleResult.violations,
            existing_alerts: (existingAlerts as Alert[]) || []
        });

        // Log decision
        await supabaseAdmin
            .from('agent_logs')
            .insert({
                vehicle_id,
                agent_type: 'MASTER',
                action: masterDecision.action,
                input_data: {
                    sensor_reading_id: sensorData.id,
                    violations_count: ruleResult.violations.length,
                    existing_alerts_count: existingAlerts?.length || 0
                },
                reasoning: masterDecision.reasoning,
                decision: masterDecision,
                confidence_score: masterDecision.confidence,
                execution_time_ms: Date.now() - startTime
            });

        return NextResponse.json({
            success: true,
            data: {
                vehicle_id,
                master_decision: masterDecision,
                violations: ruleResult.violations,
                sensor_reading: sensorData,
                execution_time_ms: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('Agent API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agent
 * Fetch agent decision logs
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const agentType = searchParams.get('agent_type');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabaseAdmin
            .from('agent_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        if (agentType) {
            query = query.eq('agent_type', agentType.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch agent logs' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Agent GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
