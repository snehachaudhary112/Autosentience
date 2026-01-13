import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { runEngagementAgent } from '@/lib/agents/engagement';
import { VoiceQuery } from '@/types';

/**
 * POST /api/voice
 * Handle voice queries from browser or phone
 */
export async function POST(request: NextRequest) {
    try {
        const body: VoiceQuery = await request.json();

        if (!body.query) {
            return NextResponse.json(
                { success: false, error: 'query is required' },
                { status: 400 }
            );
        }

        const vehicleId = body.vehicle_id || 'DEMO-VEH-001';
        const sessionId = body.session_id || `session-${Date.now()}`;

        // Determine intent from query
        const query = body.query.toLowerCase();
        let response = '';
        let actionTaken = '';

        console.log(`[Voice API] Received query: "${query}"`);

        // Simple intent detection
        if (query.includes('simulate') || query.includes('stimulate') || query.includes('trigger') || query.includes('test') || query.includes('start')) {
            // SIMULATION COMMANDS
            const { runSimulationScenario } = await import('@/lib/simulation/runner');
            let scenario = '';
            let scenarioName = '';

            if (query.includes('overheat') || query.includes('temp')) {
                scenario = 'OVERHEAT';
                scenarioName = 'Engine Overheat';
            } else if (query.includes('battery')) {
                scenario = 'BATTERY_LOW';
                scenarioName = 'Low Battery';
            } else if (query.includes('oil')) {
                scenario = 'OIL_PRESSURE_LOW';
                scenarioName = 'Low Oil Pressure';
            } else if (query.includes('tyre') || query.includes('flat')) {
                scenario = 'TYRE_PRESSURE_LOW';
                scenarioName = 'Flat Tyre';
            } else if (query.includes('reset') || query.includes('normal')) {
                scenario = 'RESET';
                scenarioName = 'System Reset';
            }

            if (scenario) {
                // Run the simulation
                await runSimulationScenario(vehicleId, scenario);
                response = `Initiating ${scenarioName} simulation now. Watch the dashboard for updates.`;
                actionTaken = `Triggered simulation: ${scenario}`;
            } else {
                response = 'I can simulate Overheat, Low Battery, Low Oil, or Flat Tyre. Which one would you like to test?';
            }

        } else if (query.includes('temperature') || query.includes('temp')) {
            // Get latest sensor data
            const { data: sensorData } = await supabaseAdmin
                .from('sensor_readings')
                .select('engine_temp, coolant_temp')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (sensorData) {
                response = `Your engine temperature is currently ${sensorData.engine_temp?.toFixed(1)}°C. Normal range is 85 to 95 degrees.`;
                actionTaken = 'Provided temperature status';
            } else {
                response = 'I couldn\'t retrieve the temperature data at the moment.';
            }
        } else if (query.includes('oil')) {
            const { data: sensorData } = await supabaseAdmin
                .from('sensor_readings')
                .select('oil_pressure')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (sensorData) {
                const oil = sensorData.oil_pressure;
                const status = oil && oil > 30 ? 'normal' : 'low';
                response = `Oil pressure is ${oil?.toFixed(1)} PSI. This is ${status}. ${status === 'low' ? 'Please check your oil levels immediately.' : ''}`;
                actionTaken = 'Provided oil status';
            }
        } else if (query.includes('tire') || query.includes('tyre')) {
            const { data: sensorData } = await supabaseAdmin
                .from('sensor_readings')
                .select('tyre_pressure_fl, tyre_pressure_fr, tyre_pressure_rl, tyre_pressure_rr')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (sensorData) {
                const fl = sensorData.tyre_pressure_fl;
                const lowest = Math.min(fl || 32, sensorData.tyre_pressure_fr || 32, sensorData.tyre_pressure_rl || 32, sensorData.tyre_pressure_rr || 32);
                const status = lowest > 28 ? 'good' : 'low';
                response = `Tyre pressures are ${status}. The lowest reading is ${lowest.toFixed(1)} PSI. ${status === 'low' ? 'Please inspect your tyres.' : 'All tyres are properly inflated.'}`;
                actionTaken = 'Provided tyre status';
            }
        } else if (query.includes('check') || query.includes('status') || query.includes('report') || query.includes('how is my car')) {
            // FULL VEHICLE CHECK
            const { data: sensorData } = await supabaseAdmin
                .from('sensor_readings')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            const { data: alerts } = await supabaseAdmin
                .from('alerts')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .eq('status', 'OPEN');

            if (sensorData) {
                const alertCount = alerts?.length || 0;
                const temp = sensorData.engine_temp;
                const oil = sensorData.oil_pressure;
                const tire = sensorData.tyre_pressure_fl;

                let healthSummary = 'All systems are nominal.';
                if (alertCount > 0) healthSummary = `Attention needed. You have ${alertCount} active alerts.`;
                else if (temp > 105) healthSummary = 'Warning: Engine temperature is high.';
                else if (oil < 20) healthSummary = 'Critical: Oil pressure is low.';
                else if (tire < 25) healthSummary = 'Alert: Tyre pressure is low.';

                response = `Vehicle Status Report: ${healthSummary} Engine Temp is ${temp?.toFixed(0)} degrees. Battery is ${sensorData.battery_voltage?.toFixed(1)} volts. Oil pressure is ${oil?.toFixed(0)} PSI.`;
                actionTaken = 'Provided full vehicle status report';
            } else {
                response = 'Unable to run diagnostics at this time. No sensor data available.';
            }
        } else if (query.includes('alert') || query.includes('issue') || query.includes('problem')) {
            // Get latest alerts
            const { data: alerts } = await supabaseAdmin
                .from('alerts')
                .select('*')
                .eq('vehicle_id', vehicleId)
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false })
                .limit(3);

            if (alerts && alerts.length > 0) {
                response = `You have ${alerts.length} open alert${alerts.length > 1 ? 's' : ''}. The most recent is: ${alerts[0].title}. ${alerts[0].recommended_action}`;
                actionTaken = 'Listed open alerts';
            } else {
                response = 'Great news! You have no open alerts. Your vehicle is running smoothly.';
                actionTaken = 'Confirmed no alerts';
            }
        } else if (query.includes('book') || query.includes('appointment') || query.includes('service')) {
            response = 'I can help you book a service appointment. What type of service do you need? You can say things like "oil change", "brake inspection", or "general maintenance".';
            actionTaken = 'Initiated booking conversation';
        } else if (query.includes('battery')) {
            const { data: sensorData } = await supabaseAdmin
                .from('sensor_readings')
                .select('battery_voltage')
                .eq('vehicle_id', vehicleId)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (sensorData) {
                const voltage = sensorData.battery_voltage;
                const status = voltage && voltage > 12.4 ? 'good' : voltage && voltage > 12.0 ? 'fair' : 'low';
                response = `Your battery voltage is ${voltage?.toFixed(1)}V, which is ${status}. ${status === 'low' ? 'You may want to have it checked soon.' : 'Everything looks normal.'}`;
                actionTaken = 'Provided battery status';
            } else {
                response = 'I couldn\'t retrieve battery data at the moment.';
            }
        } else {
            // Generic response
            response = 'I can help you with information about your vehicle\'s temperature, oil, tyres, alerts, or perform a full system check. Just ask "Check my car".';
            actionTaken = 'Provided help menu';
        }

        // Log voice interaction
        await supabaseAdmin
            .from('voice_logs')
            .insert({
                vehicle_id: vehicleId,
                interaction_type: 'BROWSER',
                user_query: body.query,
                agent_response: response,
                session_id: sessionId,
                conversation_context: body.context
            });

        return NextResponse.json({
            success: true,
            data: {
                response,
                action_taken: actionTaken,
                session_id: sessionId
            }
        });

    } catch (error) {
        console.error('Voice API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/voice
 * Fetch voice interaction history
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const sessionId = searchParams.get('session_id');
        const limit = parseInt(searchParams.get('limit') || '10');

        let query = supabaseAdmin
            .from('voice_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        if (sessionId) {
            query = query.eq('session_id', sessionId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch voice logs' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Voice GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
