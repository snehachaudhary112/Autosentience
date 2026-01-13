import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CreateAlertInput, AlertStatus } from '@/types';

/**
 * GET /api/alerts
 * Fetch alerts with optional filtering
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const vehicleId = searchParams.get('vehicle_id');
        const severity = searchParams.get('severity');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabaseAdmin
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        if (severity) {
            query = query.eq('severity', severity.toUpperCase());
        }

        if (status) {
            query = query.eq('status', status.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch alerts' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            count: data.length
        });

    } catch (error) {
        console.error('Alerts GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateAlertInput = await request.json();

        if (!body.vehicle_id || !body.alert_type || !body.severity || !body.title) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('alerts')
            .insert({
                vehicle_id: body.vehicle_id,
                alert_type: body.alert_type,
                severity: body.severity,
                title: body.title,
                description: body.description,
                diagnosis: body.diagnosis,
                recommended_action: body.recommended_action,
                estimated_cost: body.estimated_cost,
                sensor_reading_id: body.sensor_reading_id,
                metadata: body.metadata,
                status: 'OPEN'
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to create alert' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Alert created successfully'
        });

    } catch (error) {
        console.error('Alerts POST API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/alerts
 * Update alert status
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { alert_id, status } = body;

        if (!alert_id || !status) {
            return NextResponse.json(
                { success: false, error: 'alert_id and status are required' },
                { status: 400 }
            );
        }

        const validStatuses: AlertStatus[] = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status value' },
                { status: 400 }
            );
        }

        const updateData: any = { status };

        if (status === 'ACKNOWLEDGED' || status === 'IN_PROGRESS') {
            updateData.acknowledged_at = new Date().toISOString();
        }

        if (status === 'RESOLVED' || status === 'CLOSED') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabaseAdmin
            .from('alerts')
            .update(updateData)
            .eq('id', alert_id)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update alert' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Alert updated successfully'
        });

    } catch (error) {
        console.error('Alerts PATCH API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/alerts
 * Delete (archive) an alert
 */
export async function DELETE(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const alertId = searchParams.get('alert_id');

        if (!alertId) {
            return NextResponse.json(
                { success: false, error: 'alert_id parameter is required' },
                { status: 400 }
            );
        }

        // Soft delete by setting status to CLOSED
        const { data, error } = await supabaseAdmin
            .from('alerts')
            .update({ status: 'CLOSED', resolved_at: new Date().toISOString() })
            .eq('id', alertId)
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete alert' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: 'Alert archived successfully'
        });

    } catch (error) {
        console.error('Alerts DELETE API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
