"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid 
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Zap, 
  Activity, 
  ShieldAlert,
  Terminal,
  Cpu,
  Loader2
} from "lucide-react";
import { getAdminAnalytics } from "@/app/actions/admin-analytics";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getAdminAnalytics();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <p className="text-cyan-500 font-black uppercase tracking-widest text-xs">Accessing Admin Control Layer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Access Denied</h2>
          <p className="text-rose-400 text-sm font-mono tracking-tight">&gt; ERROR: UNAUTHORIZED_IDENTITY<br/>&gt; TRACE: Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono p-10 space-y-10">
      {/* Admin Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-600/20 rounded-2xl flex items-center justify-center border border-rose-500/30 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
            <Terminal className="text-rose-500" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Admin Control Center</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">System Monitoring & Analytics v4.2</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Health: Normal</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total AI Spend", value: `$${data.totalSpend}`, icon: DollarSign, color: "text-rose-500" },
          { label: "Active Sessions", value: "1,204", icon: Users, color: "text-cyan-500" },
          { label: "AI Requests / 24h", value: "482", icon: Zap, color: "text-yellow-500" },
          { label: "System Uptime", value: "99.98%", icon: Activity, color: "text-emerald-500" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl space-y-2 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={48} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Cost Chart */}
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <TrendingUp size={20} className="text-rose-500" />
            AI Expenditure Tracking (USD)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.aiCostChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#f43f5e' }}
                />
                <Line type="monotone" dataKey="cost" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Usage Chart */}
        <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Activity size={20} className="text-cyan-500" />
            Feature Popularity (Hits)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.featureChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent AI Activity */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Cpu size={20} className="text-yellow-500" />
            Recent AI Processor Activity
          </h3>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last 10 Actions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <th className="p-6">Timestamp</th>
                <th className="p-6">Feature</th>
                <th className="p-6">Model</th>
                <th className="p-6">Tokens (In/Out)</th>
                <th className="p-6">Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {data.recentAi.map((log: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6 text-slate-400 font-bold">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-6 font-black uppercase tracking-tight">{log.feature_context}</td>
                  <td className="p-6 text-slate-500 uppercase font-black text-[10px]">{log.model_name}</td>
                  <td className="p-6 text-slate-400">{log.input_tokens} / {log.output_tokens}</td>
                  <td className="p-6 font-black text-rose-500">${log.cost_usd.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

