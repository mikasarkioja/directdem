"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, MapPin, Info } from "lucide-react";
import type { Bill, UserProfile } from "@/lib/types";

interface MinecraftFinlandMapProps {
  selectedBill?: Bill | null;
  user?: UserProfile | null;
}

interface DistrictStats {
  name: string;
  code: string;
  citizenVote: number;
  parliamentVote: number;
  gap: number;
  agreement: number;
}

const DISTRICT_INFO: Record<string, { name: string; color: string; labelPos?: { r: number; c: number }; bias: number }> = {
  "01": { name: "Helsinki", color: "#3B82F6", labelPos: { r: 14, c: 3 }, bias: -15 }, // Urban bias
  "02": { name: "Uusimaa", color: "#60A5FA", labelPos: { r: 13, c: 4 }, bias: -10 },
  "03": { name: "Varsinais-Suomi", color: "#10B981", labelPos: { r: 12, c: 1 }, bias: -5 },
  "04": { name: "Satakunta", color: "#059669", labelPos: { r: 10, c: 0 }, bias: 5 },
  "05": { name: "Ahvenanmaa", color: "#F59E0B", labelPos: { r: 15, c: 0 }, bias: -20 },
  "06": { name: "Häme", color: "#8B5CF6", labelPos: { r: 11, c: 4 }, bias: 0 },
  "07": { name: "Pirkanmaa", color: "#A78BFA", labelPos: { r: 10, c: 2 }, bias: -5 },
  "08": { name: "Kaakkois-Suomi", color: "#EC4899", labelPos: { r: 12, c: 6 }, bias: 10 },
  "09": { name: "Savo-Karjala", color: "#F43F5E", labelPos: { r: 9, c: 5 }, bias: 15 },
  "10": { name: "Vaasa", color: "#F97316", labelPos: { r: 8, c: 1 }, bias: 20 }, // Rural/Conservative bias
  "11": { name: "Keski-Suomi", color: "#FB923C", labelPos: { r: 8, c: 3 }, bias: 5 },
  "12": { name: "Oulu", color: "#14B8A6", labelPos: { r: 5, c: 3 }, bias: 10 },
  "13": { name: "Lappi", color: "#06B6D4", labelPos: { r: 2, c: 3 }, bias: 25 }, // High regional bias
};

const FINLAND_GRID = [
  [null, null, null, "13", "13", "13", null],
  [null, null, "13", "13", "13", "13", "13"],
  [null, "13", "13", "13", "13", "13", "13"],
  [null, "13", "13", "13", "13", "13", null],
  [null, null, "12", "12", "12", "12", null],
  [null, "12", "12", "12", "12", "12", null],
  [null, "12", "12", "12", "12", "12", null],
  [null, "10", "10", "11", "11", "09", "09"],
  [null, "10", "10", "11", "11", "09", "09"],
  ["10", "10", "11", "11", "09", "09", null],
  ["04", "07", "07", "06", "06", "09", null],
  ["04", "07", "07", "06", "06", "08", "08"],
  ["03", "03", "06", "06", "08", "08", null],
  ["03", "03", "02", "02", "02", "08", null],
  [null, "02", "02", "01", "02", null, null],
  ["05", null, null, null, null, null, null],
];

function generateDistrictStats(bill: Bill | null, code: string, name: string): DistrictStats {
  if (!bill) return { name, code, citizenVote: 50, parliamentVote: 50, gap: 0, agreement: 100 };
  
  const baseCitizen = bill.citizenPulse.for;
  const baseParliament = bill.politicalReality.filter(p => p.position === "for").reduce((sum, p) => sum + p.seats, 0) /
    bill.politicalReality.reduce((sum, p) => sum + p.seats, 0) * 100;
  
  const info = DISTRICT_INFO[code];
  const titleLower = bill.title.toLowerCase();
  
  // Create regional variation based on keywords and district bias
  let regionalVariation = info.bias;
  
  // Flip or intensify variation based on topic
  if (titleLower.includes("vero") || titleLower.includes("talous")) {
    regionalVariation *= 1.2; // Intensify economic splits
  } else if (titleLower.includes("luonto") || titleLower.includes("metsä") || titleLower.includes("maatalous")) {
    // Rural districts usually favor these more if it's about usage, or less if it's about restriction
    regionalVariation *= 1.5; 
  } else if (titleLower.includes("alkoholi") || titleLower.includes("vapaa-aika")) {
    regionalVariation = -regionalVariation; // Urban areas might be more liberal
  }

  // Add some unique "random" noise for this specific bill + district combo
  const noise = (code.charCodeAt(0) + bill.id.charCodeAt(0)) % 15 - 7;
  
  const citizenVote = Math.max(5, Math.min(95, baseCitizen + regionalVariation + noise));
  
  // Parliament members often vote more strictly by party line, 
  // but let's simulate that they don't always match the local citizens
  const parliamentVote = Math.max(5, Math.min(95, baseParliament + (regionalVariation * 0.3) + (noise * 0.2)));
  
  const gap = Math.abs(citizenVote - parliamentVote);
  const agreement = Math.round(100 - gap);

  return { 
    name, 
    code, 
    citizenVote: Math.round(citizenVote), 
    parliamentVote: Math.round(parliamentVote), 
    gap: Math.round(gap), 
    agreement 
  };
}

