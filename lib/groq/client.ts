import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable');
}

/**
 * Groq AI client for Llama 3.1 70B
 */
export const groq = new Groq({
    apiKey: apiKey,
});

/**
 * Default model configuration
 */
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Helper function to call Groq with retry logic
 */
export async function callGroq(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.7,
    maxRetries: number = 3
): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const messages: any[] = [];

            if (systemPrompt) {
                messages.push({
                    role: 'system',
                    content: systemPrompt
                });
            }

            messages.push({
                role: 'user',
                content: prompt
            });

            const completion = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: messages,
                temperature: temperature,
                max_tokens: 2048,
            });

            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            lastError = error as Error;
            console.error(`Groq API attempt ${attempt + 1} failed:`, error);

            // Wait before retrying (exponential backoff)
            if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }
    }

    throw new Error(`Groq API failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Helper function to call Groq and parse JSON response
 */
export async function callGroqJSON<T = any>(
    prompt: string,
    systemPrompt?: string,
    temperature: number = 0.5
): Promise<T> {
    const response = await callGroq(prompt, systemPrompt, temperature);

    try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
        const jsonString = jsonMatch ? jsonMatch[1] : response;

        return JSON.parse(jsonString.trim());
    } catch (error) {
        console.error('Failed to parse Groq JSON response:', response);
        throw new Error('Invalid JSON response from Groq');
    }
}
