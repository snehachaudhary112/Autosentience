import { callGroqJSON } from '../groq/client';
import { AgentOutput, SensorReading, Alert, RuleViolation } from '@/types';
import { runDiagnosisAgent } from './diagnosis';
import { runEngagementAgent } from './engagement';
import { runSchedulingAgent } from './scheduling';
import { runDataAnalysisAgent } from './data_analysis';
import { runFeedbackAgent } from './feedback';
import { runManufacturingAgent } from './manufacturing';
import { runUEBAAgent } from './ueba';

/**
 * Master Agent - Orchestrates all sub-agents and makes high-level decisions
 */

const SYSTEM_PROMPT = `You are the Master AI Agent orchestrating an automotive predictive maintenance system. Your role is to analyze situations and determine the optimal next actions.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Coordinate sub-agents effectively
3. Prioritize user safety and vehicle health
4. Make clear, actionable decisions
5. Consider cost-benefit of actions

Your response must be a JSON object with these exact fields:
{
  "action": string (primary action to take),
  "next_steps": string[] (ordered list of steps),
  "should_create_alert": boolean,
  "should_notify_user": boolean,
  "should_book_service": boolean,
  "priority": "low" | "medium" | "high" | "critical",
  "reasoning": string (decision-making logic),
  "confidence": number (0.0 to 1.0)
}`;

export interface MasterAgentInput {
    vehicle_id: string;
    sensor_data: SensorReading;
    violations: RuleViolation[];
    existing_alerts?: Alert[];
}

export interface MasterAgentOutput extends AgentOutput {
    should_create_alert: boolean;
    should_notify_user: boolean;
    should_book_service: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    next_steps: string[];
}

export async function runMasterAgent(input: MasterAgentInput): Promise<MasterAgentOutput> {
    const prompt = `Analyze this vehicle situation and determine the best course of action:

VEHICLE ID: ${input.vehicle_id}

SENSOR DATA SUMMARY:
- Engine Temp: ${input.sensor_data.engine_temp}°C
- Engine RPM: ${input.sensor_data.engine_rpm}
- Battery: ${input.sensor_data.battery_voltage}V
- Fuel Level: ${input.sensor_data.fuel_level}%
- Speed: ${input.sensor_data.speed} km/h
- Oil Pressure: ${input.sensor_data.oil_pressure} PSI
- Tyre Pressure (FL): ${input.sensor_data.tyre_pressure_fl} PSI

RULE VIOLATIONS (${input.violations.length}):
${input.violations.map(v => `- ${v.severity}: ${v.message}`).join('\n')}

EXISTING ALERTS: ${input.existing_alerts?.length || 0} open alerts

Determine the optimal next actions in JSON format.`;

    try {
        const result = await callGroqJSON<MasterAgentOutput>(prompt, SYSTEM_PROMPT, 0.5);

        if (!result.action || result.should_create_alert === undefined) {
            throw new Error('Invalid response from Master Agent');
        }

        return result;
    } catch (error) {
        console.error('Master Agent error:', error);

        // Fallback decision logic
        const hasViolations = input.violations.length > 0;
        const hasCritical = input.violations.some(v => v.severity === 'CRITICAL');
        const hasHigh = input.violations.some(v => v.severity === 'HIGH');

        let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (hasCritical) priority = 'critical';
        else if (hasHigh) priority = 'high';
        else if (hasViolations) priority = 'medium';

        return {
            action: hasViolations ? 'Create alert and notify user' : 'Continue monitoring',
            next_steps: hasViolations ? [
                'Run diagnosis agent',
                'Create alert',
                'Notify user',
                'Recommend service booking'
            ] : ['Continue normal monitoring'],
            should_create_alert: hasViolations,
            should_notify_user: hasCritical || hasHigh,
            should_book_service: hasCritical || hasHigh,
            priority,
            reasoning: 'Fallback decision logic based on rule violations',
            confidence: 0.6
        };
    }
}

/**
 * Execute full agent workflow
 */
