import { executeAgentWorkflow } from '@/lib/agents/master';
import { SensorReading, RuleViolation } from '@/types';
import { fetchScenarioData } from '@/lib/telematics/client';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function runSimulationScenario(vehicleId: string, scenario: string) {
    // If RESET, we fetch NORMAL data but also clear alerts
    const effectiveScenario = scenario === 'RESET' ? 'NORMAL' : scenario;
    const telematicsData = await fetchScenarioData(vehicleId, effectiveScenario as any);

    // If RESET, resolve all open alerts
    if (scenario === 'RESET') {
        await supabaseAdmin
            .from('alerts')
            .update({ status: 'RESOLVED', resolved_at: new Date().toISOString() })
            .eq('vehicle_id', vehicleId)
            .eq('status', 'OPEN');

        // Also clear sensor readings to restart the journey
        await supabaseAdmin
            .from('sensor_readings')
            .delete()
            .eq('vehicle_id', vehicleId);
    }

    // Handle FUEL_TRIP scenario: Generate a batch of data points
    if (scenario === 'FUEL_TRIP') {
        const batchData = [];
        const now = Date.now();

        // Generate 20 points representing a short trip
        for (let i = 0; i < 20; i++) {
            const timeOffset = (20 - i) * 5000; // 5 seconds apart
            const speed = 20 + Math.random() * 40; // 20-60 mph
            const rpm = 1500 + Math.random() * 1500; // 1500-3000 rpm

            batchData.push({
                vehicle_id: vehicleId,
                timestamp: new Date(now - timeOffset).toISOString(),
                engine_temp: 90 + Math.random() * 5,
                engine_rpm: rpm,
                battery_voltage: 13.5 + Math.random() * 0.5,
                fuel_level: 70 - (i * 0.1), // Decreasing fuel
                speed: speed,
                oil_pressure: 35 + Math.random() * 5,
                tire_pressure_fl: 32,
                tire_pressure_fr: 32,
                tire_pressure_rl: 32,
                tire_pressure_rr: 32,
                created_at: new Date(now - timeOffset).toISOString()
            });
        }

        const { error } = await supabaseAdmin.from('sensor_readings').insert(batchData);
        if (error) console.error('Error inserting fuel trip data:', error);

        return { success: true, message: 'Fuel trip simulated' };
    }

    const sensorData: SensorReading = {
        id: 'sim-sensor-' + Date.now(),
        vehicle_id: telematicsData.vehicle_id,
        timestamp: telematicsData.timestamp,
        engine_temp: telematicsData.sensors.engine_temp,
        engine_rpm: telematicsData.sensors.engine_rpm,
        battery_voltage: telematicsData.sensors.battery_voltage,
        fuel_level: telematicsData.sensors.fuel_level,
        speed: telematicsData.sensors.speed,
        oil_pressure: telematicsData.sensors.oil_pressure,
        tyre_pressure_fl: telematicsData.sensors.tyre_pressure_fl,
        tyre_pressure_fr: telematicsData.sensors.tyre_pressure_fr,
        tyre_pressure_rl: telematicsData.sensors.tyre_pressure_rl,
        tyre_pressure_rr: telematicsData.sensors.tyre_pressure_rr,
        created_at: new Date().toISOString()
    };

    console.log(`[Simulation] Scenario: ${scenario}, Generated Temp: ${sensorData.engine_temp}, Oil: ${sensorData.oil_pressure}`);

    // Exclude 'id' from insert so Postgres generates a valid UUID
    // Exclude 'id' from insert so Postgres generates a valid UUID
    // Map 'tyre' properties to 'tire' columns for database compatibility
    const { id, tyre_pressure_fl, tyre_pressure_fr, tyre_pressure_rl, tyre_pressure_rr, ...rest } = sensorData;

    const insertData = {
        ...rest,
        tire_pressure_fl: tyre_pressure_fl,
        tire_pressure_fr: tyre_pressure_fr,
        tire_pressure_rl: tyre_pressure_rl,
        tire_pressure_rr: tyre_pressure_rr
    };

    console.log('[Simulation] Inserting sensor data...');
    const { error: insertError } = await supabaseAdmin.from('sensor_readings').insert(insertData);

    if (insertError) {
        console.error('Error inserting simulated data:', insertError);
        return { success: false, error: 'Failed to insert sensor data: ' + insertError.message };
    }
    console.log('[Simulation] Sensor data inserted.');

    let violations: RuleViolation[] = [];

    // Rule Engine Logic
    if (sensorData.engine_temp && sensorData.engine_temp > 110) {
        violations.push({
            rule_name: 'Engine Temp Check',
            parameter: 'engine_temp',
            current_value: sensorData.engine_temp,
            threshold: 110,
            severity: 'CRITICAL',
            message: `Engine temperature critical: ${sensorData.engine_temp.toFixed(1)}°C`
        });
    }

    if (sensorData.battery_voltage && sensorData.battery_voltage < 11.5) {
        violations.push({
            rule_name: 'Battery Voltage Check',
            parameter: 'battery_voltage',
            current_value: sensorData.battery_voltage,
            threshold: 11.5,
            severity: 'HIGH',
            message: `Battery voltage low: ${sensorData.battery_voltage.toFixed(1)}V`
        });
    }

    if (sensorData.oil_pressure && sensorData.oil_pressure < 15) {
        violations.push({
            rule_name: 'Oil Pressure Check',
            parameter: 'oil_pressure',
            current_value: sensorData.oil_pressure,
            threshold: 15,
            severity: 'CRITICAL',
            message: `Oil pressure critically low: ${sensorData.oil_pressure.toFixed(1)} PSI`
        });
    }

    if (sensorData.tyre_pressure_fl && sensorData.tyre_pressure_fl < 25) {
        violations.push({
            rule_name: 'Tyre Pressure Check',
            parameter: 'tyre_pressure_fl',
            current_value: sensorData.tyre_pressure_fl,
            threshold: 25,
            severity: 'MEDIUM',
            message: `Low tyre pressure (FL): ${sensorData.tyre_pressure_fl.toFixed(1)} PSI`
        });
    }

    // Execute the full workflow
    console.log('[Simulation] Executing Agent Workflow...');
    try {
        const results = await executeAgentWorkflow({
            vehicle_id: vehicleId,
            sensor_data: sensorData,
            violations: violations,
            existing_alerts: []
        });
        console.log('[Simulation] Agent Workflow complete.');
        return results;
    } catch (agentError: any) {
        console.error('[Simulation] Agent Workflow failed:', agentError);
        throw new Error('Agent Workflow failed: ' + agentError.message);
    }
}
