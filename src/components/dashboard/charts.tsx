"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData } from "@/types/domain";
import { formatCompactNumber } from "@/lib/utils";

const tooltipStyle = {
  border: "1px solid #e5eaf1",
  borderRadius: 12,
  boxShadow: "0 12px 30px rgba(15,23,42,.12)",
  fontSize: 12,
};

export function ViewsChart({ data }: { data: DashboardData["dailyViews"] }) {
  return (
    <div className="h-[300px]" role="img" aria-label="Daily views over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#335cff" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#335cff" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef2f7" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            minTickGap={35}
            tickFormatter={(value: string) =>
              new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={48}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={formatCompactNumber}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatCompactNumber(Number(value)), "Views"]}
            labelFormatter={(label) =>
              new Date(`${String(label)}T00:00:00`).toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                },
              )
            }
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke="#335cff"
            strokeWidth={2.5}
            fill="url(#views-fill)"
            activeDot={{
              r: 4,
              fill: "#335cff",
              strokeWidth: 2,
              stroke: "white",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlatformChart({
  data,
}: {
  data: DashboardData["platformPerformance"];
}) {
  return (
    <div className="h-[300px]" role="img" aria-label="Views by platform">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 16, bottom: 0, left: 6 }}
        >
          <CartesianGrid horizontal={false} stroke="#eef2f7" />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={formatCompactNumber}
          />
          <YAxis
            dataKey="platform"
            type="category"
            axisLine={false}
            tickLine={false}
            width={72}
            tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "#f8fafc" }}
            formatter={(value) => [formatCompactNumber(Number(value)), "Views"]}
          />
          <Bar dataKey="views" radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((entry) => (
              <Cell key={entry.platform} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QualityChart({
  data,
}: {
  data: DashboardData["matchQuality"];
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div
      className="relative h-44"
      role="img"
      aria-label="Match-quality distribution"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-950">{total}</p>
          <p className="text-[10px] font-semibold text-slate-600 uppercase">
            Records
          </p>
        </div>
      </div>
    </div>
  );
}
