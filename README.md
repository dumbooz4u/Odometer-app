# Odometer

A browser-based GPS speedometer and odometer with a live map and weather-reactive UI.

## Features

- **Real-time speed** — derived from the device's GPS via `navigator.geolocation.watchPosition`, falling back to a distance/time calculation between fixes when the browser doesn't report speed directly.
- **Trip odometer** — accumulates distance traveled this session, filtering out low-accuracy or stationary GPS jitter.
- **Live map** — current position plotted on [OpenStreetMap](https://www.openstreetmap.org/) tiles via [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/), auto-recentering as you move.
- **Real-time weather** — current conditions for your GPS location from the free [Open-Meteo](https://open-meteo.com/) API (no API key required).
- **Weather-reactive UI** — the background theme (clear / cloudy / rain / snow / storm / fog, day or night) changes based on current weather conditions.
- Toggle between km/h + km and mph + miles.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in a browser that supports Geolocation (HTTPS or `localhost` required) and grant location permission when prompted.

## Build

```bash
npm run build
```

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Leaflet](https://leafletjs.com/) / [react-leaflet](https://react-leaflet.js.org/) with OpenStreetMap tiles
- [Open-Meteo](https://open-meteo.com/) for weather data
