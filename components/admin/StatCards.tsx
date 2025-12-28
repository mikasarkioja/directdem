"use client";

import { Users, FileText, Vote, TrendingUp } from "lucide-react";

interface StatCardsProps {
  stats: {
    totalUsers: number;
    activeBills: number;
    totalVotes: number;
    avgDiscrepancyGap: number;
  } | null;
}

export default function StatCards({ stats }: StatCardsProps) {
  if (!stats) {
    return null;
  }

  const cards = [
    {
      label: "Total Verified Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Active Bills",
      value: stats.activeBills.toLocaleString(),
      icon: FileText,
      color: "bg-green-500",
    },
    {
      label: "Total Votes Cast",
      value: stats.totalVotes.toLocaleString(),
      icon: Vote,
      color: "bg-purple-500",
    },
    {
      label: "Avg. Discrepancy Gap (%)",
      value: `${stats.avgDiscrepancyGap}%`,
      icon: TrendingUp,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-nordic-deep rounded-2xl p-6 border border-nordic-gray dark:border-nordic-darker shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-nordic-dark dark:text-nordic-gray mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-nordic-darker dark:text-nordic-white">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

