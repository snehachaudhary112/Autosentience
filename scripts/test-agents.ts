import { SensorReading, RuleViolation } from '@/types';
import fs from 'fs';
import path from 'path';

// Manually load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    console.log('Loading env from:', envPath);
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
        console.log('Env loaded. GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
    } else {
        console.error('.env.local not found at:', envPath);
    }
} catch (error) {
    console.error('Error loading .env.local:', error);
}

async function runTest() {
    console.log('Starting Agent Workflow Test...');

    // Dynamic import to ensure env is loaded first
    const { executeAgentWorkflow } = await import('../lib/agents/master');
    const { fetchScenarioData } = await import('../lib/telematics/client');

    // Fetch data from "Telematics API"
    console.log('Fetching data from Telematics API...');
    const telematicsData = await fetchScenarioData('test-vehicle-001', 'OVERHEAT');
    console.log('Received Telematics Data:', JSON.stringify(telematicsData, null, 2));

    const sensorData: SensorReading = {
        id: 'test-sensor-id',
        vehicle_id: telematicsData.vehicle_id,
        timestamp: telematicsData.timestamp,
        engine_temp: telematicsData.sensors.engine_temp,
        engine_rpm: telematicsData.sensors.engine_rpm,
        battery_voltage: telematicsData.sensors.battery_voltage,
        fuel_level: telematicsData.sensors.fuel_level,
        speed: telematicsData.sensors.speed,
        created_at: new Date().toISOString()
    };

    const violations: RuleViolation[] = [];

    // Simple rule check (normally done by Rule Detection module)
    if (sensorData.engine_temp && sensorData.engine_temp > 110) {
        violations.push({
            rule_name: 'Engine Temp Check',
            parameter: 'engine_temp',
            current_value: sensorData.engine_temp,
            threshold: 110,
            severity: 'CRITICAL',
            message: `Engine temperature critical: ${sensorData.engine_temp}°C`
        });
    }

    try {
        const results = await executeAgentWorkflow({
            vehicle_id: 'test-vehicle-001',
            sensor_data: sensorData,
            violations: violations,
            existing_alerts: []
        });

        console.log('\n--- WORKFLOW RESULTS ---');
        console.log(JSON.stringify(results, null, 2));

        // Basic assertions
        if (results.data_analysis && results.master_decision && results.diagnosis) {
            console.log('\n✅ SUCCESS: All core agents executed.');
        } else {
            console.log('\n❌ FAILURE: Missing agent results.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error);
    }
}

runTest();
