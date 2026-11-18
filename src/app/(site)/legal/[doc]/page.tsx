import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL } from "@/content/legal";
import { PrivacyRequestForm } from "@/components/PrivacyRequestForm";

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(LEGAL).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = LEGAL[(await params).doc];
  return d ? { title: d.title, description: d.description, alternates: { canonical: `/legal/${(await params).doc}` } } : {};
}

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = LEGAL[doc];
  if (!d) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl font-black">{d.title}</h1>
      <div className="prose-legal mt-6">{d.body}</div>
      {doc === "privacidad" && (
        <section id="solicitud" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold">Ejercer tus derechos o pedir ayuda</h2>
          <PrivacyRequestForm />
        </section>
      )}
    </div>
  );
}
