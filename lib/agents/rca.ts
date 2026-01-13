import { callGroqJSON } from '../groq/client';
import { RCAAgentOutput, Alert, SensorReading } from '@/types';

/**
 * RCA Agent - Performs Root Cause Analysis and generates CAPA reports
 */

const SYSTEM_PROMPT = `You are an expert Root Cause Analysis (RCA) AI agent for automotive systems. Your role is to identify root causes, contributing factors, and provide Corrective and Preventive Actions (CAPA).

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Identify the true root cause, not just symptoms
3. Consider multiple contributing factors
4. Provide actionable CAPA recommendations
5. Include preventive measures to avoid recurrence

Your response must be a JSON object with these exact fields:
{
  "root_cause": string (the fundamental cause),
  "contributing_factors": string[] (list of factors that contributed),
  "capa_recommendations": string[] (corrective and preventive actions),
  "preventive_measures": string[] (how to prevent in future),
  "action": string (summary),
  "reasoning": string (your RCA methodology),
  "confidence": number (0.0 to 1.0)
}`;

export interface RCAInput {
    vehicle_id: string;
    alert: Alert;
    historical_data?: {
        similar_alerts: number;
        recent_sensors: SensorReading[];
    };
}

export async function runRCAAgent(input: RCAInput): Promise<RCAAgentOutput> {
    const prompt = `Perform Root Cause Analysis for this vehicle issue:

VEHICLE ID: ${input.vehicle_id}
ALERT: ${input.alert.title}
SEVERITY: ${input.alert.severity}
DESCRIPTION: ${input.alert.description}
DIAGNOSIS: ${input.alert.diagnosis}

${input.historical_data ? `
HISTORICAL CONTEXT:
- Similar alerts in past: ${input.historical_data.similar_alerts}
- Recent sensor trends: ${input.historical_data.recent_sensors.length} readings available
` : ''}

Provide comprehensive RCA with CAPA in JSON format.`;

    try {
        const result = await callGroqJSON<RCAAgentOutput>(prompt, SYSTEM_PROMPT, 0.6);

        if (!result.root_cause || !result.capa_recommendations) {
            throw new Error('Invalid response from RCA Agent');
        }

        return result;
    } catch (error) {
        console.error('RCA Agent error:', error);

        // Fallback RCA
        return {
            root_cause: `Primary issue: ${input.alert.title}`,
            contributing_factors: [
                'Sensor threshold violation detected',
                'Possible component wear or malfunction'
            ],
            capa_recommendations: [
                'Conduct thorough inspection of affected system',
                'Replace or repair faulty components',
                'Verify all sensor readings post-repair'
            ],
            preventive_measures: [
                'Schedule regular preventive maintenance',
                'Monitor sensor trends proactively',
                'Follow manufacturer service intervals'
            ],
            action: 'RCA completed',
            reasoning: 'Fallback RCA due to AI service unavailability',
            confidence: 0.5
        };
    }
}
