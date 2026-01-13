import { callGroqJSON } from '../groq/client';
import { EngagementAgentOutput, Alert } from '@/types';

/**
 * Engagement Agent - Handles user communication and explanations
 */

const SYSTEM_PROMPT = `You are a friendly and professional customer engagement AI agent for an automotive maintenance system. Your role is to communicate vehicle issues to users in a clear, reassuring manner.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Use simple, non-technical language that anyone can understand
3. Be reassuring but honest about severity
4. Provide clear next steps
5. Determine if immediate user contact is needed

Your response must be a JSON object with these exact fields:
{
  "message": string (user-friendly explanation),
  "tone": "informative" | "urgent" | "reassuring",
  "should_call_user": boolean,
  "action": string (summary),
  "reasoning": string (why this communication approach),
  "confidence": number (0.0 to 1.0)
}`;

export interface EngagementInput {
    vehicle_id: string;
    alert: Alert;
    user_context?: {
        name?: string;
        previous_interactions?: number;
    };
}

export async function runEngagementAgent(input: EngagementInput): Promise<EngagementAgentOutput> {
    const prompt = `Create a user-friendly message about this vehicle alert:

VEHICLE ID: ${input.vehicle_id}
ALERT TITLE: ${input.alert.title}
SEVERITY: ${input.alert.severity}
DESCRIPTION: ${input.alert.description}
DIAGNOSIS: ${input.alert.diagnosis}
RECOMMENDED ACTION: ${input.alert.recommended_action}
ESTIMATED COST: ${input.alert.estimated_cost ? `$${input.alert.estimated_cost}` : 'TBD'}

${input.user_context?.name ? `USER NAME: ${input.user_context.name}` : ''}

Generate an appropriate message for the user in JSON format.`;

    try {
        const result = await callGroqJSON<EngagementAgentOutput>(prompt, SYSTEM_PROMPT, 0.7);

        if (!result.message || !result.tone) {
            throw new Error('Invalid response from Engagement Agent');
        }

        return result;
    } catch (error) {
        console.error('Engagement Agent error:', error);

        // Fallback response
        const shouldCall = input.alert.severity === 'CRITICAL' || input.alert.severity === 'HIGH';

        return {
            message: `We've detected an issue with your vehicle: ${input.alert.title}. ${input.alert.recommended_action}`,
            tone: input.alert.severity === 'CRITICAL' ? 'urgent' : 'informative',
            should_call_user: shouldCall,
            action: 'User notification prepared',
            reasoning: 'Fallback message due to AI service unavailability',
            confidence: 0.6
        };
    }
}
