import { callGroqJSON } from '../groq/client';
import { SchedulingAgentOutput, Alert } from '@/types';

/**
 * Scheduling Agent - Handles service appointment booking logic
 */

const SYSTEM_PROMPT = `You are an intelligent scheduling AI agent for automotive service appointments. Your role is to determine if a service booking is needed and suggest optimal timing.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Consider severity when recommending booking urgency
3. Suggest realistic timeframes
4. Estimate service duration based on issue type
5. Only recommend booking if truly necessary

Your response must be a JSON object with these exact fields:
{
  "booking_recommended": boolean,
  "urgency": "immediate" | "within_24h" | "within_week" | "routine",
  "suggested_dates": string[] (ISO date strings, next 3-5 available slots),
  "service_type": string (e.g., "Engine Inspection", "Battery Replacement"),
  "estimated_duration": number (minutes),
  "action": string (summary),
  "reasoning": string (why booking is/isn't recommended),
  "confidence": number (0.0 to 1.0)
}`;

export interface SchedulingInput {
    vehicle_id: string;
    alert: Alert;
    current_date?: Date;
}

export async function runSchedulingAgent(input: SchedulingInput): Promise<SchedulingAgentOutput> {
    const currentDate = input.current_date || new Date();

    const prompt = `Determine if service booking is needed for this alert:

VEHICLE ID: ${input.vehicle_id}
ALERT: ${input.alert.title}
SEVERITY: ${input.alert.severity}
DIAGNOSIS: ${input.alert.diagnosis}
RECOMMENDED ACTION: ${input.alert.recommended_action}
CURRENT DATE: ${currentDate.toISOString()}

Provide scheduling recommendation in JSON format.`;

    try {
        const result = await callGroqJSON<SchedulingAgentOutput>(prompt, SYSTEM_PROMPT, 0.5);

        if (result.booking_recommended === undefined) {
            throw new Error('Invalid response from Scheduling Agent');
        }

        return result;
    } catch (error) {
        console.error('Scheduling Agent error:', error);

        // Fallback logic
        const needsBooking = ['HIGH', 'CRITICAL'].includes(input.alert.severity);
        const suggestedDates: string[] = [];

        if (needsBooking) {
            // Generate next 3 business days
            for (let i = 1; i <= 3; i++) {
                const date = new Date(currentDate);
                date.setDate(date.getDate() + i);
                suggestedDates.push(date.toISOString().split('T')[0]);
            }
        }

        return {
            booking_recommended: needsBooking,
            suggested_dates: suggestedDates,
            service_type: input.alert.alert_type.replace(/_/g, ' '),
            estimated_duration: 60,
            action: needsBooking ? 'Service booking recommended' : 'Monitoring recommended',
            reasoning: 'Fallback scheduling logic due to AI service unavailability',
            confidence: 0.6
        };
    }
}
