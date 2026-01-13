import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SensorDataInput } from '@/types';

/**
 * POST /api/ingest
 * Receives vehicle sensor data and stores it in the database
 */
export async function POST(request: NextRequest) {
    try {
        const body: SensorDataInput = await request.json();

        // Validate required fields
        if (!body.vehicle_id) {
            return NextResponse.json(
                { success: false, error: 'vehicle_id is required' },
                { status: 400 }
            );
        }

        // Insert sensor reading
        const { data, error } = await supabaseAdmin
            .from('sensor_readings')
            .insert({
                vehicle_id: body.vehicle_id,
                engine_temp: body.engine_temp,
                engine_rpm: body.engine_rpm,
                engine_load: body.engine_load,
                battery_voltage: body.battery_voltage,
                battery_current: body.battery_current,
                fuel_level: body.fuel_level,
                fuel_pressure: body.fuel_pressure,
                transmission_temp: body.transmission_temp,
                gear_position: body.gear_position,
                tire_pressure_fl: body.tyre_pressure_fl,
                tire_pressure_fr: body.tyre_pressure_fr,
                tire_pressure_rl: body.tyre_pressure_rl,
                tire_pressure_rr: body.tyre_pressure_rr,
                coolant_temp: body.coolant_temp,
                oil_pressure: body.oil_pressure,
                speed: body.speed,
                odometer: body.odometer,
                raw_data: body.raw_data,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to store sensor data' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Sensor data ingested successfully'
        });

    } catch (error) {
        console.error('Ingest API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/ingest?vehicle_id=XXX&limit=10
 * Retrieve recent sensor readings for a vehicle
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!vehicleId) {
            return NextResponse.json(
                { success: false, error: 'vehicle_id parameter is required' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('sensor_readings')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch sensor data' },
                { status: 500 }
            );
        }

        // Map database 'tire' columns back to 'tyre' properties for the application
        const mappedData = data.map((reading: any) => ({
            ...reading,
            tyre_pressure_fl: reading.tire_pressure_fl,
            tyre_pressure_fr: reading.tire_pressure_fr,
            tyre_pressure_rl: reading.tire_pressure_rl,
            tyre_pressure_rr: reading.tire_pressure_rr,
            // Remove the old keys if desired, or keep them. Keeping them is safer for now but let's be clean.
            tire_pressure_fl: undefined,
            tire_pressure_fr: undefined,
            tire_pressure_rl: undefined,
            tire_pressure_rr: undefined,
        }));

        return NextResponse.json({
            success: true,
            data: mappedData,
            count: data.length
        });

    } catch (error) {
        console.error('Ingest GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
