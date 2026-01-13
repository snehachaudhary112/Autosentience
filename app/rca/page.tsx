'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Wrench, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AgentLog } from '@/types';

export default function RCAPage() {
    const [reports, setReports] = useState<AgentLog[]>([]);
    const vehicleId = 'DEMO-VEH-001';

    useEffect(() => {
        fetchRCAReports();
    }, []);

    const fetchRCAReports = async () => {
        const { supabase } = await import('@/lib/supabase/client');
        const { data } = await supabase
            .from('agent_logs')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .eq('agent_type', 'RCA')
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) setReports(data as any);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-600 bg-clip-text text-transparent">
                        Root Cause Analysis
                    </h1>
                    <p className="text-slate-400 mt-1">Detailed analysis and CAPA reports</p>
                </div>

                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                            <CardContent className="p-8 text-center">
                                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No RCA reports generated yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        reports.map(report => (
                            <Card key={report.id} className="bg-slate-900/50 border-slate-800 backdrop-blur">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Wrench className="h-5 w-5 text-orange-400" />
                                            <CardTitle className="text-white">CAPA Report</CardTitle>
                                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                                {report.input_data?.diagnosis?.fault_type || 'FAULT'}
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-slate-500">{formatDate(report.created_at)}</span>
                                    </div>
                                    <CardDescription className="text-slate-400">
                                        {report.input_data?.diagnosis?.diagnosis}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            Root Cause Analysis
                                        </h4>
                                        <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded">
                                            {report.reasoning}
                                        </p>
                                    </div>

                                    {report.decision?.design_improvement_suggestion && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-300">Design Improvement Suggestion</h4>
                                            <p className="text-sm text-green-400/80 bg-green-900/10 border border-green-500/20 p-3 rounded">
                                                {report.decision.design_improvement_suggestion}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
