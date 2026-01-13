'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SensorReading } from '@/types';
import { Leaf, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface FuelEfficiencyProps {
    data: SensorReading[];
}

export function FuelEfficiency({ data }: FuelEfficiencyProps) {
    const stats = useMemo(() => {
        if (!data.length) {
            return {
                currentMpg: 0,
                avgMpg: 0,
                ecoScore: 0,
                history: []
            };
        }

        // Calculate average MPG (simulated based on speed/rpm)
        // Formula: (Speed / RPM) * Constant (simplified)
        const recentReadings = data.slice(0, 20);
        const mpgReadings = recentReadings.map(r => {
            const mpg = r.speed && r.engine_rpm ? (r.speed / r.engine_rpm) * 1500 : 0;
            return {
                time: new Date(r.timestamp).toLocaleTimeString(),
                value: Math.min(Math.max(mpg, 0), 99) // Clamp between 0-99
            };
        }).reverse();

        const currentMpg = mpgReadings[mpgReadings.length - 1]?.value || 0;
        const avgMpg = mpgReadings.reduce((acc, curr) => acc + curr.value, 0) / mpgReadings.length;

        // Eco Score (0-100)
        // Higher is better. Penalize high RPM, rapid acceleration (not tracked here but implied by variance)
        const ecoScore = Math.min(100, Math.max(0,
            100 - (data[0].engine_rpm ? (data[0].engine_rpm - 2000) / 50 : 0)
        ));

        return {
            currentMpg,
            avgMpg,
            ecoScore,
            history: mpgReadings
        };
    }, [data]);

    if (!stats) return null;

    return (
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur col-span-1 md:col-span-2">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-400" />
                    Fuel Efficiency Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase font-semibold">Current MPG</p>
                        <div className="text-2xl font-bold text-white mt-1">
                            {stats.currentMpg.toFixed(1)}
                        </div>
                        <div className="flex items-center text-xs mt-1 text-slate-400">
                            {stats.currentMpg > stats.avgMpg ? (
                                <TrendingUp className="h-3 w-3 text-green-400 mr-1" />
                            ) : (
                                <TrendingDown className="h-3 w-3 text-red-400 mr-1" />
                            )}
                            vs avg
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase font-semibold">Eco Score</p>
                        <div className="text-2xl font-bold text-white mt-1">
                            {stats.ecoScore.toFixed(0)}<span className="text-sm text-slate-500">/100</span>
                        </div>
                        <div className="w-full bg-slate-700 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${stats.ecoScore > 80 ? 'bg-green-500' : stats.ecoScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${stats.ecoScore}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-slate-400 text-xs uppercase font-semibold">Est. Range</p>
                        <div className="text-2xl font-bold text-white mt-1">
                            {((data[0]?.fuel_level || 0) * (stats.avgMpg / 3)).toFixed(0)} <span className="text-sm text-slate-500">mi</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            {data[0]?.fuel_level || 0}% fuel remaining
                        </p>
                    </div>
                </div>

                <div className="h-[200px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.history}>
                            <defs>
                                <linearGradient id="colorMpgSpark" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, 60]} hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#22c55e"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorMpgSpark)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
