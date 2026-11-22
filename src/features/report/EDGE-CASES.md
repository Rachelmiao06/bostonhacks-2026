# Report: edge cases

Log every case here. `Decided` means the handling is agreed. `Open` means we still need to pick.
Handling always follows the README rules: reason plus next step, nothing unchecked is sent, no penalty for trying.

## Capture
| ID | Case | Handling | State |
|---|---|---|---|
| C-01 | Camera permission denied | Explain why we need it and how to turn it on. No gallery fallback. | Decided |
| C-02 | No camera (desktop) or insecure page | "Open Tada on your phone." Camera only works on https. | Decided |
| C-03 | Camera busy or fails to start | Retry button, then a plain error. | Decided |
| C-04 | Photo of a screen or of another photo | Judged by what it shows. The AI is told it may be a picture of a street problem and is not allowed to say `unclear` only because it is a picture; the old "photo of a screen" downgrade is removed for everyone (it blocked demos). | Decided |
| C-05 | Too dark, blurry, far away, blank | `unclear`, with a tip to move closer or find light. | Decided |
| C-06 | Selfie, pet, indoor, food, unrelated | `unclear` or `not an issue`, with a reason. Nothing sent. | Decided |
| C-07 | User leaves the app mid-capture | Camera stops; return to the viewfinder. No draft kept. | Open |
| C-08 | Several problems in one photo | Ask which one to report; one report per photo. | Open |

## Location
| ID | Case | Handling | State |
|---|---|---|---|
| L-01 | Location denied | Explain; cannot send without it. | Decided |
| L-02 | Accuracy worse than about 50 m | "Move to open sky and try again." | Decided |
| L-03 | Outside Boston (Cambridge, Somerville, etc.) | "This is not in Boston, so 311 can't fix it." Nothing sent. | Decided |
| L-04 | Road or land Boston does not run (state road, MBTA, university) | The AI may mark it `private` or `not the city's`; say who to contact. | Open |
| L-05 | Faked or simulated GPS | Cannot fully stop it. Rate limit and log the pattern. | Open |
| L-06 | User walks away between photo and send | Pin stays where the photo was taken. | Decided |

## Judge (AI)
| ID | Case | Handling | State |
|---|---|---|---|
| J-01 | Private place (lot, shop, home) | Explain why; suggest the right contact. Nothing sent. No override. | Decided |
| J-02 | Emergency (fire, injury, gas smell) | "Call 911." Never filed. | Decided |
| J-03 | Description does not match the photo | Ask the user which is right; send only after they confirm. | Decided |
| J-04 | AI unsure | Ask "Is this X?" instead of deciding quietly. | Decided |
| J-05 | AI times out, errors, or returns junk | Do not send. Save the draft and retry later. | Decided |
| J-06 | Category not in Boston's list | Pick the nearest `service_name` or ask the user. Never invent one. | Open |
| J-07 | Text in the photo tries to instruct the AI ("ignore your rules") | Treat all text in photos as data. The verdict schema is fixed, so output outside it is discarded. | Decided |
| J-08 | Faces, license plates, a person sleeping outside | Suggest retaking without people. Never file a report about a person. | Decided |
| J-09 | Offensive or sexual image | Reject, no reason beyond "can't use this". Count toward rate limit. | Open |
| J-10 | AI wrong and the user disagrees | "I think this is wrong" button; logged for review. Does not force a send. | Decided |

## Draft and send
| ID | Case | Handling | State |
|---|---|---|---|
| D-01 | Empty or very short description | Pre-filled by AI; require at least a sentence. | Open |
| D-02 | Phone number, name, or email typed into the description | Warn that the city will see it; offer to remove. | Open |
| D-03 | Offensive text | Ask to rewrite; do not send. | Decided |
| D-04 | User changes category to one that does not fit the photo | Re-check; ask to confirm. | Open |
| D-05 | Double tap on Send | One submit per draft (idempotent). | Decided |
| D-06 | Offline or send fails | Keep the draft, show "Not sent", retry. Never show "Sent" unless it was. | Decided |
| D-07 | Many rejected tries in a short time | Rate limit per device. | Open |

