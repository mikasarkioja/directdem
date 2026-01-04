"use client";

import React from "react";
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

interface EvolutionLineChartProps {
  history: any[];
}

export default function EvolutionLineChart({ history }: EvolutionLineChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
        <p className="text-sm font-black uppercase tracking-widest text-command-gray">
          Äänestä lisää seurataksesi DNA-evoluutiotasi
        </p>
      </div>
    );
  }

  // Format data for Recharts
  const data = history.map((h) => {
    const scores = h.scores_json;
    return {
      date: new Date(h.created_at).toLocaleDateString("fi-FI", { 
        month: "short", 
        day: "numeric" 
      }),
      Talous: scores.economic_score || 0,
      Arvot: scores.liberal_conservative_score || 0,
      Ympäristö: scores.environmental_score || 0,
      Alue: scores.urban_rural_score || 0,
      Globalismi: scores.international_national_score || 0,
      Turvallisuus: scores.security_score || 0,
      archetype: h.archetype
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">DNA-Evoluutio</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Poliittisen matkasi aikajana</p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />
            <YAxis 
              domain={[-1, 1]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#fff", 
                borderRadius: "1rem", 
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }}
              labelStyle={{ fontWeight: 900, marginBottom: "0.5rem" }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle"
              wrapperStyle={{ paddingTop: "2rem", fontSize: "10px", fontWeight: 900, textTransform: "uppercase" }}
            />
            <Line type="monotone" dataKey="Talous" stroke="#8b5cf6" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Arvot" stroke="#ec4899" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Ympäristö" stroke="#10b981" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Alue" stroke="#f59e0b" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Globalismi" stroke="#3b82f6" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="Turvallisuus" stroke="#64748b" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

