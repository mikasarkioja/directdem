"use client";

import React from 'react';
import {
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

interface ComparisonRadarChartProps {
  harkimo: {
    economic: number;
    liberal: number;
    env: number;
    urban?: number;
    global?: number;
    security?: number;
  };
  target: {
    name: string;
    economic: number;
    liberal: number;
    env: number;
    urban?: number;
    global?: number;
    security?: number;
  };
}

export default function ComparisonRadarChart({ harkimo, target }: ComparisonRadarChartProps) {
  // Map -1...1 to 0...100 for better radar visualization
  const mapScore = (val: number | undefined) => Math.round(((val ?? 0) + 1) * 50);

  const data = [
    {
      subject: 'Talous (Oik.)',
      A: mapScore(harkimo.economic),
      B: mapScore(target.economic),
      fullMark: 100,
    },
    {
      subject: 'Arvot (Lib.)',
      A: mapScore(harkimo.liberal),
      B: mapScore(target.liberal),
      fullMark: 100,
    },
    {
      subject: 'Ympäristö (Suoj.)',
      A: mapScore(harkimo.env),
      B: mapScore(target.env),
      fullMark: 100,
    },
    {
      subject: 'Alue (Maas.)',
      A: mapScore(harkimo.urban),
      B: mapScore(target.urban),
      fullMark: 100,
    },
    {
      subject: 'Kansainv. (Glob.)',
      A: mapScore(harkimo.global),
      B: mapScore(target.global),
      fullMark: 100,
    },
    {
      subject: 'Turvallis. (Kova)',
      A: mapScore(harkimo.security),
      B: mapScore(target.security),
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Hjallis"
            dataKey="A"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.5}
          />
          <Radar
            name={target.name}
            dataKey="B"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

