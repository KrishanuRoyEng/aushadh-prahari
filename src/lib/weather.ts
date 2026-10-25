/**
 * weather.ts — Open-Meteo forecast + heat index + caching
 *
 * Uses Open-Meteo (free, no API key required).
 * Falls back to manual heat level entry when offline.
 */

import { computeHeatIndex, isHeatDay } from "./risk";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayForecast {
  date: string; // ISO date string YYYY-MM-DD
  maxTempCelsius: number;
  minTempCelsius: number;
  avgHumidityPercent: number;
  heatIndex: number;
  isHeatDay: boolean;
  precipitationMm: number;
  weatherCode: number;
}

export interface ForecastResult {
  location: { lat: number; lon: number };
  fetchedAt: string;
  days: DayForecast[];
  source: "open-meteo" | "manual";
}

export interface LocationPrefs {
  lat: number;
  lon: number;
  label: string;
}

const CACHE_KEY = "ap_weather_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Location helpers ─────────────────────────────────────────────────────────

export function getStoredLocation(): LocationPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("ap_location");
    return raw ? (JSON.parse(raw) as LocationPrefs) : null;
  } catch {
    return null;
  }
}

export function setStoredLocation(loc: LocationPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("ap_location", JSON.stringify(loc));
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface WeatherCache {
  result: ForecastResult;
  expiresAt: number;
}

function getCachedForecast(): ForecastResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: WeatherCache = JSON.parse(raw);
    if (Date.now() > cache.expiresAt) return null;
    return cache.result;
  } catch {
    return null;
  }
}

function setCachedForecast(result: ForecastResult): void {
  if (typeof window === "undefined") return;
  const cache: WeatherCache = {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ─── Fetch from Open-Meteo ────────────────────────────────────────────────────

async function fetchFromOpenMeteo(lat: number, lon: number): Promise<ForecastResult> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,relativehumidity_2m_max,relativehumidity_2m_min"
  );
  url.searchParams.set("timezone", "Asia/Kolkata");
  url.searchParams.set("forecast_days", "3");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    const data = await res.json();

    const days: DayForecast[] = (data.daily.time as string[]).map(
      (date: string, i: number) => {
        const maxTemp: number = data.daily.temperature_2m_max[i];
        const humidity: number = Math.round(
          ((data.daily.relativehumidity_2m_max[i] as number) +
            (data.daily.relativehumidity_2m_min[i] as number)) /
            2
        );
        const hi = computeHeatIndex(maxTemp, humidity);
        return {
          date,
          maxTempCelsius: maxTemp,
          minTempCelsius: data.daily.temperature_2m_min[i],
          avgHumidityPercent: humidity,
          heatIndex: Math.round(hi * 10) / 10,
          isHeatDay: isHeatDay(maxTemp, humidity),
          precipitationMm: data.daily.precipitation_sum[i],
          weatherCode: data.daily.weathercode[i],
        };
      }
    );

    const result: ForecastResult = {
      location: { lat, lon },
      fetchedAt: new Date().toISOString(),
      days,
      source: "open-meteo",
    };

    setCachedForecast(result);
    return result;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export async function fetchForecast(
  lat: number,
  lon: number,
  forceRefresh = false
): Promise<ForecastResult> {
  if (!forceRefresh) {
    const cached = getCachedForecast();
    if (cached) return cached;
  }

  try {
    return await fetchFromOpenMeteo(lat, lon);
  } catch {
    // Offline or error: return empty result that triggers manual entry
    return {
      location: { lat, lon },
      fetchedAt: new Date().toISOString(),
      days: [],
      source: "manual",
    };
  }
}

// ─── Manual heat entry (offline fallback) ─────────────────────────────────────

export function manualForecast(
  lat: number,
  lon: number,
  days: { date: string; heatIndex: number }[]
): ForecastResult {
  return {
    location: { lat, lon },
    fetchedAt: new Date().toISOString(),
    source: "manual",
    days: days.map((d) => ({
      date: d.date,
      maxTempCelsius: 0,
      minTempCelsius: 0,
      avgHumidityPercent: 0,
      heatIndex: d.heatIndex,
      isHeatDay: d.heatIndex >= 41,
      precipitationMm: 0,
      weatherCode: 0,
    })),
  };
}

export function buildManualForecast(
  temp: number,
  humidity: number,
  lat = 22.9868,
  lon = 87.855
): ForecastResult {
  const hi = computeHeatIndex(temp, humidity);
  const today = new Date();
  const days: DayForecast[] = [0, 1, 2].map((offset) => {
    const d = new Date(today.getTime() + offset * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    return {
      date: dateStr,
      maxTempCelsius: temp,
      minTempCelsius: temp - 8,
      avgHumidityPercent: humidity,
      heatIndex: hi,
      isHeatDay: isHeatDay(temp, humidity),
      precipitationMm: 0,
      weatherCode: 0,
    };
  });

  return {
    location: { lat, lon },
    fetchedAt: new Date().toISOString(),
    days,
    source: "manual",
  };
}
