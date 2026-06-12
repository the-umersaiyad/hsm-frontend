import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { haversineDistance, isWithinGeoFence } from "@/lib/haversine";

/**
 * Arbitrary for valid latitude values [-90, 90]
 */
const latArb = fc.double({ min: -90, max: 90, noNaN: true });

/**
 * Arbitrary for valid longitude values [-180, 180]
 */
const lngArb = fc.double({ min: -180, max: 180, noNaN: true });

/**
 * Arbitrary for a valid coordinate pair [lat, lng]
 */
const coordArb = fc.tuple(latArb, lngArb);

/**
 * Arbitrary for a positive radius in meters (1m to 100km)
 */
const radiusArb = fc.double({ min: 1, max: 100_000, noNaN: true });

describe("Haversine Distance Properties", () => {
  /**
   * Property 3: Haversine Distance Symmetry
   * **Validates: Requirements 15.5**
   *
   * For all coordinate pairs (A, B), haversineDistance(A, B) === haversineDistance(B, A)
   */
  it("Property 3 — Symmetry: haversineDistance(A, B) === haversineDistance(B, A)", () => {
    fc.assert(
      fc.property(coordArb, coordArb, ([lat1, lng1], [lat2, lng2]) => {
        const d1 = haversineDistance(lat1, lng1, lat2, lng2);
        const d2 = haversineDistance(lat2, lng2, lat1, lng1);
        // Use relative tolerance for floating point comparison
        expect(d1).toBeCloseTo(d2, 10);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Haversine Distance Non-Negativity
   * **Validates: Requirements 15.6**
   *
   * For all coordinate pairs, haversineDistance >= 0
   */
  it("Property 4 — Non-Negativity: haversineDistance(A, B) >= 0", () => {
    fc.assert(
      fc.property(coordArb, coordArb, ([lat1, lng1], [lat2, lng2]) => {
        const d = haversineDistance(lat1, lng1, lat2, lng2);
        expect(d).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Haversine Distance Identity
   * **Validates: Requirements 15.7**
   *
   * For all coordinates A, haversineDistance(A, A) === 0
   */
  it("Property 5 — Identity: haversineDistance(A, A) === 0", () => {
    fc.assert(
      fc.property(coordArb, ([lat, lng]) => {
        const d = haversineDistance(lat, lng, lat, lng);
        expect(d).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: Geo-Fence Trigger Correctness
   * **Validates: Requirements 15.8**
   *
   * If haversineDistance(S, C) * 1000 <= R, then isWithinGeoFence === true
   */
  it("Property 6 — Geo-Fence Trigger: if distance * 1000 <= radius, then isWithinFence is true", () => {
    fc.assert(
      fc.property(
        coordArb,
        coordArb,
        radiusArb,
        ([staffLat, staffLng], [custLat, custLng], radius) => {
          const distKm = haversineDistance(staffLat, staffLng, custLat, custLng);
          const distMeters = distKm * 1000;
          const withinFence = isWithinGeoFence(
            staffLat,
            staffLng,
            custLat,
            custLng,
            radius
          );

          if (distMeters <= radius) {
            expect(withinFence).toBe(true);
          }
          // We only assert the forward implication:
          // distance <= radius => isWithinFence === true
          // The reverse is also true by definition, but we test the stated property.
        }
      ),
      { numRuns: 100 }
    );
  });
});
