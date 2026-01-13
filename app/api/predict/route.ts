import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { detectRuleViolations, formatViolationsForAI } from '@/lib/rules/detector';
import { executeAgentWorkflow } from '@/lib/agents/master';
import { SensorReading, Alert } from '@/types';

/**
 * POST /api/predict
 * Runs predictive analysis on sensor data
 * - Applies rule-based detection
 * - Invokes AI agents for diagnosis
 * - Creates alerts if needed
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const vehicleId = body.vehicle_id;

        if (!vehicleId) {
            return NextResponse.json(
                { success: false, error: 'vehicle_id is required' },
                { status: 400 }
            );
        }

        // Get latest sensor reading for this vehicle
        const { data: sensorData, error: sensorError } = await supabaseAdmin
            .from('sensor_readings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (sensorError || !sensorData) {
            return NextResponse.json(
                { success: false, error: 'No sensor data found for vehicle' },
                { status: 404 }
            );
        }

        // Step 1: Rule-based detection
        const ruleResult = detectRuleViolations(sensorData as SensorReading);

        if (!ruleResult.has_violations) {
            return NextResponse.json({
                success: true,
                data: {
                    vehicle_id: vehicleId,
                    anomalies_detected: false,
                    message: 'All systems normal',
                    sensor_reading_id: sensorData.id
                }
            });
        }

        // Step 2: Get existing alerts
        const { data: existingAlerts } = await supabaseAdmin
            .from('alerts')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .eq('status', 'OPEN');

        // Step 3: Run agent workflow
        const agentResults = await executeAgentWorkflow({
            vehicle_id: vehicleId,
            sensor_data: sensorData as SensorReading,
            violations: ruleResult.violations,
            existing_alerts: existingAlerts as Alert[] || []
        });

        const createdAlerts: Alert[] = [];

        // Step 4: Create alert if diagnosis found fault
        if (agentResults.diagnosis?.fault_detected) {
            const diagnosis = agentResults.diagnosis;

            const { data: newAlert, error: alertError } = await supabaseAdmin
                .from('alerts')
                .insert({
                    vehicle_id: vehicleId,
                    alert_type: diagnosis.fault_type || 'UNKNOWN',
                    severity: diagnosis.severity,
                    title: `${diagnosis.fault_type?.replace(/_/g, ' ')} Detected`,
                    description: formatViolationsForAI(ruleResult.violations),
                    diagnosis: diagnosis.diagnosis,
                    recommended_action: diagnosis.recommended_action,
                    estimated_cost: diagnosis.estimated_cost,
                    sensor_reading_id: sensorData.id,
                    status: 'OPEN'
                })
                .select()
                .single();

            if (!alertError && newAlert) {
                createdAlerts.push(newAlert as Alert);
            }
        }

        // Step 5: Log agent decision
        await supabaseAdmin
            .from('agent_logs')
            .insert({
                vehicle_id: vehicleId,
                agent_type: 'MASTER',
                action: agentResults.master_decision.action,
                input_data: {
                    sensor_reading_id: sensorData.id,
                    violations_count: ruleResult.violations.length
                },
                reasoning: agentResults.master_decision.reasoning,
                decision: agentResults.master_decision,
                confidence_score: agentResults.master_decision.confidence,
                alert_id: createdAlerts[0]?.id,
                execution_time_ms: Date.now() - startTime
            });

        return NextResponse.json({
            success: true,
            data: {
                vehicle_id: vehicleId,
                anomalies_detected: true,
                violations: ruleResult.violations,
                alerts_created: createdAlerts,
                diagnosis: agentResults.diagnosis,
                master_decision: agentResults.master_decision,
                execution_time_ms: Date.now() - startTime
            }
        });

    } catch (error) {
        console.error('Predict API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}
