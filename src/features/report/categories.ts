// Boston 311 service names (the `service_name` column in Analyze Boston) that a resident can photograph on the street,
// with the team that usually handles each. Checked against the live data on 2026-11-21.
// The AI may only pick from this list. Never invent a category.
// `form` is the category's form on 311.boston.gov. `prefill` is true when that form's first step has a description box that a link can fill
// (checked on 2026-11-22: Rat Activity starts with the location instead). No `form` (Overgrown Weeds, Other) means we open the 311 home page.
export const CATEGORIES: { name: string; team: string; form?: { code: string; prefill: boolean } }[] = [
  { name: "Pothole", team: "PWD Highway", form: { code: "9aaa7721-e212-4d16-a77e-d8f8d2f4ba28", prefill: true } },
  { name: "Sidewalk Repair", team: "PWD Highway", form: { code: "e2b57b17-1274-4440-a909-6632d65b2540", prefill: true } },
  { name: "Street Light Outage", team: "PWD Street Lighting", form: { code: "d60952e6-4ac3-4d69-96f2-1953bc410beb", prefill: true } },
  { name: "Litter & Debris", team: "PWD Highway", form: { code: "155a5e9b-8c3a-4279-bbab-f6bba6ddb0d0", prefill: true } },
  { name: "Illegal Dumping or Disposal", team: "PWD Code Enforcement", form: { code: "60b145be-aef5-4a3c-8754-51472cf44088", prefill: true } },
  { name: "Overflowing Trash", team: "PWD Code Enforcement", form: { code: "c8e719d6-06ce-4375-813d-dccb3ca66402", prefill: true } },
  { name: "Illegal Graffiti", team: "PWD Highway", form: { code: "aeab655f-9331-4a20-9466-d2713b7ac429", prefill: true } },
  { name: "Missing / Knocked Down Sign", team: "BTD Traffic Investigation", form: { code: "9d831d9f-04e8-493b-bee2-4cbe1eeea23d", prefill: true } },
  { name: "Fallen Tree or Branches", team: "Urban Forestry", form: { code: "0b156710-caa0-4f5d-a4e0-23f2fc5cdc1e", prefill: true } },
  { name: "Illegally Blocked Sidewalk", team: "PWD Code Enforcement", form: { code: "8bb9966d-957c-4f41-810d-652f64878951", prefill: true } },
  { name: "Needle Pickup", team: "BPHC Recovery Services", form: { code: "d29084c4-45ef-42a7-b431-e0d8e5e773c3", prefill: true } },
  { name: "Dead Animal General", team: "PWD Highway", form: { code: "8f2cc595-aa65-4aa2-8bdc-5af4258f7167", prefill: true } },
  { name: "Rat Activity", team: "ISD Environmental", form: { code: "1f1e2053-ab17-48a9-9bba-7995ce3bbb25", prefill: false } },
  { name: "Illegal Parking", team: "BTD Parking", form: { code: "3584f86f-3576-4cc3-93a4-9146b9302822", prefill: true } },
  { name: "Abandoned Vehicles", team: "BTD Parking", form: { code: "90a7cce4-588f-40bf-b33b-f2297d9fb483", prefill: true } },
  { name: "Overgrown Weeds", team: "PWD Code Enforcement" },
  { name: "Broken Park Equipment", team: "BPRD Parks Trades", form: { code: "76403f83-3f4b-42cd-9f4d-a71c7ecbc4fd", prefill: true } },
  { name: "Other", team: "311 Supervisors" },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const teamFor = (serviceName: string) => CATEGORIES.find((c) => c.name === serviceName)?.team ?? "311 Supervisors";

const FORM_BASE = "https://311.boston.gov/tickets/new";

/**
 * Where "Open Boston 311" goes. With a known category it opens that category's own form, and (where the form allows it) with the description
 * already filled in. The photo and the place cannot be filled by a link: the person adds them there and submits. Unknown category: the home page.
 */
export function bostonFormUrl(serviceName: string, description: string, home: string) {
  const form = CATEGORIES.find((c) => c.name === serviceName)?.form;
  if (!form) return { url: home, filled: false };
  const q = new URLSearchParams({ "submission[ticket_type_code]": form.code });
  if (form.prefill) q.set("submission[details][spot:description]", description.trim().slice(0, 600));
  return { url: `${FORM_BASE}?${q}`, filled: form.prefill };
}