## Duplicate check
| ID | Case | Handling | State |
|---|---|---|---|
| U-01 | Matching open case found | Offer "Follow it" (earns leaves). | Decided |
| U-02 | User says it is not the same | File anyway. | Decided |
| U-03 | Several matches | Show the nearest few; let the user pick. | Open |
| U-04 | Same place, different category | Not a duplicate. | Decided |
| U-05 | Same place, closed very recently | Tell the user, offer to file again ("came back"). | Open |
| U-06 | 311 data down or slow | Say the check could not run; allow filing with a note. | Open |
| U-07 | Data lag (new cases not visible yet) | Accept some duplicates; the city merges them. | Decided |
| U-08 | User already follows this case | Open it instead of following again. | Decided |

## Track and notify
| ID | Case | Handling | State |
|---|---|---|---|
| T-01 | Case closed with "No violation", "Duplicate", "Noted", "Transitioned" or any note that is not a repair | Show "Closed by <team>", the city's words, and the closure reason verbatim. "Fixed" only when reason is Resolved and the note names a repair. | Decided |
| T-02 | Closed with an empty note | Show team and date; no quote. | Decided |
| T-03 | Status is not one we expect (Error, Needs Reallocation, Create) | Show as In progress. | Decided |
| T-04 | Case not found in the data yet | "We are waiting for the city to list it." | Open |
| T-05 | Case reopened or merged into another | Follow the merged case; keep one card. | Open |
| T-06 | In progress for weeks | Show how long it has been open. | Decided |
| T-07 | Browser storage cleared, or another device | The list is lost (no accounts). Offer lookup by case id. | Open |
| T-08 | Several cases close at once | One card each, newest first. | Decided |
| T-09 | Case closes while the app is closed | Show the badge and card next time it opens. | Decided |

## Leaves
| ID | Case | Handling | State |
|---|---|---|---|
| R-01 | Farming (junk, repeats) | Leaves only for accepted reports, followed duplicates, and fixes. | Decided |
| R-02 | Awarded twice for one case | Award once per case id, from the server. | Decided |
| R-03 | A case later reopens | Keep the leaves. | Open |

## Privacy
| ID | Case | Handling | State |
|---|---|---|---|
| P-01 | Location is sent | Say so before the first report (changes the old "never sent" rule; see DECISIONS). | Decided |
| P-02 | Anonymity | The city gets photo, location, description only. | Decided |
| P-03 | What we log on our side | Verdict, reason, and time; never the photo of a rejected report beyond the session. | Open |

## Demo day
| ID | Case | Handling | State |
|---|---|---|---|
| M-01 | Venue Wi-Fi is bad | Cache the seeded case; show a clear offline state. | Open |
| M-02 | Camera permission prompt on stage | Do it once on the demo phone beforehand. | Open |
| M-03 | Real case will not close on cue | Seed one case with a real-style closure note. | Open |
| M-04 | No real street problem in front of the presenter, or indoors with weak GPS | Open `/report?demo=1`. A photo of a picture or screen is judged by what it shows for everyone now (no `?demo=1` needed); a missing, imprecise or non-Boston GPS reading becomes one fixed Kenmore spot (`demo-mode.ts`). A "Demo mode" note shows on screen and sending is still simulated. `?demo=0` turns it off. | Decided |

## Found while building v1
| ID | Case | Handling | State |
|---|---|---|---|
| B-01 | The "inside Boston" test is a rough box, so parts of Cambridge and Somerville pass it | Accepted for the demo; the AI may call it `private`. A real boundary check is needed before launch. | Open |
| B-02 | The send route trusts the client's category and text; it does not re-check the AI verdict | Fine while sending is simulated. Sign the verdict on the server before any real send. | Open |
| B-03 | Rate limit is in memory, so it resets when the server restarts | Best effort for the demo. | Open |
| B-04 | The browser pane and some desktops block the camera | The error screen explains it; test the camera on a real phone over https. | Decided |
| B-05 | A saved draft after an AI failure is kept only for the session ("Try again" keeps the photo) | Leaving the tab loses it. | Open |
| B-06 | Demo cases close about 50 seconds after sending | Labelled "Demo case: not sent to the city". Never shown as real. | Decided |
| B-07 | Followed real cases show "In progress" until the first status answer arrives | Keeps the last known status if the data is unreachable. | Decided |

