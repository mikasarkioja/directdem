/**
 * Finnish Electoral Districts (Vaalipiirit)
 * 
 * Finland has 13 electoral districts for parliamentary elections.
 * This is a simplified GeoJSON structure - in production, you would use
 * actual TopoJSON from Statistics Finland or similar source.
 */

export interface DistrictData {
  name: string;
  code: string;
  coordinates: [number, number][][]; // Simplified polygon coordinates
}

/**
 * Simplified coordinates for Finnish electoral districts
 * These are approximate center points and simplified boundaries
 * For production, use actual TopoJSON from:
 * - Statistics Finland (Tilastokeskus)
 * - Finnish Population Register Centre
 * - Or create from official boundary data
 */
export const FINNISH_DISTRICTS: DistrictData[] = [
  {
    name: "Helsinki",
    code: "01",
    coordinates: [[[24.9, 60.2], [25.0, 60.2], [25.0, 60.1], [24.9, 60.1], [24.9, 60.2]]],
  },
  {
    name: "Uusimaa",
    code: "02",
    coordinates: [[[24.5, 60.3], [25.5, 60.3], [25.5, 60.0], [24.5, 60.0], [24.5, 60.3]]],
  },
  {
    name: "Varsinais-Suomi",
    code: "03",
    coordinates: [[[22.0, 60.5], [23.0, 60.5], [23.0, 60.0], [22.0, 60.0], [22.0, 60.5]]],
  },
  {
    name: "Satakunta",
    code: "04",
    coordinates: [[[21.5, 61.5], [22.5, 61.5], [22.5, 61.0], [21.5, 61.0], [21.5, 61.5]]],
  },
  {
    name: "Ahvenanmaa",
    code: "05",
    coordinates: [[[19.8, 60.2], [20.2, 60.2], [20.2, 60.0], [19.8, 60.0], [19.8, 60.2]]],
  },
  {
    name: "Häme",
    code: "06",
    coordinates: [[[24.0, 61.0], [25.0, 61.0], [25.0, 60.5], [24.0, 60.5], [24.0, 61.0]]],
  },
  {
    name: "Pirkanmaa",
    code: "07",
    coordinates: [[[23.5, 61.5], [24.5, 61.5], [24.5, 61.0], [23.5, 61.0], [23.5, 61.5]]],
  },
  {
    name: "Kaakkois-Suomi",
    code: "08",
    coordinates: [[[27.0, 60.5], [28.0, 60.5], [28.0, 60.0], [27.0, 60.0], [27.0, 60.5]]],
  },
  {
    name: "Savo-Karjala",
    code: "09",
    coordinates: [[[27.0, 62.0], [30.0, 62.0], [30.0, 61.0], [27.0, 61.0], [27.0, 62.0]]],
  },
  {
    name: "Vaasa",
    code: "10",
    coordinates: [[[21.0, 63.0], [23.0, 63.0], [23.0, 62.0], [21.0, 62.0], [21.0, 63.0]]],
  },
  {
    name: "Keski-Suomi",
    code: "11",
    coordinates: [[[24.5, 62.5], [26.0, 62.5], [26.0, 61.5], [24.5, 61.5], [24.5, 62.5]]],
  },
  {
    name: "Oulu",
    code: "12",
    coordinates: [[[25.0, 65.5], [27.0, 65.5], [27.0, 64.5], [25.0, 64.5], [25.0, 65.5]]],
  },
  {
    name: "Lappi",
    code: "13",
    coordinates: [[[24.0, 68.0], [30.0, 68.0], [30.0, 66.0], [24.0, 66.0], [24.0, 68.0]]],
  },
];

/**
 * Creates a simplified GeoJSON structure for the districts
 * In production, replace this with actual TopoJSON data
 */
export function getFinnishDistrictsGeoJSON() {
  return {
    type: "FeatureCollection",
    features: FINNISH_DISTRICTS.map((district) => ({
      type: "Feature",
      properties: {
        name: district.name,
        code: district.code,
      },
      geometry: {
        type: "Polygon",
        coordinates: district.coordinates,
      },
    })),
  };
}



