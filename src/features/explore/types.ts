// Shape of the data served by /api/subway (built from the MBTA V3 API).

export type SubwayLine = {
  /** "Red", "Mattapan", "Orange", "Green" (branches B-E grouped), "Blue". */
  id: string;
  name: string;
  /** Official MBTA colour, straight from the API, as "#RRGGBB". */
  color: string;
  stationCount: number;
};

export type SubwayStation = {
  /** MBTA parent station id, e.g. "place-pktrm". */
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  lineIds: string[];
};

export type SubwayShape = {
  lineId: string;
  /** Google encoded polyline, decoded in src/lib/map.ts. */
  polyline: string;
};

export type SubwayData = {
  /** "snapshot" means the MBTA API could not be reached and saved data was used. */
  source: "live" | "snapshot";
  lines: SubwayLine[];
  stations: SubwayStation[];
  shapes: SubwayShape[];
};

// Shape of the data served by /api/subway/live (changes every few seconds).

export type LiveTrain = {
  id: string;
  lineId: string;
  longitude: number;
  latitude: number;
};

export type ElevatorOutage = {
  /** MBTA parent station id, matches SubwayStation.id. */
  stationId: string;
  /** The MBTA's own alert text, unedited. */
  header: string;
};

export type LiveData = {
  /** "snapshot" means saved sample data, not what is happening now. */
  source: "live" | "snapshot";
  trains: LiveTrain[];
  outages: ElevatorOutage[];
};
