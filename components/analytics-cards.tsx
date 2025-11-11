"use client";

import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  total_resolved_tickets: {
    total_tickets: number;
    total_resolved_tickets: number;
  };
  average_resolution_time: {
    value: number;
    unit: string;
  };
  first_contact_resolution: {
    resolved_in_first_contact: number;
    percent: number;
  };
}

export function AnalyticsCards() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch("/analytics/discord/analytics", {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to fetch analytics");
        }

        const result = await response.json();
        setAnalytics(result.data);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [authenticatedFetch]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalResolvedPercentage =
    analytics.total_resolved_tickets.total_tickets > 0
      ? (
          (analytics.total_resolved_tickets.total_resolved_tickets /
            analytics.total_resolved_tickets.total_tickets) *
          100
        ).toFixed(1)
      : "0.0";

  // Format average resolution time with proper zero handling
  const formatResolutionTime = () => {
    const value = analytics.average_resolution_time.value;
    const unit = analytics.average_resolution_time.unit;

    if (!value || value === 0) {
      return `${0} ${unit}`;
    }

    // Show decimal for values less than 10, otherwise round
    const formattedValue = value < 10 ? value.toFixed(1) : Math.round(value);
    return `${formattedValue} ${unit}`;
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Total Resolved */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Resolved</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
            {analytics.total_resolved_tickets.total_resolved_tickets}
            <span className="mx-1.5 font-medium">/</span>
            {analytics.total_resolved_tickets.total_tickets}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-semibold">
              {totalResolvedPercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Average Resolution Time */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Average Resolution Time</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
            {formatResolutionTime()}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* First Contact Resolution */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>First Contact Resolution</CardDescription>
          <CardTitle className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
            {analytics.first_contact_resolution.resolved_in_first_contact}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-semibold">
              {analytics.first_contact_resolution.percent.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
