import type { Metadata } from "next";
import Recorder from "@/components/Recorder";

export const metadata: Metadata = { title: "Record · VirtualCoach" };

export default function RecordPage() {
  return <Recorder />;
}
