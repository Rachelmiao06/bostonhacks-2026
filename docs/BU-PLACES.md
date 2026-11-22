# BU area places (for pixel landmarks on the map)

Picked for the demo at George Sherman Union (GSU), Boston University, 2026-11-22.
Each place gets one pixel sprite, floating on the 3D map. Tapping it opens a short intro and a link.

Status key: **checked** = link or fact seen on an official or BU page while researching. **unchecked** = from memory, open it before the demo.
Food spots are real local businesses: show no offers or discounts on them (see `docs/DECISIONS.md`).

## History and landmarks

| id | Name | Address / area | Intro for the popup (2 to 3 lines) | Link | Status |
|---|---|---|---|---|---|
| `gsu` | George Sherman Union (GSU) | 775 Commonwealth Ave, BU | The student centre of Boston University. You are here. | https://www.bu.edu/gsu/ | unchecked |
| `marsh-chapel` | Marsh Chapel and Marsh Plaza | 735 Commonwealth Ave, BU | BU's chapel. Howard Thurman, dean 1953 to 1965, mentored Martin Luther King Jr. (BU PhD). The day after King was killed in 1968, BU held a memorial on Marsh Plaza. | https://www.bu.edu/chapel/ | checked (BU pages) |
| `citgo-sign` | Citgo Sign | 660 Beacon St, Kenmore Square | A Boston icon above Kenmore Square. The current sign went up in 1965. Boston's Landmarks Commission voted to designate it a landmark in 2018. | https://www.bu.edu/articles/2009/icons-among-us-the-citgo-sign | checked |
| `fenway-park` | Fenway Park | 4 Jersey St, Fenway | Home of the Red Sox. A 60 minute guided tour runs through the year. (Sprite `fenway-park` already exists in `PixelLandmark.tsx`.) | https://www.mlb.com/redsox/ballpark/tours | checked |
| `esplanade` | Charles River Esplanade and BU Bridge | along the Charles, behind BU | A three mile riverside park. The BU Bridge is its western end. | https://esplanade.org/the-esplanade | checked |
| `mapparium` | Mapparium, Mary Baker Eddy Library | 200 Massachusetts Ave, Christian Science Plaza | A stained glass globe you walk inside, finished in 1935. Its sound bounces around like a whispering gallery. The library is free, the Mapparium costs a ticket. | https://www.marybakereddylibrary.org/ | unchecked |

## Food (all marked local in `src/lib/data/nearby-places.json`)

| id | Name | Type | Address | lat, lon | Link | Status |
|---|---|---|---|---|---|---|
| `nud-pob` | Nud Pob | Thai restaurant | 738 Commonwealth Ave | 42.349859, -71.10731 | https://www.google.com/maps/search/?api=1&query=Nud+Pob+738+Commonwealth+Ave+Boston | map link |
| `crispy-crepes` | Crispy Crêpes Café | Crêpes | 714 Commonwealth Ave | 42.349611, -71.105658 | https://www.google.com/maps/search/?api=1&query=Crispy+Crepes+Cafe+714+Commonwealth+Ave+Boston | map link |
| `university-grill` | University Grill and Pizza | Greek and pizza | 712 Commonwealth Ave | 42.349595, -71.105578 | https://www.google.com/maps/search/?api=1&query=University+Grill+and+Pizza+712+Commonwealth+Ave+Boston | map link |
| `pavement-coffee` | Pavement Coffeehouse | Coffee | 736 Commonwealth Ave | 42.349846, -71.107209 | https://pavementcoffeehouse.com/ | **verify open**: one listing says this branch closed |
| `cafe-472` | Cafe 472 | Restaurant | 472 Commonwealth Ave | 42.348573, -71.093677 | https://www.google.com/maps/search/?api=1&query=Cafe+472+472+Commonwealth+Ave+Boston | map link. Use if Pavement is closed |
| `sausage-guy` | The Sausage Guy | Sausages, game days | 49 Lansdowne St | 42.347243, -71.097357 | https://www.google.com/maps/search/?api=1&query=The+Sausage+Guy+49+Lansdowne+St+Boston | map link |
| `loco-taqueria` | Loco Taqueria and Oyster Bar | Mexican and oysters | 61 Brookline Ave | 42.347, -71.098989 | https://www.google.com/maps/search/?api=1&query=Loco+Taqueria+Oyster+Bar+61+Brookline+Ave+Boston | map link |

Historic spots have no coordinates yet. Fill them in from Google Maps (right click, copy lat/lon) before placing them.

## Sources

- https://www.bu.edu/articles/2018/martin-luther-king-jr-events/
- https://www.bu.edu/articles/2009/icons-among-us-the-citgo-sign
- https://www.wbur.org/news/2018/11/14/citgo-sign-landmark-designation
- https://mlb.com/redsox/ballpark/tours
- https://esplanade.org/the-esplanade
- OpenStreetMap snapshot: `src/lib/data/nearby-places.json` (c) OpenStreetMap contributors
