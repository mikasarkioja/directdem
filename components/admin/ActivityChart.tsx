"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityChartProps {
  data: Array<{
    date: string;
    votes: number;
    fullDate: string;
  }>;
}

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-nordic-gray dark:stroke-nordic-darker" />
          <XAxis
            dataKey="date"
            className="text-xs"
            tick={{ fill: "currentColor" }}
            stroke="currentColor"
          />
          <YAxis
            tick={{ fill: "currentColor" }}
            stroke="currentColor"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--nordic-deep)",
              border: "1px solid var(--nordic-gray)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "var(--nordic-white)" }}
          />
          <Line
            type="monotone"
            dataKey="votes"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

