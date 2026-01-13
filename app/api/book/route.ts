import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CreateBookingInput } from '@/types';

/**
 * GET /api/book
 * Fetch bookings for a vehicle
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabaseAdmin
            .from('bookings')
            .select('*')
            .order('scheduled_date', { ascending: false })
            .limit(limit);

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        if (status) {
            query = query.eq('status', status.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch bookings' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Bookings GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/book
 * Create a service booking
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateBookingInput = await request.json();

        if (!body.vehicle_id || !body.service_type || !body.scheduled_date || !body.scheduled_time) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate confirmation number
        const confirmationNumber = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .insert({
                vehicle_id: body.vehicle_id,
                alert_id: body.alert_id,
                service_type: body.service_type,
                scheduled_date: body.scheduled_date,
                scheduled_time: body.scheduled_time,
                service_center: body.service_center,
                customer_name: body.customer_name,
                customer_phone: body.customer_phone,
                customer_email: body.customer_email,
                issue_description: body.issue_description,
                special_instructions: body.special_instructions,
                estimated_duration: body.estimated_duration,
                estimated_cost: body.estimated_cost,
                confirmation_number: confirmationNumber,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create booking' },
                { status: 500 }
            );
        }

        // Log agent action
        await supabaseAdmin
            .from('agent_logs')
            .insert({
                vehicle_id: body.vehicle_id,
                agent_type: 'SCHEDULING',
                action: 'Service booking created',
                input_data: body,
                reasoning: 'User requested service booking',
                decision: { booking_id: data.id, confirmation_number: confirmationNumber },
                confidence_score: 1.0,
                booking_id: data.id
            });

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Booking created successfully',
            confirmation_number: confirmationNumber
        });

    } catch (error) {
        console.error('Bookings POST API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/book
 * Update booking status
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { booking_id, status, actual_cost } = body;

        if (!booking_id || !status) {
            return NextResponse.json(
                { success: false, error: 'booking_id and status are required' },
                { status: 400 }
            );
        }

        const updateData: any = { status };

        if (actual_cost !== undefined) {
            updateData.actual_cost = actual_cost;
        }

        const { data, error } = await supabaseAdmin
            .from('bookings')
            .update(updateData)
            .eq('id', booking_id)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update booking' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Booking updated successfully'
        });

    } catch (error) {
        console.error('Bookings PATCH API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
