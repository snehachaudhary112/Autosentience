import { callGroqJSON } from '../groq/client';
import { AgentType } from '@/types';

/**
 * Agent type definitions and shared utilities
 */

export interface BaseAgentInput {
    vehicle_id: string;
    context?: Record<string, any>;
}

/**
 * Log agent decision to database
 */
export async function logAgentDecision(
    agentType: AgentType,
    action: string,
    input: any,
    decision: any,
    reasoning: string,
    confidence: number,
    vehicleId?: string,
    alertId?: string,
    bookingId?: string,
    executionTimeMs?: number
) {
    // This will be called from API routes with supabaseAdmin
    return {
        agent_type: agentType,
        action,
        input_data: input,
        decision,
        reasoning,
        confidence_score: confidence,
        vehicle_id: vehicleId,
        alert_id: alertId,
        booking_id: bookingId,
        execution_time_ms: executionTimeMs,
    };
}
