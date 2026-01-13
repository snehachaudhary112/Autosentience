"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Battery,
  Thermometer,
  Gauge,
  Mic,
  MicOff,
} from "lucide-react";
import { Alert, SensorReading } from "@/types";
import { supabase } from "@/lib/supabase/client";
import { getSeverityColor, formatDate } from "@/lib/utils";
import { FuelEfficiency } from "@/components/dashboard/fuel-efficiency";

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestReading, setLatestReading] = useState<SensorReading | null>(
    null
  );
  const [isListening, setIsListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState("");
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const vehicleId = "DEMO-VEH-001";

  const runSimulation = async (scenario: string) => {
    setSimulationResult({ status: "Running simulation..." });
    try {
      const response = await fetch("/api/simulation/run-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle_id: vehicleId, scenario }),
      });
      const data = await response.json();
      setSimulationResult(data.results);
      // Refresh data to show new alerts
      fetchSensorData();
      fetchAlerts();
    } catch (error) {
      setSimulationResult({ error: "Simulation failed" });
    }
  };

  useEffect(() => {
    fetchSensorData();
    fetchAlerts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("sensor-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_readings" },
        () => {
          fetchSensorData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSensorData = async () => {
    const response = await fetch(
      `/api/ingest?vehicle_id=${vehicleId}&limit=20`
    );
    const data = await response.json();
    if (data.success) {
      setSensorData(data.data);
      setLatestReading(data.data[0]);
    }
  };

  const fetchAlerts = async () => {
    const response = await fetch(
      `/api/alerts?vehicle_id=${vehicleId}&status=OPEN&limit=5`
    );
    const data = await response.json();
    if (data.success) {
      setAlerts(data.data);
    }
  };

  const handleVoiceQuery = async () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceResponse("Listening...");
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceResponse(`You said: "${transcript}"`);

      // Send to voice API
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: transcript, vehicle_id: vehicleId }),
      });

      const data = await response.json();
      if (data.success) {
        setVoiceResponse(data.data.response);

        // Speak response
        const utterance = new SpeechSynthesisUtterance(data.data.response);
        window.speechSynthesis.speak(utterance);

        // Refresh data in case the voice command triggered a simulation or update
        fetchSensorData();
        fetchAlerts();
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceResponse("Error occurred. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Prepare chart data
  const chartData = sensorData
    .slice(0, 10)
    .reverse()
    .map((reading) => ({
      time: new Date(reading.timestamp).toLocaleTimeString(),
      temp: reading.engine_temp,
      rpm: reading.engine_rpm ? reading.engine_rpm / 100 : 0,
      battery: reading.battery_voltage,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              AutoSentience Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              AI-Powered Predictive Maintenance
            </p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            Vehicle: {vehicleId}
          </Badge>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Engine Temp
              </CardTitle>
              <Thermometer className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {latestReading?.engine_temp || "--"}°C
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Normal range: 85-95°C
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Engine RPM
              </CardTitle>
              <Gauge className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {latestReading?.engine_rpm || "--"}
              </div>
              <p className="text-xs text-slate-400 mt-1">Idle: 800-1000 RPM</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Battery
              </CardTitle>
              <Battery className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {latestReading?.battery_voltage || "--"}V
              </div>
              <p className="text-xs text-slate-400 mt-1">Healthy: 12.4-12.8V</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Active Alerts
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alerts.length}
              </div>
              <p className="text-xs text-slate-400 mt-1">Open issues</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Oil Pressure
              </CardTitle>
              <Activity className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {latestReading?.oil_pressure || "--"} PSI
              </div>
              <p className="text-xs text-slate-400 mt-1">Normal: 30-50 PSI</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Tyre Pressure
              </CardTitle>
              <Gauge className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {latestReading?.tyre_pressure_fl || "--"} PSI
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Front Left (Normal: 30-35)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sensor Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time vehicle metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temp"
                  stroke="#f97316"
                  name="Engine Temp (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="rpm"
                  stroke="#3b82f6"
                  name="RPM (x100)"
                />
                <Line
                  type="monotone"
                  dataKey="battery"
                  stroke="#22c55e"
                  name="Battery (V)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Agent Simulation
            </CardTitle>
            <CardDescription className="text-slate-400">
              Trigger AI agent workflows manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => runSimulation("OVERHEAT")}
                className="bg-red-900/30 hover:bg-red-900/50 text-red-200 border border-red-800"
              >
                Temp. Value
              </Button>
              <Button
                onClick={() => runSimulation("BATTERY_LOW")}
                className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-200 border border-yellow-800"
              >
                Battery Status
              </Button>
              {/* <Button
                onClick={() => runSimulation("NORMAL")}
                className="bg-green-900/30 hover:bg-green-900/50 text-green-200 border border-green-800"
              >
                Simulate Normal
              </Button> */}
              <Button
                onClick={() => runSimulation("OIL_PRESSURE_LOW")}
                className="bg-orange-900/30 hover:bg-orange-900/50 text-orange-200 border border-orange-800"
              >
                Oil Pressure
              </Button>
              <Button
                onClick={() => runSimulation("TYRE_PRESSURE_LOW")}
                className="bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-200 border border-yellow-800"
              >
                Tyre Pressure
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <Button
                onClick={() => runSimulation("RESET")}
                variant="outline"
                className="w-full border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                🔄 Reset System / Start New Drive
              </Button>
            </div>

            {simulationResult && (
              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-auto max-h-60">
                <pre>{JSON.stringify(simulationResult, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voice Interface & Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Interface */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-400" />
                Voice Assistant
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ask about your vehicle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleVoiceQuery}
                disabled={isListening}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isListening ? (
                  <MicOff className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                {isListening ? "Listening..." : "Start Voice Query"}
              </Button>
              {voiceResponse && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300">{voiceResponse}</p>
                </div>
              )}
              <div className="text-xs text-slate-500 space-y-1">
                <p>Try asking:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>"What's my engine temperature?"</li>
                  <li>"Do I have any alerts?"</li>
                  <li>"How's my battery?"</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Recent Alerts</CardTitle>
              <CardDescription className="text-slate-400">
                Latest system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    No active alerts. All systems normal.
                  </p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-sm font-medium text-white">
                              {alert.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {alert.recommended_action}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(alert.created_at)}
                          </p>
                        </div>
                      </div>
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
