'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Booking } from '@/types';
import { getStatusColor, formatDate } from '@/lib/utils';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function ServicePage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [formData, setFormData] = useState({
        service_type: '',
        scheduled_date: '',
        scheduled_time: '',
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        issue_description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const vehicleId = 'DEMO-VEH-001';

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        const response = await fetch(`/api/book?vehicle_id=${vehicleId}&limit=10`);
        const data = await response.json();
        if (data.success) {
            setBookings(data.data);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const response = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                ...formData
            })
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Booking confirmed! Confirmation #: ${data.confirmation_number}`);
            setFormData({
                service_type: '',
                scheduled_date: '',
                scheduled_time: '',
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                issue_description: ''
            });
            fetchBookings();
        }

        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-600 bg-clip-text text-transparent">
                        Service Booking
                    </h1>
                    <p className="text-slate-400 mt-1">Schedule maintenance and repairs</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Booking Form */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white">Book New Service</CardTitle>
                            <CardDescription className="text-slate-400">Fill out the form to schedule an appointment</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Service Type *</label>
                                    <Input
                                        required
                                        value={formData.service_type}
                                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                        placeholder="e.g., Oil Change, Brake Inspection"
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Date *</label>
                                        <Input
                                            required
                                            type="date"
                                            value={formData.scheduled_date}
                                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Time *</label>
                                        <Input
                                            required
                                            type="time"
                                            value={formData.scheduled_time}
                                            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Your Name</label>
                                    <Input
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                        placeholder="John Doe"
                                        className="bg-slate-800 border-slate-700 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Phone</label>
                                        <Input
                                            type="tel"
                                            value={formData.customer_phone}
                                            onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                                            placeholder="+1 234 567 8900"
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-400 mb-2 block">Email</label>
                                        <Input
                                            type="email"
                                            value={formData.customer_email}
                                            onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                                            placeholder="john@example.com"
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">Issue Description</label>
                                    <Textarea
                                        value={formData.issue_description}
                                        onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                                        placeholder="Describe the issue or service needed..."
                                        className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                >
                                    {isSubmitting ? 'Booking...' : 'Book Appointment'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Booking History */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white">Booking History</CardTitle>
                            <CardDescription className="text-slate-400">Your recent service appointments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {bookings.length === 0 ? (
                                    <p className="text-slate-400 text-sm text-center py-8">No bookings yet</p>
                                ) : (
                                    bookings.map(booking => (
                                        <div key={booking.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium text-white">{booking.service_type}</h4>
                                                    <Badge className={getStatusColor(booking.status)}>
                                                        {booking.status}
                                                    </Badge>
                                                </div>
                                                {booking.confirmation_number && (
                                                    <span className="text-xs text-slate-400">#{booking.confirmation_number}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {booking.scheduled_date}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {booking.scheduled_time}
                                                </div>
                                            </div>
                                            {booking.issue_description && (
                                                <p className="text-xs text-slate-500 mt-2">{booking.issue_description}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
