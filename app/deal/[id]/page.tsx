import { notFound } from "next/navigation";
import { getDeal } from "@/lib/store";
import { DealData } from "@/lib/types";
import DealPageClient from "@/components/DealPageClient";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}

export default async function DealPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { d } = await searchParams;

  let data: DealData;

  if (d) {
    try {
      data = JSON.parse(decodeURIComponent(escape(atob(d)))) as DealData;
    } catch {
      notFound();
    }
  } else {
    const deal = await getDeal(id);
    if (!deal) notFound();
    data = deal.data;
  }

  return <DealPageClient id={id} data={data!} />;
}
