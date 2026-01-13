import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, AlertTriangle, Wrench, FileText, Shield, Activity, Leaf } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoSentience - AI-Powered Vehicle Maintenance",
  description: "Predictive maintenance system powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 hidden md:block">
            <div className="mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                AutoSentience
              </h2>
              <p className="text-xs text-slate-500 mt-1">AI Predictive Maintenance</p>
            </div>
            <nav className="space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <AlertTriangle className="h-5 w-5" />
                Alerts
              </Link>
              <Link
                href="/dashboard/fuel"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Leaf className="h-5 w-5" />
                Fuel Efficiency
              </Link>
              <Link
                href="/service"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Wrench className="h-5 w-5" />
                Service Booking
              </Link>
              <Link
                href="/rca"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <FileText className="h-5 w-5" />
                RCA Reports
              </Link>
              <Link
                href="/security"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Shield className="h-5 w-5" />
                Security
              </Link>
              <Link
                href="/agent-logs"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <Activity className="h-5 w-5" />
                Agent Logs
              </Link>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