## Redesign pass
| ID | Case | Handling | State |
|---|---|---|---|
| X-01 | First visit: camera and location would be requested cold | A "Before we ask" note comes first; permissions are requested only after Continue. Never on page load. | Decided |
| X-02 | Camera blocked or missing | A compact explanation with Try again, Close, and a link to Boston 311. No empty black rectangle. | Decided |
| X-03 | Location blocked mid-capture | Explains that nothing was collected; Try again or Close. | Decided |
| X-04 | AI unsure of the category | The issue must be confirmed (keep it, or pick an alternative) before Save is enabled. | Decided |
| X-05 | Wrong spot on the draft | "Use my current location" (only if accurate to 50 m) or "Retake at the right spot". The pin is never free-typed. | Decided |
| X-06 | Nearby case looks like the same problem | Shown as "possibly the same": same type, nearby, and no photo comparison is possible. User can follow it or say it is different. | Decided |
| X-07 | The AI verdict looks wrong | No fake "we noted it" button. Offer another angle, or Boston 311 directly. | Decided |
| X-08 | Keyboard only | Shutter is focused when the camera is ready; Escape closes the camera; every control is a real button, link or form field. | Decided |
| X-09 | Reduced motion | Entrance animations and the checking pulse are motion-safe only; transitions are off under motion-reduce. Checked in code, not by device emulation. | Decided |
| X-10 | Floating trolley chat covers the bottom-right corner on phones | Report leaves bottom padding so the last content can scroll clear of it. | Decided |
| X-11 | Cases opened from "Update" | Opening a row clears its Update mark without re-sorting the list under the finger. | Decided |

## Journey redesign (result routing and Ask Tada)
| ID | Case | Handling | State |
|---|---|---|---|
| Y-01 | A problem that belongs to another authority (for example an MBTA elevator) | New verdict `other_authority`. MBTA gets its verified channel; anything else is an unverified guess plus a limitation. Never forced into a Boston 311 category. | Decided |
| Y-02 | Person picks a category the AI did not suggest | The result says "You chose: <category>" and does not reuse the AI's headline. The nearby lookup re-runs for that category. | Decided |
| Y-03 | Clipboard blocked on "Copy & open Boston 311" | The screen says the copy failed and shows the text to copy by hand. It never says "copied" when it was not. | Decided |
| Y-04 | The handoff to Boston 311 was used | Nothing is saved in Activity: Tada cannot see that case until it appears in the city's public data. | Decided |
| Y-05 | Ask Tada is asked something it cannot know (live elevator status, another entrance, repair time) | It says it has no verified information and links a verified official page. Tested with a rule-breaking prompt. | Decided |
| Y-06 | Ask Tada answer links | The model only picks a key; the label and URL come from a fixed, verified list. | Decided |
| Y-07 | Ask Tada rate limit | 20 questions per 10 minutes per client, in memory (resets on restart). | Open |
| Y-08 | Floating trolley chat covers the corner on phones | Result photos are shorter on phones so main actions stay clear; Report leaves bottom padding. | Decided |
| Y-09 | Other authorities beyond the MBTA | No verified channels yet. Future scope: a verified mapping (for example MassDOT, Massport). | Open |

| H-01 | The category has no form code (Overgrown Weeds, Other) or 311 changes a code | Open the 311 home page and keep the description copied to the clipboard. | Decided |
| H-02 | The category's first step has no description box (Rat Activity) | Open the category form without the text; the description is on the clipboard. | Decided |
| H-03 | The person expects the photo to be there | It is not: Tada does not keep photos and a link cannot fill a file box. The screen says so before and after. | Decided |
