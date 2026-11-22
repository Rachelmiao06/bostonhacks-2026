import type { Metadata } from "next";
import { DioramaLab } from "@/features/challenge-diorama/DioramaLab";

// Isolated test of the Challenge with a living miniature station. Not linked from the nav, not indexed.
export const metadata: Metadata = { title: "Challenge diorama (test)", robots: { index: false, follow: false } };

export default function Page() {
  return <DioramaLab />;
}
