import { SensorReading } from '@/types';

/**
 * Mock Telematics API Client
 * Simulates fetching real-time data from a vehicle telematics system
 */

export interface TelematicsData {
    vehicle_id: string;
    timestamp: string;
    sensors: {
        engine_temp: number;
        engine_rpm: number;
        battery_voltage: number;
        fuel_level: number;
        speed: number;
        oil_pressure: number;
        tyre_pressure_fl: number;
        tyre_pressure_fr: number;
        tyre_pressure_rl: number;
        tyre_pressure_rr: number;
    };
}

export async function fetchTelematicsData(vehicleId: string): Promise<TelematicsData> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate realistic random data
    const baseTemp = 90;
    const baseRpm = 2000;
    const baseVoltage = 13.5;
    const baseOilPressure = 40; // PSI
    const baseTyrePressure = 32; // PSI

    // Add some noise
    const temp = baseTemp + (Math.random() * 10 - 5);
    const rpm = baseRpm + (Math.random() * 500 - 250);
    const voltage = baseVoltage + (Math.random() * 1 - 0.5);
    const fuel = 75 - (Math.random() * 5); // Slowly decreasing
    const speed = 60 + (Math.random() * 20 - 10);
    const oil = baseOilPressure + (Math.random() * 5 - 2.5);
    const tyre = baseTyrePressure + (Math.random() * 2 - 1);

    return {
        vehicle_id: vehicleId,
        timestamp: new Date().toISOString(),
        sensors: {
            engine_temp: parseFloat(temp.toFixed(1)),
            engine_rpm: Math.round(rpm),
            battery_voltage: parseFloat(voltage.toFixed(1)),
            fuel_level: Math.round(fuel),
            speed: Math.round(speed),
            oil_pressure: parseFloat(oil.toFixed(1)),
            tyre_pressure_fl: parseFloat(tyre.toFixed(1)),
            tyre_pressure_fr: parseFloat(tyre.toFixed(1)),
            tyre_pressure_rl: parseFloat(tyre.toFixed(1)),
            tyre_pressure_rr: parseFloat(tyre.toFixed(1))
        }
    };
}

/**
 * Fetch data with a specific scenario (e.g., for testing)
 */
export async function fetchScenarioData(vehicleId: string, scenario: 'NORMAL' | 'OVERHEAT' | 'BATTERY_LOW' | 'OIL_PRESSURE_LOW' | 'TYRE_PRESSURE_LOW'): Promise<TelematicsData> {
    const data = await fetchTelematicsData(vehicleId);

    if (scenario === 'OVERHEAT') {
        data.sensors.engine_temp = 125 + (Math.random() * 10);
    } else if (scenario === 'BATTERY_LOW') {
        data.sensors.battery_voltage = 11.2 - (Math.random() * 0.5);
    } else if (scenario === 'OIL_PRESSURE_LOW') {
        data.sensors.oil_pressure = 10 + (Math.random() * 5); // Critical low < 15 PSI
    } else if (scenario === 'TYRE_PRESSURE_LOW') {
        data.sensors.tyre_pressure_fl = 18 + (Math.random() * 2); // Flat tyre < 20 PSI
    }

    return data;
}
