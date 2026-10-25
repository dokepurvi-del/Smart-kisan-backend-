# Smart Kisan Backend

A ready-to-deploy Express API starter for the Smart Kisan weather website.

## What it provides

- `GET /api/health` — health check
- `GET /api/geocode?city=Virar` — find coordinates for a place
- `GET /api/weather?latitude=19.076&longitude=72.8777` — current conditions and a 7-day forecast via Open-Meteo
- `GET /api/farming-advice?rain=10&temperature=32` — simple illustrative suggestions

No API key is required for these Open-Meteo endpoints. The advice endpoint is deliberately basic and is not an official warning service.

## Deploy on Render

1. Put the contents of this folder in a GitHub repository.
2. In Render, create **New → Web Service** and connect that repository.
3. Use build command: `npm install`
4. Use start command: `npm start`
5. Deploy and copy the public service URL.
6. Optional: set environment variable `FRONTEND_ORIGIN` to your exact GitHub Pages origin, for example `https://YOUR-USERNAME.github.io`. If your project is served from a project path, the origin is still the domain part only.

## Connect the frontend

After deployment, replace `YOUR-BACKEND-URL` below with the real URL Render gives you:

```js
const BACKEND_URL = "https://YOUR-BACKEND-URL";

async function searchSmartKisanLocation(city) {
  const response = await fetch(
    `${BACKEND_URL}/api/geocode?city=${encodeURIComponent(city)}`
  );
  if (!response.ok) throw new Error("Could not find that location");
  return response.json();
}

async function getSmartKisanWeather(latitude, longitude) {
  const params = new URLSearchParams({ latitude, longitude });
  const response = await fetch(`${BACKEND_URL}/api/weather?${params}`);
  if (!response.ok) throw new Error("Could not load weather");
  return response.json();
}
```

Example use:

```js
searchSmartKisanLocation("Virar").then(console.log).catch(console.error);
getSmartKisanWeather(19.4559, 72.8114).then(console.log).catch(console.error);
```

## Important limitation

This package is the backend service, not a direct edit to the live GitHub Pages repository. The live website's source files were not supplied in this chat, and the backend must be deployed before the frontend can call it. GitHub Pages hosts static files; it does not run Node.js server code.
