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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertSeverity, AlertStatus } from "@/types";
import {
  getSeverityColor,
  getStatusColor,
  formatDate,
  formatCurrency,
} from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const vehicleId = "DEMO-VEH-001";

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, severityFilter, statusFilter]);

  const fetchAlerts = async () => {
    const response = await fetch(
      `/api/alerts?vehicle_id=${vehicleId}&limit=50`
    );
    const data = await response.json();
    if (data.success) {
      setAlerts(data.data);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (severityFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.severity === severityFilter.toUpperCase()
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (a) => a.status === statusFilter.toUpperCase()
      );
    }

    setFilteredAlerts(filtered);
  };

  const updateAlertStatus = async (alertId: string, newStatus: AlertStatus) => {
    const response = await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alert_id: alertId, status: newStatus }),
    });

    if (response.ok) {
      fetchAlerts();
      setSelectedAlert(null);
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case "CRITICAL":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "HIGH":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "MEDIUM":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
            Alerts & Notifications
          </h1>
          <p className="text-slate-400 mt-1">
            Monitor and manage vehicle alerts
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">
                Severity
              </label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="grid gap-4">
          {filteredAlerts.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-slate-400">
                  No alerts found matching your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="bg-slate-900/50 border-slate-800 backdrop-blur hover:border-slate-700 transition-colors cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getSeverityIcon(alert.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {alert.title}
                          </h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">
                          {alert.description}
                        </p>
                        {alert.diagnosis && (
                          <p className="text-sm text-slate-300 mb-2">
                            <span className="font-medium">Diagnosis:</span>{" "}
                            {alert.diagnosis}
                          </p>
                        )}
                        <p className="text-sm text-blue-400">
                          <span className="font-medium">
                            Recommended Action:
                          </span>{" "}
                          {alert.recommended_action}
                        </p>
                        {/* {alert.estimated_cost && (
                          <p className="text-sm text-green-400 mt-2">
                            Estimated Cost:{" "}
                            {formatCurrency(alert.estimated_cost)}
                          </p>
                        )} */}
                        <p className="text-xs text-slate-500 mt-3">
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {alert.status === "OPEN" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAlertStatus(alert.id, "ACKNOWLEDGED");
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.status === "ACKNOWLEDGED" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAlertStatus(alert.id, "IN_PROGRESS");
                          }}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          Start Work
                        </Button>
                      )}
                      {alert.status === "IN_PROGRESS" && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateAlertStatus(alert.id, "RESOLVED");
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
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
