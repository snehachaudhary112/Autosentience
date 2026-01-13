import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [bookings, setBookings] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [sensorReadings, setSensorReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [notification, setNotification] = useState("");

    // Fetch dashboard statistics
    const fetchStats = async () => {
        try {
            const today = startOfDay(new Date());
            const thirtyDaysAgo = subDays(today, 30);

            const [bookingsCount, alertsCount, pendingBookings, criticalAlerts] =
                await Promise.all([
                    supabase.from("bookings").select("id", { count: "exact" }),
                    supabase.from("alerts").select("id", { count: "exact" }),
                    supabase
                        .from("bookings")
                        .select("id", { count: "exact" })
                        .eq("status", "PENDING"),
                    supabase
                        .from("alerts")
                        .select("id", { count: "exact" })
                        .eq("severity", "CRITICAL"),
                ]);

            const recentBookings = await supabase
                .from("bookings")
                .select("created_at")
                .gte("created_at", thirtyDaysAgo.toISOString());

            setStats({
                totalBookings: bookingsCount.count || 0,
                totalAlerts: alertsCount.count || 0,
                pendingBookings: pendingBookings.count || 0,
                criticalAlerts: criticalAlerts.count || 0,
                recentBookings: recentBookings.data?.length || 0,
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    // Fetch bookings
    const fetchBookings = async () => {
        try {
            let query = supabase
                .from("bookings")
                .select("*")
                .order("created_at", { ascending: false });

            if (filterStatus !== "all") {
                query = query.eq("status", filterStatus);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching bookings:", error);
            } else {
                setBookings(data || []);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // Fetch alerts
    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from("alerts")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching alerts:", error);
            } else {
                setAlerts(data || []);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // Fetch sensor readings
    const fetchSensorReadings = async () => {
        try {
            const { data, error } = await supabase
                .from("sensor_readings")
                .select("*")
                .order("timestamp", { ascending: false })
                .limit(100);

            if (error) {
                console.error("Error fetching sensor readings:", error);
            } else {
                setSensorReadings(data || []);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // Update booking status
    const updateBookingStatus = async (bookingId, newStatus) => {
        try {
            const { error } = await supabase
                .from("bookings")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", bookingId);

            if (error) {
                showNotification("Failed to update booking status", "error");
            } else {
                showNotification(`Booking status updated to ${newStatus}`, "success");
                fetchBookings();
                fetchStats();
            }
        } catch (error) {
            console.error("Error:", error);
            showNotification("An error occurred", "error");
        }
    };

    // Update alert status
    const updateAlertStatus = async (alertId, newStatus) => {
        try {
            const updateData = {
                status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (newStatus === "ACKNOWLEDGED") {
                updateData.acknowledged_at = new Date().toISOString();
            } else if (newStatus === "RESOLVED") {
                updateData.resolved_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from("alerts")
                .update(updateData)
                .eq("id", alertId);

            if (error) {
                showNotification("Failed to update alert status", "error");
            } else {
                showNotification(`Alert status updated to ${newStatus}`, "success");
                fetchAlerts();
                fetchStats();
            }
        } catch (error) {
            console.error("Error:", error);
            showNotification("An error occurred", "error");
        }
    };

    // Show notification
    const showNotification = (message, type = "info") => {
        setNotification({ message, type });
        setTimeout(() => setNotification(""), 3000);
    };

    // View details
    const viewDetails = (item, type) => {
        setSelectedItem({ ...item, type });
        setShowModal(true);
    };

    // Initialize data
    useEffect(() => {
        const initializeData = async () => {
            setLoading(true);
            await Promise.all([
                fetchStats(),
                fetchBookings(),
                fetchAlerts(),
                fetchSensorReadings(),
            ]);
            setLoading(false);
        };

        initializeData();
    }, []);

    // Set up real-time subscriptions
    useEffect(() => {
        const bookingsSubscription = supabase
            .channel("bookings")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "bookings" },
                () => {
                    fetchBookings();
                    fetchStats();
                }
            )
            .subscribe();

        const alertsSubscription = supabase
            .channel("alerts")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "alerts" },
                () => {
                    fetchAlerts();
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(bookingsSubscription);
            supabase.removeChannel(alertsSubscription);
        };
    }, []);

    // Status badge component
    const StatusBadge = ({ status, type = "booking" }) => {
        const getStatusColor = (status) => {
            if (type === "booking") {
                switch (status) {
                    case "PENDING":
                        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
                    case "CONFIRMED":
                        return "bg-gradient-to-r from-blue-400 to-blue-600";
                    case "IN_SERVICE":
                        return "bg-gradient-to-r from-purple-400 to-purple-600";
                    case "COMPLETED":
                        return "bg-gradient-to-r from-green-400 to-green-600";
                    case "CANCELLED":
                        return "bg-gradient-to-r from-red-400 to-red-600";
                    default:
                        return "bg-gradient-to-r from-gray-400 to-gray-600";
                }
            } else {
                switch (status) {
                    case "OPEN":
                        return "bg-gradient-to-r from-red-400 to-red-600";
                    case "ACKNOWLEDGED":
                        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
                    case "IN_PROGRESS":
                        return "bg-gradient-to-r from-blue-400 to-blue-600";
                    case "RESOLVED":
                        return "bg-gradient-to-r from-green-400 to-green-600";
                    case "CLOSED":
                        return "bg-gradient-to-r from-gray-400 to-gray-600";
                    default:
                        return "bg-gradient-to-r from-gray-400 to-gray-600";
                }
            }
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${getStatusColor(
                    status
                )}`}
            >
                {status}
            </span>
        );
    };

    // Severity badge component
    const SeverityBadge = ({ severity }) => {
        const getSeverityColor = (severity) => {
            switch (severity) {
                case "LOW":
                    return "bg-gradient-to-r from-green-400 to-green-600";
                case "MEDIUM":
                    return "bg-gradient-to-r from-yellow-400 to-yellow-600";
                case "HIGH":
                    return "bg-gradient-to-r from-orange-400 to-orange-600";
                case "CRITICAL":
                    return "bg-gradient-to-r from-red-400 to-red-600";
                default:
                    return "bg-gradient-to-r from-gray-400 to-gray-600";
            }
        };

        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${getSeverityColor(
                    severity
                )}`}
            >
                {severity}
            </span>
        );
    };

    // Sidebar navigation
    const Sidebar = () => (
        <div className="w-72 bg-gradient-to-b from-gray-900 to-gray-800 h-screen fixed left-0 top-0 shadow-2xl border-r border-gray-700">
            <div className="p-8">
                <div className="flex items-center space-x-3 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                </div>
                <nav className="space-y-2">
                    {[
                        {
                            id: "dashboard",
                            label: "Dashboard",
                            icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
                        },
                        {
                            id: "bookings",
                            label: "Bookings",
                            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                        },
                        {
                            id: "alerts",
                            label: "Alerts",
                            icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
                        },
                        {
                            id: "sensors",
                            label: "Sensor Data",
                            icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                        },
                        {
                            id: "voice",
                            label: "Voice Logs",
                            icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
                        },
                        {
                            id: "security",
                            label: "Security",
                            icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                        },
                    ].map((item) => (
                        <button
                            key={item.id}
                            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 ${activeTab === item.id
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                                : "text-gray-400 hover:bg-gray-700 hover:text-white hover:shadow-md"
                                }`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={item.icon}
                                />
                            </svg>
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );

    // Dashboard content
    const DashboardContent = () => (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Bookings",
                        value: stats.totalBookings || 0,
                        color: "from-blue-500 to-blue-700",
                        icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
                    },
                    {
                        label: "Pending Bookings",
                        value: stats.pendingBookings || 0,
                        color: "from-yellow-500 to-yellow-700",
                        icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                    },
                    {
                        label: "Total Alerts",
                        value: stats.totalAlerts || 0,
                        color: "from-orange-500 to-orange-700",
                        icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
                    },
                    {
                        label: "Critical Alerts",
                        value: stats.criticalAlerts || 0,
                        color: "from-red-500 to-red-700",
                        icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
                    },
                ].map((stat, index) => (
                    <div key={index} className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r opacity-75 group-hover:opacity-100 blur transition duration-300"></div>
                        <div className="relative bg-gray-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-medium mb-2">
                                        {stat.label}
                                    </p>
                                    <p className="text-4xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div
                                    className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                                >
                                    <svg
                                        className="w-7 h-7 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d={stat.icon}
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Bookings and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">Recent Bookings</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {bookings.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">
                                No bookings found
                            </p>
                        ) : (
                            bookings.slice(0, 5).map((booking) => (
                                <div
                                    key={booking.id}
                                    className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-lg">
                                                {booking.service_type}
                                            </p>
                                            <p className="text-gray-300 text-sm mt-1">
                                                {booking.customer_name}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-2">
                                                {format(
                                                    new Date(booking.created_at),
                                                    "MMM dd, yyyy hh:mm a"
                                                )}
                                            </p>
                                        </div>
                                        <StatusBadge status={booking.status} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">Recent Alerts</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">No alerts found</p>
                        ) : (
                            alerts.slice(0, 5).map((alert) => (
                                <div
                                    key={alert.id}
                                    className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-orange-500"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="text-white font-semibold text-lg">
                                                {alert.title}
                                            </p>
                                            <p className="text-gray-300 text-sm mt-1">
                                                {alert.vehicle_id}
                                            </p>
                                            <p className="text-gray-400 text-xs mt-2">
                                                {format(
                                                    new Date(alert.created_at),
                                                    "MMM dd, yyyy hh:mm a"
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <SeverityBadge severity={alert.severity} />
                                            <StatusBadge status={alert.status} type="alert" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Bookings content
    const BookingsContent = () => (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <h2 className="text-2xl font-bold text-white">Service Bookings</h2>
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search bookings..."
                                    className="pl-10 pr-4 py-3 bg-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 border border-gray-600 focus:border-blue-500"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                className="px-4 py-3 bg-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600 focus:border-blue-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="IN_SERVICE">In Service</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                            <button
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                onClick={() => {
                                    fetchBookings();
                                    showNotification("Bookings refreshed", "success");
                                }}
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50 border-b border-gray-600">
                            <tr>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    ID
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Customer
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Service
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Vehicle
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Scheduled
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Status
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings
                                .filter((booking) => {
                                    if (!searchTerm) return true;
                                    const term = searchTerm.toLowerCase();
                                    return (
                                        booking.customer_name?.toLowerCase().includes(term) ||
                                        booking.customer_email?.toLowerCase().includes(term) ||
                                        booking.service_type?.toLowerCase().includes(term) ||
                                        booking.vehicle_id?.toLowerCase().includes(term)
                                    );
                                })
                                .map((booking) => (
                                    <tr
                                        key={booking.id}
                                        className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <span className="text-gray-400 font-mono text-sm bg-gray-700/50 px-2 py-1 rounded">
                                                #{booking.id?.substring(0, 8)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className="text-white font-medium">
                                                    {booking.customer_name || "N/A"}
                                                </p>
                                                <p className="text-gray-400 text-sm">
                                                    {booking.customer_email || "N/A"}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-white font-medium">
                                            {booking.service_type || "N/A"}
                                        </td>
                                        <td className="py-4 px-6 text-white">
                                            {booking.vehicle_id || "N/A"}
                                        </td>
                                        <td className="py-4 px-6 text-white">
                                            {booking.scheduled_date && (
                                                <div>
                                                    <p>
                                                        {format(
                                                            new Date(booking.scheduled_date),
                                                            "MMM dd, yyyy"
                                                        )}
                                                    </p>
                                                    <p className="text-gray-400 text-sm">
                                                        {booking.scheduled_time || "N/A"}
                                                    </p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-600 transition-colors"
                                                    onClick={() => viewDetails(booking, "booking")}
                                                >
                                                    <svg
                                                        className="w-4 h-4 text-white"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        />
                                                    </svg>
                                                </button>
                                                {booking.status === "PENDING" && (
                                                    <button
                                                        className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-sm hover:from-green-600 hover:to-green-700 text-white font-medium transition-all"
                                                        onClick={() =>
                                                            updateBookingStatus(booking.id, "CONFIRMED")
                                                        }
                                                    >
                                                        Confirm
                                                    </button>
                                                )}
                                                {booking.status === "CONFIRMED" && (
                                                    <button
                                                        className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-sm hover:from-purple-600 hover:to-purple-700 text-white font-medium transition-all"
                                                        onClick={() =>
                                                            updateBookingStatus(booking.id, "IN_SERVICE")
                                                        }
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                                {booking.status === "IN_SERVICE" && (
                                                    <button
                                                        className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-sm hover:from-green-600 hover:to-green-700 text-white font-medium transition-all"
                                                        onClick={() =>
                                                            updateBookingStatus(booking.id, "COMPLETED")
                                                        }
                                                    >
                                                        Complete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Alerts content
    const AlertsContent = () => (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">System Alerts</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50 border-b border-gray-600">
                            <tr>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    ID
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Vehicle
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Title
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Severity
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Status
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Created
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((alert) => (
                                <tr
                                    key={alert.id}
                                    className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                                >
                                    <td className="py-4 px-6">
                                        <span className="text-gray-400 font-mono text-sm bg-gray-700/50 px-2 py-1 rounded">
                                            #{alert.id?.substring(0, 8)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-white font-medium">
                                        {alert.vehicle_id || "N/A"}
                                    </td>
                                    <td className="py-4 px-6 text-white">{alert.title}</td>
                                    <td className="py-4 px-6">
                                        <SeverityBadge severity={alert.severity} />
                                    </td>
                                    <td className="py-4 px-6">
                                        <StatusBadge status={alert.status} type="alert" />
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {format(new Date(alert.created_at), "MMM dd, yyyy hh:mm a")}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 bg-gray-700/50 rounded-lg hover:bg-gray-600 transition-colors"
                                                onClick={() => viewDetails(alert, "alert")}
                                            >
                                                <svg
                                                    className="w-4 h-4 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                            </button>
                                            {alert.status === "OPEN" && (
                                                <button
                                                    className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg text-sm hover:from-yellow-600 hover:to-yellow-700 text-white font-medium transition-all"
                                                    onClick={() =>
                                                        updateAlertStatus(alert.id, "ACKNOWLEDGED")
                                                    }
                                                >
                                                    Acknowledge
                                                </button>
                                            )}
                                            {alert.status === "ACKNOWLEDGED" && (
                                                <button
                                                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-sm hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all"
                                                    onClick={() =>
                                                        updateAlertStatus(alert.id, "IN_PROGRESS")
                                                    }
                                                >
                                                    In Progress
                                                </button>
                                            )}
                                            {(alert.status === "IN_PROGRESS" ||
                                                alert.status === "ACKNOWLEDGED") && (
                                                    <button
                                                        className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-sm hover:from-green-600 hover:to-green-700 text-white font-medium transition-all"
                                                        onClick={() =>
                                                            updateAlertStatus(alert.id, "RESOLVED")
                                                        }
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Sensor Data content
    const SensorDataContent = () => (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6">
                    <h2 className="text-2xl font-bold text-white">
                        Latest Sensor Readings
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-700/50 border-b border-gray-600">
                            <tr>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Vehicle ID
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Timestamp
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Engine Temp
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    RPM
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Battery
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Fuel Level
                                </th>
                                <th className="text-left py-4 px-6 text-gray-300 font-semibold">
                                    Speed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sensorReadings.map((reading) => (
                                <tr
                                    key={reading.id}
                                    className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors"
                                >
                                    <td className="py-4 px-6 text-white font-medium">
                                        {reading.vehicle_id}
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {format(
                                            new Date(reading.timestamp),
                                            "MMM dd, yyyy hh:mm:ss a"
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {reading.engine_temp || "N/A"}°C
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {reading.engine_rpm || "N/A"}
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {reading.battery_voltage || "N/A"}V
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {reading.fuel_level || "N/A"}%
                                    </td>
                                    <td className="py-4 px-6 text-white">
                                        {reading.speed || "N/A"} km/h
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Detail Modal
    const DetailModal = () => {
        if (!showModal || !selectedItem) return null;

        const isBooking = selectedItem.type === "booking";
        const item = selectedItem;

        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                    <div
                        className={`bg-gradient-to-r px-8 py-6 ${isBooking
                            ? "from-blue-600 to-purple-600"
                            : "from-orange-600 to-red-600"
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">
                                {isBooking ? "Booking Details" : "Alert Details"}
                            </h2>
                            <button
                                className="text-white/80 hover:text-white transition-colors"
                                onClick={() => setShowModal(false)}
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
                        <div className="space-y-6">
                            {isBooking ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Booking ID
                                            </p>
                                            <p className="text-white font-mono text-lg">
                                                #{item.id?.substring(0, 8)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Status
                                            </p>
                                            <StatusBadge status={item.status} />
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Customer Name
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.customer_name || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Email
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.customer_email || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Phone
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.customer_phone || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Vehicle ID
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.vehicle_id || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Service Type
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.service_type || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Service Center
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.service_center || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Scheduled Date
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.scheduled_date || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Scheduled Time
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.scheduled_time || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            Issue Description
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg text-white">
                                            {item.issue_description || "No description provided"}
                                        </div>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            Special Instructions
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg text-white">
                                            {item.special_instructions || "No special instructions"}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Alert ID
                                            </p>
                                            <p className="text-white font-mono text-lg">
                                                #{item.id?.substring(0, 8)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Status
                                            </p>
                                            <StatusBadge status={item.status} type="alert" />
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Vehicle ID
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.vehicle_id || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Alert Type
                                            </p>
                                            <p className="text-white text-lg">
                                                {item.alert_type || "N/A"}
                                            </p>
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Severity
                                            </p>
                                            <SeverityBadge severity={item.severity} />
                                        </div>
                                        <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                                            <p className="text-gray-400 text-sm font-medium mb-2">
                                                Created
                                            </p>
                                            <p className="text-white text-lg">
                                                {format(
                                                    new Date(item.created_at),
                                                    "MMM dd, yyyy hh:mm a"
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            Title
                                        </p>
                                        <p className="text-white text-xl font-semibold">
                                            {item.title}
                                        </p>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            Description
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg text-white">
                                            {item.description || "No description provided"}
                                        </div>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            AI Diagnosis
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg text-white">
                                            {item.diagnosis || "No diagnosis available"}
                                        </div>
                                    </div>
                                    <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                                        <p className="text-gray-400 text-sm font-medium mb-3">
                                            Recommended Action
                                        </p>
                                        <div className="bg-gray-800/50 p-4 rounded-lg text-white">
                                            {item.recommended_action || "No recommendation available"}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            {isBooking && (
                                <>
                                    {item.status === "PENDING" && (
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => {
                                                updateBookingStatus(item.id, "CONFIRMED");
                                                setShowModal(false);
                                            }}
                                        >
                                            Confirm Booking
                                        </button>
                                    )}
                                    {item.status === "CONFIRMED" && (
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl hover:from-purple-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => {
                                                updateBookingStatus(item.id, "IN_SERVICE");
                                                setShowModal(false);
                                            }}
                                        >
                                            Start Service
                                        </button>
                                    )}
                                    {item.status === "IN_SERVICE" && (
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => {
                                                updateBookingStatus(item.id, "COMPLETED");
                                                setShowModal(false);
                                            }}
                                        >
                                            Complete Service
                                        </button>
                                    )}
                                </>
                            )}
                            {!isBooking && (
                                <>
                                    {item.status === "OPEN" && (
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl hover:from-yellow-600 hover:to-yellow-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => {
                                                updateAlertStatus(item.id, "ACKNOWLEDGED");
                                                setShowModal(false);
                                            }}
                                        >
                                            Acknowledge
                                        </button>
                                    )}
                                    {item.status === "ACKNOWLEDGED" && (
                                        <button
                                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                            onClick={() => {
                                                updateAlertStatus(item.id, "IN_PROGRESS");
                                                setShowModal(false);
                                            }}
                                        >
                                            Mark In Progress
                                        </button>
                                    )}
                                    {(item.status === "IN_PROGRESS" ||
                                        item.status === "ACKNOWLEDGED") && (
                                            <button
                                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-600 hover:to-green-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                                onClick={() => {
                                                    updateAlertStatus(item.id, "RESOLVED");
                                                    setShowModal(false);
                                                }}
                                            >
                                                Resolve Alert
                                            </button>
                                        )}
                                </>
                            )}
                            <button
                                className="px-6 py-3 bg-gray-600 rounded-xl hover:bg-gray-700 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                                onClick={() => setShowModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Notification component
    const Notification = () => {
        if (!notification) return null;

        const bgColor =
            notification.type === "error"
                ? "bg-gradient-to-r from-red-500 to-red-600"
                : notification.type === "success"
                    ? "bg-gradient-to-r from-green-500 to-green-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-600";

        return (
            <div
                className={`fixed top-6 right-6 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-pulse`}
            >
                <div className="flex items-center space-x-3">
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="font-medium">{notification.message}</span>
                </div>
            </div>
        );
    };

    // Loading screen
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-gray-700 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                    </div>
                    <p className="text-white text-xl mt-6 font-medium">
                        Loading Admin Dashboard...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex">
            <Sidebar />
            <div className="flex-1 ml-72">
                <div className="p-8">
                    {activeTab === "dashboard" && <DashboardContent />}
                    {activeTab === "bookings" && <BookingsContent />}
                    {activeTab === "alerts" && <AlertsContent />}
                    {activeTab === "sensors" && <SensorDataContent />}
                    {activeTab === "voice" && (
                        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Voice Logs</h2>
                            <p className="text-gray-400">Voice logs feature coming soon...</p>
                        </div>
                    )}
                    {activeTab === "security" && (
                        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Security Logs
                            </h2>
                            <p className="text-gray-400">
                                Security logs feature coming soon...
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <DetailModal />
            <Notification />
        </div>
    );
};

export default AdminDashboard;
