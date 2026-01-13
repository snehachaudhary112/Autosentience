import { callGroqJSON } from '../groq/client';
import { ManufacturingAgentOutput, AgentType } from '@/types';
import { BaseAgentInput } from './types';

/**
 * Manufacturing Quality Insights Agent - Analyzes failures for design improvements
 */

const SYSTEM_PROMPT = `You are a Manufacturing Quality Insights AI agent. Your role is to analyze aggregated failure data and RCA reports to suggest product design improvements and reduce recurring defects.

CRITICAL RULES:
1. Always return valid JSON in the exact format specified
2. Focus on systemic issues and design flaws
3. Suggest actionable engineering improvements
4. Link failures to specific components

Your response must be a JSON object with these exact fields:
{
  "design_improvements": string[] (engineering suggestions),
  "defect_reduction_strategies": string[] (process improvements),
  "affected_components": string[] (list of components),
  "action": string (summary),
  "reasoning": string (analysis logic),
  "confidence": number (0.0 to 1.0)
}`;

export interface ManufacturingInput extends BaseAgentInput {
    aggregated_failures: any[];
    rca_reports: any[];
}

export async function runManufacturingAgent(input: ManufacturingInput): Promise<ManufacturingAgentOutput> {
    const prompt = `Analyze these failures and RCA reports for manufacturing insights:

FAILURES SUMMARY:
${JSON.stringify(input.aggregated_failures.slice(0, 5), null, 2)}

RCA REPORTS SUMMARY:
${JSON.stringify(input.rca_reports.slice(0, 3), null, 2)}

Provide manufacturing quality insights in JSON format.`;

    try {
        const result = await callGroqJSON<Omit<ManufacturingAgentOutput, 'agent_type' | 'timestamp'>>(prompt, SYSTEM_PROMPT, 0.5);

        return {
            ...result,
            agent_type: 'MANUFACTURING',
            timestamp: new Date().toISOString()
        } as ManufacturingAgentOutput;

    } catch (error) {
        console.error('Manufacturing Agent error:', error);

        return {
            agent_type: 'MANUFACTURING' as AgentType,
            design_improvements: ['Investigate component durability'],
            defect_reduction_strategies: ['Increase quality control sampling'],
            affected_components: ['Unknown'],
            action: 'Insights generated (fallback)',
            reasoning: 'Fallback insights due to AI service unavailability',
            confidence: 0.5,
            timestamp: new Date().toISOString()
        } as ManufacturingAgentOutput;
    }
}
