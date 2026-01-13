import { callGroqJSON } from '../groq/client';
import { DataAnalysisAgentOutput, SensorReading, AgentType } from '@/types';
import { BaseAgentInput } from './types';

/**
 * Data Analysis Agent - Analyzes streaming data and maintenance history
 */

const SYSTEM_PROMPT = `You are an expert automotive data analysis AI agent. Your role is to analyze real-time sensor data and historical trends to detect anomalies and forecast needs.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Detect subtle patterns indicating early failure signs
3. Forecast service demand based on usage patterns
4. Be precise with anomaly detection

Your response must be a JSON object with these exact fields:
{
  "anomalies_detected": boolean,
  "predicted_maintenance_needs": string[] (list of likely upcoming issues),
  "demand_forecast": [
    {
      "service_type": string,
      "predicted_volume": "low" | "medium" | "high",
      "timeframe": string
    }
  ],
  "action": string (summary),
  "reasoning": string (analysis logic),
  "confidence": number (0.0 to 1.0)
}`;

export interface DataAnalysisInput extends BaseAgentInput {
    sensor_data: SensorReading;
    maintenance_history: any[]; // Placeholder for history type
}

export async function runDataAnalysisAgent(input: DataAnalysisInput): Promise<DataAnalysisAgentOutput> {
    const prompt = `Analyze this vehicle data for anomalies and forecast needs:

VEHICLE ID: ${input.vehicle_id}

SENSOR DATA:
${JSON.stringify(input.sensor_data, null, 2)}

MAINTENANCE HISTORY SUMMARY:
${JSON.stringify(input.maintenance_history.slice(0, 5), null, 2)}

Provide data analysis and forecasting in JSON format.`;

    try {
        const result = await callGroqJSON<Omit<DataAnalysisAgentOutput, 'agent_type' | 'timestamp'>>(prompt, SYSTEM_PROMPT, 0.4);

        return {
            ...result,
            agent_type: 'DATA_ANALYSIS',
            timestamp: new Date().toISOString()
        } as DataAnalysisAgentOutput;

    } catch (error) {
        console.error('Data Analysis Agent error:', error);

        // Fallback
        return {
            agent_type: 'DATA_ANALYSIS' as AgentType,
            anomalies_detected: false,
            predicted_maintenance_needs: [],
            demand_forecast: [],
            action: 'Data analysis completed (fallback)',
            reasoning: 'Fallback analysis due to AI service unavailability',
            confidence: 0.5,
            timestamp: new Date().toISOString()
        } as DataAnalysisAgentOutput;
    }
}
