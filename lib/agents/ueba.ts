import { callGroqJSON } from '../groq/client';
import { UEBAAgentOutput, RiskLevel } from '@/types';

/**
 * UEBA Agent - User and Entity Behavior Analytics for security monitoring
 */

const SYSTEM_PROMPT = `You are a security-focused UEBA (User and Entity Behavior Analytics) AI agent for automotive systems. Your role is to detect anomalous behavior and security threats.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Identify deviations from normal behavior patterns
3. Assess risk levels accurately
4. Flag genuine security concerns
5. Minimize false positives

Your response must be a JSON object with these exact fields:
{
  "anomaly_detected": boolean,
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "risk_score": number (0.0 to 100.0),
  "suspicious_patterns": string[] (list of anomalous behaviors),
  "recommended_action": string,
  "action": string (summary),
  "reasoning": string (security analysis reasoning),
  "confidence": number (0.0 to 1.0)
}`;

export interface UEBAInput {
    vehicle_id: string;
    event_type: string;
    current_behavior: Record<string, any>;
    baseline_behavior?: Record<string, any>;
    violations?: any[]; // Added to give context on severity
}

export async function runUEBAAgent(input: UEBAInput): Promise<UEBAAgentOutput> {
    const prompt = `Analyze this vehicle behavior for security anomalies:

VEHICLE ID: ${input.vehicle_id}
EVENT TYPE: ${input.event_type}

CURRENT BEHAVIOR:
${JSON.stringify(input.current_behavior, null, 2)}

${input.baseline_behavior ? `
BASE BEHAVIOR:
${JSON.stringify(input.baseline_behavior, null, 2)}
` : 'No baseline available - first-time analysis'}

${input.violations && input.violations.length > 0 ? `
ACTIVE VIOLATIONS (CRITICAL CONTEXT):
${JSON.stringify(input.violations, null, 2)}
NOTE: Critical physical violations (like extreme overheat) WITHOUT prior degradation MAY indicate a cyber-physical attack (e.g. sensor spoofing or actuator hack).
` : ''}

Perform UEBA analysis and provide security assessment in JSON format.`;

    try {
        const result = await callGroqJSON<UEBAAgentOutput>(prompt, SYSTEM_PROMPT, 0.4);

        if (result.anomaly_detected === undefined || !result.risk_level) {
            throw new Error('Invalid response from UEBA Agent');
        }

        return result;
    } catch (error) {
        console.error('UEBA Agent error:', error);

        // Fallback UEBA
        return {
            anomaly_detected: false,
            risk_level: 'LOW',
            risk_score: 10,
            suspicious_patterns: [],
            action: 'Security monitoring completed',
            reasoning: 'Fallback UEBA analysis due to AI service unavailability',
            confidence: 0.5
        };
    }
}
