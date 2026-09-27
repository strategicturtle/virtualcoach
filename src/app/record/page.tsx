import type { Metadata } from "next";
import Recorder from "@/components/Recorder";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Record · VirtualCoach" };

export default async function RecordPage() {
  await requireUser();
  return <Recorder />;
}
