// Boston 311 service names (the `service_name` column in Analyze Boston) that a resident can photograph on the street,
// with the team that usually handles each. Checked against the live data on 2026-11-21.
// The AI may only pick from this list. Never invent a category.
export const CATEGORIES: { name: string; team: string }[] = [
  { name: "Pothole", team: "PWD Highway" },
  { name: "Sidewalk Repair", team: "PWD Highway" },
  { name: "Street Light Outage", team: "PWD Street Lighting" },
  { name: "Litter & Debris", team: "PWD Highway" },
  { name: "Illegal Dumping or Disposal", team: "PWD Code Enforcement" },
  { name: "Overflowing Trash", team: "PWD Code Enforcement" },
  { name: "Illegal Graffiti", team: "PWD Highway" },
  { name: "Missing / Knocked Down Sign", team: "BTD Traffic Investigation" },
  { name: "Fallen Tree or Branches", team: "Urban Forestry" },
  { name: "Illegally Blocked Sidewalk", team: "PWD Code Enforcement" },
  { name: "Needle Pickup", team: "BPHC Recovery Services" },
  { name: "Dead Animal General", team: "PWD Highway" },
  { name: "Rat Activity", team: "ISD Environmental" },
  { name: "Illegal Parking", team: "BTD Parking" },
  { name: "Abandoned Vehicles", team: "BTD Parking" },
  { name: "Overgrown Weeds", team: "PWD Code Enforcement" },
  { name: "Broken Park Equipment", team: "BPRD Parks Trades" },
  { name: "Other", team: "311 Supervisors" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const teamFor = (serviceName: string) => CATEGORIES.find((c) => c.name === serviceName)?.team ?? "311 Supervisors";
