'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { Activity, Brain, Zap } from 'lucide-react';

export default function AgentLogsPage() {
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const vehicleId = 'DEMO-VEH-001';

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const response = await fetch(`/api/agent?vehicle_id=${vehicleId}&limit=20`);
        const data = await response.json();
        if (data.success) {
            setLogs(data.data);
        }
    };

    const getAgentColor = (agentType: string) => {
        const colors: Record<string, string> = {
            MASTER: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            DIAGNOSIS: 'bg-red-500/10 text-red-500 border-red-500/20',
            ENGAGEMENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            SCHEDULING: 'bg-green-500/10 text-green-500 border-green-500/20',
            RCA: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            UEBA: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        };
        return colors[agentType] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        AI Agent Logs
                    </h1>
                    <p className="text-slate-400 mt-1">Decision trace and reasoning from AI agents</p>
                </div>

                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
                            <CardContent className="p-8 text-center">
                                <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                                <p className="text-slate-400">No agent logs available yet.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        logs.map(log => (
                            <Card key={log.id} className="bg-slate-900/50 border-slate-800 backdrop-blur">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Activity className="h-5 w-5 text-purple-400" />
                                            <CardTitle className="text-white">{log.action}</CardTitle>
                                            <Badge className={getAgentColor(log.agent_type)}>
                                                {log.agent_type}
                                            </Badge>
                                            {log.confidence_score && (
                                                <Badge variant="outline" className="text-blue-400 border-blue-400">
                                                    {(log.confidence_score * 100).toFixed(0)}% confidence
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">{formatDate(log.created_at)}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {log.reasoning && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-400 mb-1">Reasoning</h4>
                                            <p className="text-sm text-slate-300">{log.reasoning}</p>
                                        </div>
                                    )}
                                    {log.decision && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-400 mb-1">Decision</h4>
                                            <pre className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded overflow-x-auto">
                                                {JSON.stringify(log.decision, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    {log.execution_time_ms && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Zap className="h-3 w-3" />
                                            Executed in {log.execution_time_ms}ms
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
