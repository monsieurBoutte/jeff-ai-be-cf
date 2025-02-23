import { zodResponseFormat } from "openai/helpers/zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { z } from "zod";

import type { GeocodingResponse, WeatherResponse } from "@/lib/openweathermap.types";
import type { AppRouteHandler } from "@/lib/types";

import type { GeocodeRoute, GetRoute } from "./weather.routes";

export const get: AppRouteHandler<GetRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { lat, lon, lang = "en", units = "imperial" } = c.req.valid("query");

  try {
    const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely&lang=${lang}&units=${units}&appid=${c.env.OPENWEATHER_API_KEY}`);
    const data: WeatherResponse = await response.json();
    return c.json(
      { message: "Weather data retrieved successfully", data },
      HttpStatusCodes.OK,
    );
  }
  catch (error) {
    console.error("Weather error:", error);
    return c.json(
      { error: "Failed to get weather information" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const geocode: AppRouteHandler<GeocodeRoute> = async (c) => {
  const user = c.var.user;
  if (!user) {
    return c.json({ error: "Unauthorized" }, HttpStatusCodes.UNAUTHORIZED);
  }

  const { q, limit = "5" } = c.req.valid("query");

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${c.env.OPENWEATHER_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`OpenWeather API responded with status: ${response.status}`);
    }

    const data: GeocodingResponse[] = await response.json();
    return c.json(data, HttpStatusCodes.OK);
  }
  catch (error) {
    console.error("Geocoding error:", error);
    return c.json(
      { error: "Failed to get location coordinates" },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};
