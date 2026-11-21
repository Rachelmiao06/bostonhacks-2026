import { JourneyDemo } from "@/features/journey/demo/JourneyDemo";

// A preview of the flow. It covers the whole screen on purpose: the idea is that nothing else is needed.
// To make this the real home screen, the owner of src/app/page.tsx renders <JourneySurface> there instead
// (see src/features/journey/README.md, "Adopting it").
export default function Page() {
  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <JourneyDemo />
    </div>
  );
}
