"""One-off: turn MBTA's alert archive into a small JSON file of past accessibility outages.

Needs: pip install duckdb
1. Download https://performancedata.mbta.com/lamp/tableau/alerts/LAMP_RT_ALERTS.parquet (about 135 MB)
2. python scripts/export-history.py LAMP_RT_ALERTS.parquet history.json
3. node --env-file=.env.local scripts/db-import-history.mjs history.json

Only outages MBTA has closed are exported. Rows with no close time are skipped: in the archive
that does not reliably mean "still open".
"""
import json
import sys

import duckdb

src, out = sys.argv[1], sys.argv[2]
rows = duckdb.connect().execute(
    """
    select id::varchar,
      arg_max(effect_detail, last_modified_timestamp),
      arg_max(cause, last_modified_timestamp),
      arg_max("header_text.translation.text", last_modified_timestamp),
      max("informed_entity.facility_id"),
      max(case when "informed_entity.stop_id" like 'place-%' then "informed_entity.stop_id" end),
      list(distinct "informed_entity.route_id") filter (where "informed_entity.route_type" in (0, 1)),
      coalesce(min("active_period.start_timestamp"), min(created_timestamp)),
      min(created_timestamp),
      max(closed_timestamp)
    from read_parquet(?)
    where effect_detail in ('ELEVATOR_CLOSURE', 'ESCALATOR_CLOSURE', 'ACCESS_ISSUE')
    group by id
    having max(closed_timestamp) is not null
       and max(closed_timestamp) >= coalesce(min("active_period.start_timestamp"), min(created_timestamp))
    """,
    [src],
).fetchall()
keys = ["alert_id", "effect", "cause", "header", "facility_id", "station_id", "routes", "started", "created", "closed"]
json.dump([dict(zip(keys, r)) for r in rows], open(out, "w"))
print(f"exported {len(rows)} closed outages")