function getDistrictColor(agreement: number, isSelected: boolean): string {
  if (!isSelected) return "#CBD5E1";
  
  // New thresholds based on user request:
  // > 75% Green (Harmony)
  // < 50% Red (Deficit)
  // 50-75% Yellow/Orange (Warning)
  
  if (agreement >= 75) return "#10B981"; // Green
  if (agreement >= 50) return "#FBBF24"; // Yellow
  return "#EF4444"; // Red
}

export default function MinecraftFinlandMap({ selectedBill, user }: MinecraftFinlandMapProps) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const districtStatsMap = useMemo(() => {
    const stats: Record<string, DistrictStats> = {};
    Object.entries(DISTRICT_INFO).forEach(([code, info]) => {
      stats[code] = generateDistrictStats(selectedBill || null, code, info.name);
    });
    return stats;
  }, [selectedBill]);

  const userDistrictCode = Object.entries(DISTRICT_INFO).find(([_, info]) => info.name === user?.vaalipiiri)?.[0];

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-nordic-gray/30 overflow-hidden">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-nordic-darker mb-2 tracking-tighter uppercase">
            Vaalipiirikartta
          </h2>
          <p className="text-nordic-dark font-medium max-w-lg">
            {selectedBill 
              ? `Demokraattinen vaje: ${selectedBill.title}`
              : "Valitse lakiesitys nähdäksesi miten kansan tahto ja eduskunnan päätökset kohtaavat eri puolella Suomea."}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nordic-light rounded-full border border-nordic-gray/20">
            <div className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="text-[10px] font-bold text-nordic-dark uppercase tracking-wider">Sopusointu</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-nordic-light rounded-full border border-nordic-gray/20">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="text-[10px] font-bold text-nordic-dark uppercase tracking-wider">Vaje</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start justify-center">
        {/* The Grid Area */}
        <div className="relative p-4 bg-nordic-light/30 rounded-2xl border border-nordic-gray/10 select-none mx-auto lg:mx-0">
          <div className="grid grid-cols-7 gap-1 relative z-10">
            {FINLAND_GRID.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                if (!cell) return <div key={`${rowIndex}-${colIndex}`} className="w-10 h-10 md:w-12 md:h-12" />;

                const stats = districtStatsMap[cell];
                const isHovered = hoveredCode === cell;
                const isActive = hoveredCode === cell || userDistrictCode === cell;
                const agreement = stats?.agreement || 50;
                
                const baseColor = DISTRICT_INFO[cell].color;
                const fillColor = selectedBill ? getDistrictColor(agreement, true) : baseColor;

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    onMouseEnter={() => setHoveredCode(cell)}
                    onMouseLeave={() => setHoveredCode(null)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg transition-all duration-300 cursor-pointer relative
                      ${isHovered ? 'scale-110 z-20 shadow-2xl brightness-110' : 'opacity-70 hover:opacity-100'}
                      ${userDistrictCode === cell ? 'ring-4 ring-nordic-blue ring-offset-2' : ''}
                    `}
                    style={{ backgroundColor: fillColor }}
                  >
                    {/* Inner bevel for Minecraft look */}
                    <div className="absolute inset-0 border-t-2 border-l-2 border-white/20 rounded-lg pointer-events-none" />
                    <div className="absolute inset-0 border-b-2 border-r-2 border-black/20 rounded-lg pointer-events-none" />
                    
                    {/* District ID/Name (Behind/Subtle) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black text-black/10 uppercase">{cell}</span>
                    </div>

                    {userDistrictCode === cell && !isHovered && (
                      <div className="absolute -top-2 -right-2 bg-nordic-blue text-white rounded-full p-1 shadow-lg z-30">
                        <MapPin size={12} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* District Name Overlay (Behind Grid) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] select-none">
            {Object.entries(DISTRICT_INFO).map(([code, info]) => (
              <div 
                key={code}
                className="absolute text-4xl font-black whitespace-nowrap uppercase tracking-tighter"
                style={{ 
                  top: `${(info.labelPos?.r || 0) * 50}px`, 
                  left: `${(info.labelPos?.c || 0) * 50}px`,
                  transform: 'rotate(-15deg)'
                }}
              >
                {info.name}
              </div>
            ))}
          </div>
        </div>

        {/* Professional Info Panel */}
        <div className="w-full lg:max-w-md">
          {hoveredCode ? (
            <div className="bg-white border border-nordic-gray/30 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] font-black bg-nordic-blue/10 text-nordic-blue px-2 py-1 rounded uppercase tracking-widest mb-1 inline-block">Vaalipiiri {hoveredCode}</span>
                  <h3 className="text-3xl font-black text-nordic-darker leading-none tracking-tighter">
                    {DISTRICT_INFO[hoveredCode].name}
                  </h3>
                </div>
                {userDistrictCode === hoveredCode && (
                  <div className="bg-nordic-blue text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg shadow-nordic-blue/30">
                    <MapPin size={16} fill="currentColor" />
                    <span className="text-xs font-black uppercase tracking-wider">Oma</span>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-nordic-light/50 rounded-2xl border border-nordic-gray/10">
                    <p className="text-[10px] font-bold text-nordic-dark uppercase mb-2 tracking-widest">Kansan tahto</p>
                    <p className="text-3xl font-black text-nordic-blue">{districtStatsMap[hoveredCode].citizenVote}%</p>
                  </div>
                  <div className="p-4 bg-nordic-light/50 rounded-2xl border border-nordic-gray/10">
                    <p className="text-[10px] font-bold text-nordic-dark uppercase mb-2 tracking-widest">Eduskunta</p>
                    <p className="text-3xl font-black text-nordic-deep">{districtStatsMap[hoveredCode].parliamentVote}%</p>
                  </div>
                </div>

                <div className="relative pt-6 border-t border-nordic-gray/20">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-sm font-bold text-nordic-darker uppercase tracking-wider">Yhteensopivuus</span>
                    <span className={`text-5xl font-black italic leading-none ${
                      districtStatsMap[hoveredCode].agreement >= 75 ? 'text-green-600' :
                      districtStatsMap[hoveredCode].agreement >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {districtStatsMap[hoveredCode].agreement}%
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-4 bg-nordic-light rounded-full overflow-hidden border border-nordic-gray/10">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        districtStatsMap[hoveredCode].agreement >= 75 ? 'bg-green-500' :
                        districtStatsMap[hoveredCode].agreement >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${districtStatsMap[hoveredCode].agreement}%` }}
                    />
                  </div>

                  {districtStatsMap[hoveredCode].agreement < 50 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                      <AlertTriangle size={20} className="flex-shrink-0" />
                      <p className="text-xs font-bold leading-tight uppercase tracking-tight">Merkittävä demokraattinen vaje havaittu tässä vaalipiirissä</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-nordic-light/20 rounded-3xl border-2 border-dashed border-nordic-gray/20">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-nordic-gray/10">
                <Info className="text-nordic-blue" size={32} />
              </div>
              <h4 className="text-xl font-black text-nordic-darker mb-2 uppercase tracking-tighter">Analysoi alueita</h4>
              <p className="text-sm text-nordic-dark leading-relaxed font-medium">
                Valitse vaalipiiri kartalta nähdäksesi miten alueesi mielipide eroaa eduskunnan päätöksenteosta.
              </p>
            </div>
          )}

          {/* Simple Legend for mobile/bottom */}
          <div className="mt-8 p-6 bg-white rounded-2xl border border-nordic-gray/20 shadow-sm">
            <h5 className="text-[10px] font-black text-nordic-dark uppercase tracking-widest mb-4">Karttaohje</h5>
            <ul className="space-y-3 text-xs font-bold text-nordic-darker uppercase tracking-tighter">
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-[#10B981] opacity-70" />
                <span>Vihreä: Yli 75% yhteensopivuus</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-[#FBBF24] opacity-70" />
                <span>Keltainen: 50-75% yhteensopivuus</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-[#EF4444] opacity-70" />
                <span>Punainen: Alle 50% yhteensopivuus</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-nordic-blue rounded p-0.5" />
                <span>Sininen reunus: Oma vaalipiirisi</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
