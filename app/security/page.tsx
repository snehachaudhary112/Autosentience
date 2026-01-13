'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface UEBALog {
    id: string;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    risk_score: number;
    anomaly_detected: boolean;
    event_type: string;
    created_at: string;
    metadata: { reasoning: string };
}

export default function SecurityPage() {
    const [logs, setLogs] = useState<UEBALog[]>([]);
    const vehicleId = 'DEMO-VEH-001';

    useEffect(() => {
        fetchSecurityLogs();
    }, []);

    const fetchSecurityLogs = async () => {
        const { supabase } = await import('@/lib/supabase/client');
        const { data } = await supabase
            .from('ueba_logs')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) setLogs(data as any);
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'HIGH': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            default: return 'bg-green-500/10 text-green-500 border-green-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-pink-600 bg-clip-text text-transparent">
                        Security Monitoring
                    </h1>
                    <p className="text-slate-400 mt-1">UEBA and anomaly detection</p>
                </div>

                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                            <CardContent className="p-8 text-center">
                                <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No security events detected yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        logs.map(log => (
                            <Card key={log.id} className="bg-slate-900/50 border-slate-800 backdrop-blur">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {log.risk_level === 'CRITICAL' || log.risk_level === 'HIGH' ? (
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            ) : (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            )}
                                            <CardTitle className="text-white">{log.event_type}</CardTitle>
                                            <Badge className={getRiskColor(log.risk_level)}>
                                                {log.risk_level} RISK
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-400">Risk Score:</span>
                                            <span className="text-white font-mono">{log.risk_score}/100</span>
                                        </div>
                                        {log.metadata?.reasoning && (
                                            <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded">
                                                {log.metadata.reasoning}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
