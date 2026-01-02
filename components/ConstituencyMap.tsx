"use client";

import { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { AlertTriangle, MapPin } from "lucide-react";
import { getFinnishDistrictsGeoJSON } from "@/lib/finnish-districts-geo";
import type { Bill } from "@/lib/types";
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

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  return (
    <div className="md:p-6 p-0 bg-nordic-light md:rounded-2xl border-2 border-nordic-gray md:border-0">
      <div className="mb-4 px-4 pt-4 md:px-0 md:pt-0">
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

      {/* Mobile: Full screen map container */}
      <div className="relative bg-white md:rounded-lg p-2 md:p-4 border border-nordic-gray md:border-0 w-full md:w-auto h-[calc(100vh-200px)] md:h-auto md:min-h-[600px] overflow-hidden touch-pan-y touch-pan-x">
        {/* Zoom Controls - Mobile only */}
        <div className="md:hidden absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-nordic-gray p-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}
            className="w-10 h-10 flex items-center justify-center bg-nordic-blue text-white rounded touch-manipulation select-none"
            style={{ minWidth: "44px", minHeight: "44px" }}
            aria-label="Lähennä"
          >
            +
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="w-10 h-10 flex items-center justify-center bg-nordic-gray text-white rounded touch-manipulation select-none"
            style={{ minWidth: "44px", minHeight: "44px" }}
            aria-label="Loitonna"
          >
            −
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="w-10 h-10 flex items-center justify-center bg-nordic-dark text-white rounded text-xs touch-manipulation select-none"
            style={{ minWidth: "44px", minHeight: "44px" }}
            aria-label="Palauta"
          >
            ↻
          </button>
        </div>

        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
            width: "100%",
            height: "100%",
            touchAction: "pan-x pan-y pinch-zoom",
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              setIsDragging(true);
              setDragStart({
                x: e.touches[0].clientX - pan.x,
                y: e.touches[0].clientY - pan.y,
              });
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length === 1 && isDragging) {
              setPan({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
              });
            } else if (e.touches.length === 2) {
              // Pinch to zoom
              const touch1 = e.touches[0];
              const touch2 = e.touches[1];
              const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
              );
              // Simple pinch zoom - in production, use a library like react-zoom-pan-pinch
            }
          }}
          onTouchEnd={() => setIsDragging(false)}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2800 * zoom,
              center: [26, 64.5], // Center of Finland
            }}
            width={800}
            height={600}
            style={{ width: "100%", height: "100%" }}
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
        </div>

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

