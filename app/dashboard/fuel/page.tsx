'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FuelEfficiency } from '@/components/dashboard/fuel-efficiency';
import { SensorReading } from '@/types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Leaf, TrendingUp, Calendar, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FuelPage() {
    const [sensorData, setSensorData] = useState<SensorReading[]>([]);
    const vehicleId = 'DEMO-VEH-001';

    const runSimulation = async (scenario: string) => {
        try {
            const res = await fetch('/api/simulation/run-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle_id: vehicleId, scenario })
            });
            const simData = await res.json();

            if (!simData.success || (simData.results && !simData.results.success)) {
                console.error('Simulation error:', simData);
                alert('Simulation failed: ' + (simData.error || simData.results?.error || 'Unknown error'));
                return;
            }

            // Refresh data immediately
            const response = await fetch(`/api/ingest?vehicle_id=${vehicleId}&limit=50`);
            const data = await response.json();
            if (data.success) {
                setSensorData(data.data);
            }
        } catch (error) {
            console.error('Simulation failed:', error);
        }
    };

    useEffect(() => {
        const fetchSensorData = async () => {
            const response = await fetch(`/api/ingest?vehicle_id=${vehicleId}&limit=50`);
            const data = await response.json();
            if (data.success) {
                setSensorData(data.data);
            }
        };

        fetchSensorData();
        // Poll every 5 seconds
        const interval = setInterval(fetchSensorData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Prepare Trend Data (Area Chart)
    const trendData = sensorData.slice().reverse().map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        mpg: reading.speed && reading.engine_rpm ? (reading.speed / reading.engine_rpm) * 1500 : 0,
        speed: reading.speed || 0
    }));

    // Mock Weekly Data (Bar Chart)
    const weeklyData = [
        { day: 'Mon', consumption: 4.2, efficiency: 28 },
        { day: 'Tue', consumption: 3.8, efficiency: 32 },
        { day: 'Wed', consumption: 4.5, efficiency: 26 },
        { day: 'Thu', consumption: 3.5, efficiency: 34 },
        { day: 'Fri', consumption: 5.1, efficiency: 24 },
        { day: 'Sat', consumption: 2.2, efficiency: 38 },
        { day: 'Sun', consumption: 1.8, efficiency: 40 },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                            Fuel Efficiency Analysis
                        </h1>
                        <p className="text-slate-400 mt-1">Detailed consumption and efficiency metrics</p>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                        Vehicle: {vehicleId}
                    </Badge>
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={() => runSimulation('FUEL_TRIP')}
                        className="bg-blue-900/30 hover:bg-blue-900/50 text-blue-200 border border-blue-800 flex items-center gap-2"
                    >
                        <PlayCircle className="h-4 w-4" />
                        Simulate Trip
                    </Button>
                </div>

                {/* Summary Cards (Reusing Component) */}
                <div className="grid grid-cols-1">
                    <FuelEfficiency data={sensorData} />
                </div>

                {/* Advanced Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* MPG Trend Area Chart */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-blue-400" />
                                Real-time Efficiency Trend
                            </CardTitle>
                            <CardDescription className="text-slate-400">MPG vs Speed over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorMpg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="time" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="mpg" stroke="#22c55e" fillOpacity={1} fill="url(#colorMpg)" name="MPG" />
                                        <Area type="monotone" dataKey="speed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpeed)" name="Speed (mph)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Consumption Bar Chart */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-orange-400" />
                                Weekly Consumption
                            </CardTitle>
                            <CardDescription className="text-slate-400">Fuel used (gallons) vs Avg Efficiency</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="day" stroke="#94a3b8" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#f97316" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="consumption" fill="#f97316" name="Fuel Used (gal)" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="efficiency" fill="#22c55e" name="Avg MPG" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
