// GET /api/stations: all 125 subway stations (name, position, lines) and the station order along each route.
// Static data saved from MBTA; use it to draw the map. Positions are real latitude and longitude.
import { routeOrder, stations } from "@/lib/mbta";

export async function GET() {
  return Response.json({ stations, routeOrder });
}
