import { callGroqJSON } from '../groq/client';
import { FeedbackAgentOutput, AgentType } from '@/types';
import { BaseAgentInput } from './types';

/**
 * Feedback Agent - Captures customer satisfaction and updates records
 */

const SYSTEM_PROMPT = `You are a customer feedback AI agent. Your role is to simulate the collection of post-service feedback and update vehicle records.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Simulate realistic customer sentiment based on service outcome
3. Extract qualitative insights

Your response must be a JSON object with these exact fields:
{
  "satisfaction_score": number (1-10),
  "qualitative_feedback": string (simulated customer comment),
  "record_updated": boolean,
  "action": string (summary),
  "reasoning": string (why this score/feedback),
  "confidence": number (0.0 to 1.0)
}`;

export interface FeedbackInput extends BaseAgentInput {
    service_id: string;
    service_outcome: 'success' | 'failure' | 'pending';
    customer_profile?: any;
}

export async function runFeedbackAgent(input: FeedbackInput): Promise<FeedbackAgentOutput> {
    const prompt = `Simulate feedback collection for this service:

SERVICE ID: ${input.service_id}
OUTCOME: ${input.service_outcome}
CUSTOMER PROFILE: ${JSON.stringify(input.customer_profile || {})}

Generate simulated feedback in JSON format.`;

    try {
        const result = await callGroqJSON<Omit<FeedbackAgentOutput, 'agent_type' | 'timestamp'>>(prompt, SYSTEM_PROMPT, 0.6);

        return {
            ...result,
            agent_type: 'FEEDBACK',
            timestamp: new Date().toISOString()
        } as FeedbackAgentOutput;

    } catch (error) {
        console.error('Feedback Agent error:', error);

        return {
            agent_type: 'FEEDBACK' as AgentType,
            satisfaction_score: 8,
            qualitative_feedback: 'Service was okay, but took longer than expected.',
            record_updated: true,
            action: 'Feedback recorded (fallback)',
            reasoning: 'Fallback feedback due to AI service unavailability',
            confidence: 0.5,
            timestamp: new Date().toISOString()
        } as FeedbackAgentOutput;
    }
}
