import { CoachTour } from "@/features/coach/CoachTour";
import { Explore } from "@/features/explore/Explore";

// The map is the home page: no separate landing screen. The coach explains it to first-time riders.
export default function Page() {
  return (
    <>
      <Explore />
      <CoachTour />
    </>
  );
}
