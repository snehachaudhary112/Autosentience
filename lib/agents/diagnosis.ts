import { callGroqJSON } from '../groq/client';
import { DiagnosisAgentOutput, SensorReading, RuleViolation, AlertSeverity } from '@/types';

/**
 * Diagnosis Agent - Analyzes sensor data and provides fault diagnosis
 */

const SYSTEM_PROMPT = `You are an expert automotive diagnostic AI agent. Your role is to analyze vehicle sensor data and rule violations to provide accurate fault diagnosis.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Never hallucinate or make up information
3. Base diagnosis only on provided sensor data and violations
4. Provide actionable recommendations
5. Estimate costs conservatively (in USD)

Your response must be a JSON object with these exact fields:
{
  "fault_detected": boolean,
  "fault_type": string (e.g., "ENGINE_OVERHEAT", "BATTERY_LOW"),
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "diagnosis": string (detailed technical diagnosis),
  "recommended_action": string (clear action for user),
  "estimated_cost": number (USD, null if not applicable),
  "action": string (summary of diagnosis),
  "reasoning": string (your diagnostic reasoning),
  "confidence": number (0.0 to 1.0)
}`;

export interface DiagnosisInput {
    vehicle_id: string;
    sensor_data: SensorReading;
    violations: RuleViolation[];
}

export async function runDiagnosisAgent(input: DiagnosisInput): Promise<DiagnosisAgentOutput> {
    const prompt = `Analyze the following vehicle sensor data and rule violations:

VEHICLE ID: ${input.vehicle_id}

SENSOR DATA:
${JSON.stringify(input.sensor_data, null, 2)}

RULE VIOLATIONS:
${input.violations.map(v => `- ${v.message}: ${v.parameter} = ${v.current_value} (threshold: ${v.threshold}, severity: ${v.severity})`).join('\n')}

Provide a comprehensive diagnosis in JSON format.`;

    try {
        const result = await callGroqJSON<DiagnosisAgentOutput>(prompt, SYSTEM_PROMPT, 0.5);

        // Validate required fields
        if (!result.fault_detected === undefined || !result.severity || !result.diagnosis) {
            throw new Error('Invalid response from Diagnosis Agent');
        }

        return result;
    } catch (error) {
        console.error('Diagnosis Agent error:', error);

        // Fallback response
        const highestSeverity = input.violations.reduce((max, v) => {
            const severityOrder: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            return severityOrder.indexOf(v.severity) > severityOrder.indexOf(max) ? v.severity : max;
        }, 'LOW' as AlertSeverity);

        return {
            fault_detected: input.violations.length > 0,
            fault_type: input.violations[0]?.parameter.toUpperCase() || 'UNKNOWN',
            severity: highestSeverity,
            diagnosis: `Detected ${input.violations.length} rule violation(s). ${input.violations.map(v => v.message).join('. ')}`,
            recommended_action: 'Schedule service inspection to diagnose and resolve issues.',
            estimated_cost: undefined,
            action: 'Fault diagnosis completed',
            reasoning: 'Fallback diagnosis due to AI service unavailability',
            confidence: 0.6
        };
    }
}
