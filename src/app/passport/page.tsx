import { Suspense } from "react";
import { Passport } from "@/features/passport/Passport";

// useSearchParams (for ?demo=) needs a Suspense boundary under Cache Components.
export default function Page() {
  return (
    <Suspense>
      <Passport />
    </Suspense>
  );
}
