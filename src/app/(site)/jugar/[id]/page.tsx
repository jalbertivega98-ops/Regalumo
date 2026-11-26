import type { Metadata } from "next";
import { EscapePlay } from "@/components/escape/EscapePlay";

export const metadata: Metadata = { title: "Jugar al escape room", robots: { index: false, follow: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params;
  const { k = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <EscapePlay id={id} k={k} />
    </div>
  );
}
