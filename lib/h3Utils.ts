import { latLngToCell, cellToBoundary, cellsToMultiPolygon } from "h3-js";

export const H3_RESOLUTION = 7;

/**
 * Get the H3 cell ID at a given lat/lng point at resolution 7.
 */
export function getH3CellAtPoint(lat: number, lng: number): string {
  return latLngToCell(lat, lng, H3_RESOLUTION);
}

/**
 * Get the boundary coordinates of an H3 cell as [lat, lng] pairs.
 */
export function getH3CellBoundary(cellId: string): [number, number][] {
  return cellToBoundary(cellId);
}

/**
 * Convert an array of H3 cell IDs to a GeoJSON MultiPolygon.
 */
export function h3CellsToGeoJSON(cells: string[]): GeoJSON.MultiPolygon {
  const multiPolygon = cellsToMultiPolygon(cells, true);
  return { type: "MultiPolygon", coordinates: multiPolygon };
}

/**
 * Get all H3 cells that intersect a path of [lat, lng] points.
 */
export function getH3CellsInPath(path: [number, number][]): string[] {
  const cells = new Set<string>();
  for (const [lat, lng] of path) {
    cells.add(latLngToCell(lat, lng, H3_RESOLUTION));
  }
  return Array.from(cells);
}
