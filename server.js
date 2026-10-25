const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Set FRONTEND_ORIGIN to your deployed GitHub Pages URL in your hosting settings.
// During initial setup, an open CORS policy is used so the API can be tested easily.
// For production, restrict this to your exact website origin.
const allowedOrigin = process.env.FRONTEND_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Smart Kisan API",
    status: "running",
    endpoints: ["/api/health", "/api/weather?latitude=19.076&longitude=72.8777",
      "/api/geocode?city=Virar", "/api/farming-advice?rain=10&temperature=32"]
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Smart Kisan Backend" });
});

app.get("/api/geocode", async (req, res) => {
  const city = String(req.query.city || "").trim();
  if (!city) return res.status(400).json({ error: "Please provide a city query, e.g. ?city=Virar" });

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", city);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url);
    if (!response.ok) throw new Error("Geocoding service returned an error");
    const data = await response.json();

    res.json({
      results: (data.results || []).map(place => ({
        name: place.name,
        country: place.country || "",
        admin1: place.admin1 || "",
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone || "auto"
      }))
    });
  } catch (error) {
    console.error("Geocoding error:", error.message);
    res.status(502).json({ error: "Could not retrieve location data. Please try again." });
  }
});

app.get("/api/weather", async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      error: "Valid latitude and longitude are required."
    });
  }

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m");
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather service returned an error");
    const data = await response.json();

    res.json({
      location: { latitude, longitude, timezone: data.timezone || "auto" },
      current: data.current || null,
      hourly: data.hourly || null,
      daily: data.daily || null,
      source: "Open-Meteo",
      note: "Forecasts are guidance. Follow official local weather and agricultural advisories."
    });
  } catch (error) {
    console.error("Weather error:", error.message);
    res.status(502).json({ error: "Could not retrieve weather data. Please try again." });
  }
});

// Basic illustrative rules only; not a substitute for official warnings or agronomist advice.
app.get("/api/farming-advice", (req, res) => {
  const rain = Number(req.query.rain);
  const temperature = Number(req.query.temperature);
  if (!Number.isFinite(rain) || !Number.isFinite(temperature)) {
    return res.status(400).json({
      error: "Provide numeric rain (mm) and temperature (°C) query parameters."
    });
  }

  const advice = [];
  if (rain >= 50) advice.push("Heavy rainfall may be possible based on the value entered. Check official alerts and avoid working in unsafe fields.");
  else if (rain >= 10) advice.push("Rain may affect field activities. Check the local forecast before irrigation or spraying.");
  else advice.push("The entered rainfall amount is low. Check soil moisture before deciding whether irrigation is needed.");

  if (temperature >= 38) advice.push("High temperatures can stress crops. Consider local crop guidance for irrigation timing and heat protection.");
  else if (temperature <= 8) advice.push("Cool conditions may affect some crops. Check crop-specific local advisories.");

  if (advice.length === 1) advice.push("Use crop type, soil moisture, growth stage, and official local advice before making farm decisions.");

  res.json({
    input: { rainMm: rain, temperatureC: temperature },
    advice,
    disclaimer: "These are general illustrative suggestions, not a verified forecast or emergency alert."
  });
});

app.use((_req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Kisan API listening on port ${PORT}`);
});
