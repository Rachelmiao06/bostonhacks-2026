/** BU-area places shown as floating pixel sprites on the map. Text, links and positions live here only. */

export type BuPlace = {
  /** Also the sprite file name: /assets/bu/<id>.webp */
  id: string;
  name: string;
  kind: "history" | "food";
  longitude: number;
  latitude: number;
  /** Two or three short lines, shown when the sprite is tapped. */
  intro: string;
  url: string;
  /** Text on the link button. */
  linkLabel: string;
};

const maps = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

export const text = {
  kind: { history: "History", food: "Local food" },
  close: "Close",
  open: (name: string) => `About ${name}`,
  /** Sprite width in px at map scale 1, by kind. */
  width: { history: 64, food: 42 },
  /** The map zoom from which each kind appears (food spots sit a few metres apart). */
  minZoom: { history: 11, food: 15.5 },
};

export const buPlaces: BuPlace[] = [
  {
    id: "gsu", name: "George Sherman Union", kind: "history", longitude: -71.1089756, latitude: 42.3509672,
    intro: "Boston University's student centre at 775 Commonwealth Ave. If you are at the demo, you are standing right here.",
    url: "https://www.bu.edu/reservations/gsu/", linkLabel: "Visit BU's GSU page",
  },
  {
    id: "marsh-chapel", name: "Marsh Chapel", kind: "history", longitude: -71.1064383, latitude: 42.3506624,
    intro: "BU's chapel. Howard Thurman, its dean from 1953 to 1965, mentored Martin Luther King Jr., who earned his PhD at BU. On April 5, 1968, BU gathered on Marsh Plaza to remember King.",
    url: "https://www.bu.edu/chapel/", linkLabel: "Visit Marsh Chapel",
  },
  {
    id: "citgo-sign", name: "Citgo Sign", kind: "history", longitude: -71.0962252, latitude: 42.3493032,
    intro: "This triangle has glowed over Kenmore Square since 1965, on a BU-owned building at 660 Beacon St. In 2018 the Boston Landmarks Commission voted to designate it a landmark.",
    url: "https://www.bu.edu/articles/2009/icons-among-us-the-citgo-sign", linkLabel: "Read BU's story",
  },
  {
    id: "esplanade", name: "Charles River Esplanade", kind: "history", longitude: -71.110661, latitude: 42.3523906,
    intro: "A three-mile riverside park for walking, running and sitting by the water. The BU Bridge marks its western end, a short walk from campus.",
    url: "https://esplanade.org/the-esplanade", linkLabel: "Visit the Esplanade",
  },
  {
    id: "mapparium", name: "Mapparium", kind: "history", longitude: -71.0862018, latitude: 42.3451224,
    intro: "A stained-glass globe you can walk inside, finished in 1935 at the Mary Baker Eddy Library. The glass does not soak up sound, so a whisper carries across the room.",
    url: "https://www.marybakereddylibrary.org/visit/", linkLabel: "Plan your visit",
  },
  // Food spots are real local businesses: never attach an offer or a discount to them.
  // Display positions on Commonwealth Ave are nudged a few metres apart so the sprites do not overlap.
  {
    id: "university-grill", name: "University Grill and Pizza", kind: "food", longitude: -71.105578, latitude: 42.349595,
    intro: "Greek food and pizza at 712 Commonwealth Ave, right on the BU strip.",
    url: maps("University Grill and Pizza 712 Commonwealth Ave Boston"), linkLabel: "Open in Maps",
  },
  {
    id: "crispy-crepes", name: "Crispy Crêpes Café", kind: "food", longitude: -71.1048, latitude: 42.34966,
    intro: "A crêpe café at 714 Commonwealth Ave, a few minutes' walk from the GSU.",
    url: maps("Crispy Crepes Cafe 714 Commonwealth Ave Boston"), linkLabel: "Open in Maps",
  },
  {
    id: "pavement-coffee", name: "Pavement Coffeehouse", kind: "food", longitude: -71.1068, latitude: 42.34985,
    intro: "A coffeehouse on Commonwealth Ave near BU Central. Check the hours before you walk over.",
    url: "https://pavementcoffeehouse.com/", linkLabel: "Visit website",
  },
  {
    id: "nud-pob", name: "Nud Pob", kind: "food", longitude: -71.1078, latitude: 42.34993,
    intro: "A Thai restaurant at 738 Commonwealth Ave, steps from the GSU.",
    url: maps("Nud Pob 738 Commonwealth Ave Boston"), linkLabel: "Open in Maps",
  },
  {
    id: "sausage-guy", name: "The Sausage Guy", kind: "food", longitude: -71.097357, latitude: 42.347243,
    intro: "A game-day sausage stand on Lansdowne Street, steps from Fenway Park.",
    url: maps("The Sausage Guy 49 Lansdowne St Boston"), linkLabel: "Open in Maps",
  },
  {
    id: "loco-taqueria", name: "Loco Taqueria & Oyster Bar", kind: "food", longitude: -71.098989, latitude: 42.347,
    intro: "Tacos and oysters at 61 Brookline Ave, near Fenway Park.",
    url: maps("Loco Taqueria Oyster Bar 61 Brookline Ave Boston"), linkLabel: "Open in Maps",
  },
];
