"use client";

import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { AlertTriangle, MapPin } from "lucide-react";
import { getFinnishDistrictsGeoJSON } from "@/lib/finnish-districts-geo";
import { type Bill } from "@/app/actions/bills-supabase";
import { createClient } from "@/lib/supabase/client";

interface ConstituencyMapProps {
  selectedBill?: Bill | null;
  userDistrict?: string | null; // e.g., "Helsinki", "Uusimaa"
}

interface DistrictStats {
  name: string;
  citizenVote: number; // Percentage
  parliamentVote: number; // Percentage
  gap: number; // Absolute difference
  agreement: number; // 0-100% agreement score
}

// Mock data for district-level voting (in production, this would come from actual data)
// For now, we'll use the bill's overall stats with some variation
function generateDistrictStats(
  bill: Bill | null,
  districtName: string
): DistrictStats {
  if (!bill) {
    return {
      name: districtName,
      citizenVote: 50,
      parliamentVote: 50,
      gap: 0,
      agreement: 100,
    };
  }

  // Use bill's overall stats with some random variation per district
  // In production, this would come from actual district-level voting data
  const baseCitizen = bill.citizenPulse.for;
  const baseParliament = bill.politicalReality
    .filter((p) => p.position === "for")
    .reduce((sum, p) => sum + p.seats, 0) /
    bill.politicalReality.reduce((sum, p) => sum + p.seats, 0) * 100;

  // Add some variation based on district (mock)
  const variation = (districtName.charCodeAt(0) % 20) - 10; // -10 to +10 variation
  const citizenVote = Math.max(0, Math.min(100, baseCitizen + variation));
  const parliamentVote = Math.max(0, Math.min(100, baseParliament + variation * 0.5));

  const gap = Math.abs(citizenVote - parliamentVote);
  const agreement = 100 - gap; // Higher agreement = lower gap

  return {
    name: districtName,
    citizenVote: Math.round(citizenVote),
    parliamentVote: Math.round(parliamentVote),
    gap: Math.round(gap),
    agreement: Math.round(agreement),
  };
}

/**
 * Gets color based on democratic deficit
 * Green: >80% agreement
 * Yellow: 40-60% agreement
 * Red: <30% agreement (Democratic Danger Zone)
 */
function getDistrictColor(agreement: number): string {
  if (agreement >= 80) {
    return "#10B981"; // Green
  } else if (agreement >= 60) {
    return "#FBBF24"; // Yellow
  } else if (agreement >= 40) {
    return "#F59E0B"; // Orange
  } else {
    return "#EF4444"; // Red - Democratic Danger Zone
  }
}

export default function ConstituencyMap({
  selectedBill,
  userDistrict,
}: ConstituencyMapProps) {
  const [tooltip, setTooltip] = useState<{
    district: string;
    stats: DistrictStats;
    x: number;
    y: number;
  } | null>(null);

  const geoData = getFinnishDistrictsGeoJSON();

  // Calculate stats for each district
  const districtStatsMap = useMemo(() => {
    const stats: Record<string, DistrictStats> = {};
    geoData.features.forEach((feature) => {
      const districtName = feature.properties.name;
      stats[districtName] = generateDistrictStats(selectedBill || null, districtName);
    });
    return stats;
  }, [selectedBill]);

  return (
    <div className="p-6 bg-nordic-light rounded-2xl border-2 border-nordic-gray">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-nordic-darker mb-2">
          Vaalipiirikartta
        </h2>
        {selectedBill ? (
          <p className="text-sm text-nordic-dark">
            Näytetään demokraattinen vaje: {selectedBill.title}
          </p>
        ) : (
          <p className="text-sm text-nordic-dark">
            Valitse laki nähdäksesi vaalipiirien kannat
          </p>
        )}
      </div>

      <div className="relative bg-white rounded-lg p-4 border border-nordic-gray">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 2800,
            center: [26, 64.5], // Center of Finland
          }}
          width={800}
          height={600}
          style={{ width: "100%", height: "auto" }}
        >
          <Geographies geography={geoData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const districtName = geo.properties.name;
                const stats = districtStatsMap[districtName];
                const agreement = stats?.agreement || 50;
                const fillColor = getDistrictColor(agreement);
                const isUserDistrict = userDistrict === districtName;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={isUserDistrict ? "#0066CC" : "#E5E7EB"}
                    strokeWidth={isUserDistrict ? 3 : 1}
                    style={{
                      default: {
                        fill: fillColor,
                        outline: "none",
                        cursor: "pointer",
                      },
                      hover: {
                        fill: fillColor,
                        outline: "none",
                        stroke: "#0066CC",
                        strokeWidth: 2,
                      },
                      pressed: {
                        fill: fillColor,
                        outline: "none",
                      },
                    }}
                    onMouseEnter={(event) => {
                      if (stats) {
                        const rect = (event.currentTarget as SVGElement)
                          .closest("svg")
                          ?.getBoundingClientRect();
                        if (rect) {
                          setTooltip({
                            district: districtName,
                            stats,
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                          });
                        }
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-white border-2 border-nordic-blue rounded-lg p-4 shadow-lg z-10 pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
              maxWidth: "250px",
            }}
          >
            <h3 className="font-bold text-nordic-darker mb-2">
              {tooltip.district}
              {userDistrict === tooltip.district && (
                <MapPin size={14} className="inline ml-2 text-nordic-blue" />
              )}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-nordic-dark">Kansan tahto:</span>
                <span className="font-semibold text-nordic-blue">
                  {tooltip.stats.citizenVote}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-nordic-dark">Eduskunta:</span>
                <span className="font-semibold text-nordic-deep">
                  {tooltip.stats.parliamentVote}%
                </span>
              </div>
              <div className="flex justify-between border-t border-nordic-gray pt-1 mt-1">
                <span className="text-nordic-dark">Ero:</span>
                <span
                  className={`font-semibold ${
                    tooltip.stats.gap > 30
                      ? "text-red-600"
                      : tooltip.stats.gap > 15
                      ? "text-amber-600"
                      : "text-green-600"
                  }`}
                >
                  {tooltip.stats.gap}%
                </span>
              </div>
              {tooltip.stats.agreement < 30 && (
                <div className="mt-2 pt-2 border-t border-red-200 flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle size={14} />
                  <span>Demokraattinen vaaravyöhyke</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white border-2 border-nordic-gray rounded-lg p-4 shadow-lg z-10">
          <h4 className="text-sm font-semibold text-nordic-darker mb-2">
            Demokraattinen vaje
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-nordic-gray"
                style={{ backgroundColor: "#10B981" }}
              />
              <span className="text-nordic-dark">Yhteensopiva (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-nordic-gray"
                style={{ backgroundColor: "#FBBF24" }}
              />
              <span className="text-nordic-dark">Kohtalainen (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-nordic-gray"
                style={{ backgroundColor: "#F59E0B" }}
              />
              <span className="text-nordic-dark">Merkittävä (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded border border-nordic-gray"
                style={{ backgroundColor: "#EF4444" }}
              />
              <span className="text-nordic-dark">
                Vaaravyöhyke (&lt;40%)
              </span>
            </div>
            {userDistrict && (
              <div className="mt-2 pt-2 border-t border-nordic-gray flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-nordic-blue rounded" />
                <span className="text-nordic-dark">Oma vaalipiiri</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedBill && (
        <div className="mt-4 p-4 bg-nordic-white rounded-lg border border-nordic-gray text-center">
          <p className="text-sm text-nordic-dark">
            Valitse laki listasta nähdäksesi vaalipiirien kannat kartalla
          </p>
        </div>
      )}
    </div>
  );
}

