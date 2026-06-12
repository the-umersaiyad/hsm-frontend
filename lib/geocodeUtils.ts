/**
 * Geocoding utilities for Google Maps integration.
 * Uses the Google Maps Geocoding API to convert coordinates to addresses.
 */

export interface GeocodedAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

/**
 * Reverse geocode coordinates to a structured address (city/state).
 * Requires the Google Maps Geocoding API to be loaded.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Object with city and state, or null if geocoding fails
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state: string } | null> {
  if (typeof google === "undefined" || !google.maps) {
    console.error("Google Maps API not loaded");
    return null;
  }

  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });

    if (!result.results[0]) return null;

    let city = "";
    let state = "";

    for (const component of result.results[0].address_components) {
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
    }

    return { city, state };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to a full structured address.
 * Extracts street, city, state, and zipCode from address components.
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Full address object or null if geocoding fails
 */
export async function reverseGeocodeFullAddress(
  lat: number,
  lng: number
): Promise<GeocodedAddress | null> {
  if (typeof google === "undefined" || !google.maps) {
    console.error("Google Maps API not loaded");
    return null;
  }

  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });

    if (!result.results[0]) return null;

    let street = "";
    let city = "";
    let state = "";
    let zipCode = "";

    for (const component of result.results[0].address_components) {
      const types = component.types;

      if (types.includes("street_number") || types.includes("route")) {
        street += (street ? " " : "") + component.long_name;
      }
      if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
        if (!street) street = component.long_name;
      }
      if (types.includes("locality")) {
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (types.includes("postal_code")) {
        zipCode = component.long_name;
      }
    }

    // If no street found, use the formatted address minus city/state/zip
    if (!street && result.results[0].formatted_address) {
      const parts = result.results[0].formatted_address.split(",");
      if (parts.length > 2) {
        street = parts.slice(0, -2).join(",").trim();
      }
    }

    return { street, city, state, zipCode };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}