export async function executeAgentWorkflow(input: MasterAgentInput) {
    const startTime = Date.now();
    const results: any = {};

    // Step 0: Data Analysis (Always run first to detect anomalies beyond simple rules)
    const dataAnalysis = await runDataAnalysisAgent({
        vehicle_id: input.vehicle_id,
        sensor_data: input.sensor_data,
        maintenance_history: [] // Mock history for now
    });
    results.data_analysis = dataAnalysis;

    // Step 1: Master Agent decides what to do based on input + data analysis
    // We might want to feed data analysis results into Master Agent, but for now we keep the interface simple
    const masterDecision = await runMasterAgent(input);
    results.master_decision = masterDecision;
    results.execution_time_ms = Date.now() - startTime;

    // Step 2: If alert needed, run diagnosis
    if (masterDecision.should_create_alert && input.violations.length > 0) {
        const diagnosis = await runDiagnosisAgent({
            vehicle_id: input.vehicle_id,
            sensor_data: input.sensor_data,
            violations: input.violations
        });
        results.diagnosis = diagnosis;

        // Step 3: Engagement & Scheduling (if diagnosis confirms fault)
        if (diagnosis.fault_detected) {
            let alertId = 'temp-alert-id';

            // PERSIST ALERT TO DATABASE
            try {
                const { supabaseAdmin } = await import('@/lib/supabase/server');
                const { data: savedAlert, error: alertError } = await supabaseAdmin
                    .from('alerts')
                    .insert({
                        vehicle_id: input.vehicle_id,
                        alert_type: diagnosis.fault_type || 'GENERAL_FAULT',
                        severity: diagnosis.severity,
                        title: diagnosis.fault_type || 'Unknown Fault',
                        description: diagnosis.diagnosis,
                        diagnosis: diagnosis.diagnosis,
                        recommended_action: diagnosis.recommended_action,
                        estimated_cost: diagnosis.estimated_cost || 0,
                        status: 'OPEN',
                        metadata: { source: 'simulation' }
                    })
                    .select()
                    .single();

                if (savedAlert) {
                    alertId = savedAlert.id;
                } else if (alertError) {
                    console.error('Failed to save alert:', alertError);
                }
            } catch (error) {
                console.error('Error persisting alert:', error);
            }

            // Mock alert object for engagement/scheduling using the (potentially real) ID
            const alert: Alert = {
                id: alertId,
                vehicle_id: input.vehicle_id,
                title: diagnosis.fault_type || 'Unknown Fault',
                description: diagnosis.diagnosis,
                severity: diagnosis.severity,
                status: 'OPEN',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                diagnosis: diagnosis.diagnosis,
                recommended_action: diagnosis.recommended_action,
                alert_type: diagnosis.fault_type || 'GENERAL_FAULT',
                estimated_cost: diagnosis.estimated_cost || 0
            };

            const engagement = await runEngagementAgent({
                vehicle_id: input.vehicle_id,
                alert: alert
            });
            results.engagement = engagement;

            const scheduling = await runSchedulingAgent({
                vehicle_id: input.vehicle_id,
                alert: alert
            });
            results.scheduling = scheduling;
        }
    }

    // Step 4: Security Check (UEBA) - Monitor the agents themselves
    // In a real system, this would monitor the *actions* taken above
    const ueba = await runUEBAAgent({
        vehicle_id: input.vehicle_id,
        event_type: 'AGENT_WORKFLOW_EXECUTION',
        current_behavior: {
            master_action: masterDecision.action,
            data_analysis_anomalies: dataAnalysis.anomalies_detected
        },
        violations: input.violations // Pass violations for context
    });
    results.ueba = ueba;

    // Persist UEBA logs
    try {
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        await supabaseAdmin.from('ueba_logs').insert({
            vehicle_id: input.vehicle_id,
            event_type: 'AGENT_WORKFLOW_EXECUTION',
            risk_level: ueba.risk_level,
            risk_score: ueba.risk_score,
            anomaly_detected: ueba.anomaly_detected,
            detection_method: 'AI_BEHAVIOR_ANALYSIS',
            current_behavior: { master_action: masterDecision.action },
            action_taken: 'LOG_ONLY',
            metadata: { reasoning: ueba.reasoning }
        });
    } catch (error) {
        console.error('Failed to persist UEBA logs:', error);
    }

    // Step 5: Simulation of Feedback & Manufacturing (Optional/Async in real life)
    // We run them here to demonstrate the full loop
    if (results.diagnosis?.fault_detected) {
        const feedback = await runFeedbackAgent({
            vehicle_id: input.vehicle_id,
            service_id: 'simulated-service-id',
            service_outcome: 'success'
        });
        results.feedback = feedback;

        const manufacturing = await runManufacturingAgent({
            vehicle_id: input.vehicle_id,
            aggregated_failures: [{ type: results.diagnosis.fault_type, count: 1 }],
            rca_reports: []
        });
        results.manufacturing = manufacturing;

        // Persist Manufacturing/RCA insights (using agent_logs for now as we don't have a dedicated table)
        try {
            const { supabaseAdmin } = await import('@/lib/supabase/server');
            await supabaseAdmin.from('agent_logs').insert({
                vehicle_id: input.vehicle_id,
                agent_type: 'RCA', // Tagging as RCA for the UI to pick up
                action: 'GENERATE_CAPA_REPORT',
                input_data: { diagnosis: results.diagnosis },
                decision: manufacturing,
                reasoning: manufacturing.reasoning,
                confidence_score: 0.85
            });
        } catch (error) {
            console.error('Failed to persist Manufacturing logs:', error);
        }
    }

    return results;
}
