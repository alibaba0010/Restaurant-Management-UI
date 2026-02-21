"use client";

import React, { useEffect, useState } from "react";
import { apiHealthCheck } from "@/lib/api";
import { HealthCheckResponse } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Server,
  Database,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HealthPage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiHealthCheck();
      setHealth(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch health status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === "healthy" || status === "UP") {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 gap-1"
        >
          <CheckCircle className="w-3 h-3" /> Healthy
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" /> Unhealthy
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">System Status</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHealth}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        <Card className="shadow-lg border-none">
          <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Main API Service</CardTitle>
                <CardDescription>Real-time connectivity status</CardDescription>
              </div>
              {loading && !health ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                getStatusBadge(health?.status || "unhealthy")
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <Database className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">PostgreSQL</p>
                    <p className="text-xs text-slate-500">Core Data Storage</p>
                  </div>
                </div>
                {getStatusBadge(health?.services?.postgres || "offline")}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Redis</p>
                    <p className="text-xs text-slate-500">Cache & Sessions</p>
                  </div>
                </div>
                {getStatusBadge(health?.services?.redis || "offline")}
              </div>
            </div>

            {health?.timestamp && (
              <p className="text-[10px] text-center text-slate-400">
                Last updated: {new Date(health.timestamp).toLocaleString()}
              </p>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs text-center">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/">
            <Button variant="link" className="text-slate-500 text-sm">
              <Server className="w-3 h-3 mr-2" /> Back to Application
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
