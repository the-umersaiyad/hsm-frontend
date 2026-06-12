"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

export interface PlacesAutocompleteAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
}

interface PlacesAutocompleteProps {
  onAddressSelect: (address: PlacesAutocompleteAddress) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
}

export function PlacesAutocomplete({
  onAddressSelect,
  placeholder = "Search for an address...",
  defaultValue = "",
  className,
}: PlacesAutocompleteProps) {
  const placesLib = useMapsLibrary("places");
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);

  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize services when places library loads
  useEffect(() => {
    if (!placesLib) return;

    try {
      autocompleteServiceRef.current =
        new placesLib.AutocompleteService();

      // PlacesService needs a DOM element or map
      const dummyDiv = document.createElement("div");
      placesServiceRef.current = new placesLib.PlacesService(dummyDiv);
      setError(null);
    } catch (err) {
      setError("Failed to initialize Places API");
      console.error("Places API initialization error:", err);
    }
  }, [placesLib]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    (input: string) => {
      if (!autocompleteServiceRef.current || input.length < 3) {
        setSuggestions([]);
        setNoResults(false);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: "in" },
        },
        (predictions, status) => {
          setIsLoading(false);

          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(predictions.slice(0, 5));
            setNoResults(false);
            setIsOpen(true);
          } else if (
            status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            setSuggestions([]);
            setNoResults(true);
            setIsOpen(true);
          } else if (
            status !== google.maps.places.PlacesServiceStatus.OK
          ) {
            setError("Failed to fetch suggestions. You can type manually.");
            setSuggestions([]);
            setIsOpen(false);
          }
        }
      );
    },
    []
  );

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setInputValue(prediction.description);
    setIsOpen(false);
    setSuggestions([]);

    // Get place details to extract address components
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "geometry"],
      },
      (place, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place
        ) {
          setError("Failed to get address details");
          return;
        }

        let street = "";
        let city = "";
        let state = "";
        let zipCode = "";
        let latitude: number | undefined;
        let longitude: number | undefined;

        if (place.geometry?.location) {
          latitude = place.geometry.location.lat();
          longitude = place.geometry.location.lng();
        }

        if (place.address_components) {
          for (const component of place.address_components) {
            const types = component.types;

            if (types.includes("street_number") || types.includes("route")) {
              street += (street ? " " : "") + component.long_name;
            }
            if (
              types.includes("sublocality_level_1") ||
              types.includes("sublocality")
            ) {
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
        }

        // If no street found, use the first part of the description
        if (!street) {
          const parts = prediction.description.split(",");
          street = parts[0]?.trim() || "";
        }

        onAddressSelect({
          street,
          city,
          state,
          zipCode,
          latitude,
          longitude,
        });
      }
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0 || noResults) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="pl-10"
          aria-label="Address search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
          role="listbox"
        >
          {noResults && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No results found
            </div>
          )}
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              type="button"
              className="flex w-full items-start gap-2 px-3 py-2 text-sm hover:bg-accent cursor-pointer text-left"
              onClick={() => handleSelect(prediction)}
              role="option"
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-medium truncate">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
