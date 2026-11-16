# Travel Itinerary — Map & Timeline Viewer

A clean, read-only travel itinerary viewer built with **React + Vite + Tailwind CSS + Leaflet (OpenStreetMap) + SheetJS (`xlsx`)**.

## Features
- **Interactive Map + Timeline List**:
  - **Split View**: Side-by-side timeline list and interactive map on desktop.
  - **Timeline List View**: Distraction-free vertical timeline grouped by day.
  - **Map View**: Full-screen map with numbered markers (`1`, `2`, `3`...) in visit order and dashed route lines connecting each day's stops.
- **Detailed Place View**: Click any stop on the timeline or map to inspect full details (Day, Date, Time, Category, Address, Activity/Notes, Cost, Booking status, distance from previous stop, and one-click **Google Maps** & **Directions** links).
- **Excel Upload & Preloaded Template**:
  - Preloads [public/sample-itinerary.xlsx](./public/sample-itinerary.xlsx) on startup.
  - Drag and drop any `.xlsx`, `.xls`, or `.csv` file anywhere onto the page (or click **Upload Excel**).
  - Supports multi-sheet workbooks with a sheet selector in the top bar.
- **Smart Location Resolution**:
  - Uses explicit `Lat` & `Lng` columns if present.
  - Extracts coordinates automatically from Google Maps links (`@lat,lng` or `?q=lat,lng`).
  - Automatically geocodes `Place` + `Address` using OpenStreetMap (Photon / Nominatim) with browser `localStorage` caching.

## Supported Excel Columns

Your Excel sheet can use any of these column headers (case-insensitive):

| Column | Accepted Header Names | Description |
| :--- | :--- | :--- |
| **Day** | `Day`, `Day #`, `Day Number` | e.g., `Day 1`, `Day 2`, or `1`, `2` |
| **Date** | `Date`, `Travel Date` | e.g., `2026-04-10` |
| **Time** | `Time`, `Start Time`, `Schedule` | e.g., `09:00 AM` |
| **Place** | `Place`, `Location`, `Destination`, `Spot`, `Name` | Name of the place to visit |
| **Address** | `Address`, `Area`, `City`, `Street` | Address or area for map lookup |
| **Category** | `Category`, `Type`, `Tag` | e.g., `Sightseeing`, `Food`, `Museum`, `Shopping`, `Hotel` |
| **Activity** | `Activity`, `Notes`, `Description`, `Details` | What you'll do there / notes |
| **Cost** | `Cost`, `Price`, `Budget`, `Fee` | Estimated cost or ticket price |
| **Booking** | `Booking`, `Reservation`, `Status` | Booking status or reference number |
| **Link** | `Link`, `URL`, `Website`, `Google Maps` | Website URL or Google Maps link |
| **Lat / Lng** | `Lat` / `Lng` (`Latitude` / `Longitude`) | *(Optional)* Explicit coordinates |

*(Any additional custom columns in your Excel sheet will also be displayed automatically inside the Detailed Place View!)*

## Getting Started

```bash
# Start development server
npm run dev

# Regenerate the sample Excel file
npm run generate-sample

# Build for production
npm run build
```
