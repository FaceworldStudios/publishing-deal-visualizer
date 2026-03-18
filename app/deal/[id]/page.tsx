import { notFound } from "next/navigation";
import { getDeal } from "@/lib/store";
import DealPageClient from "@/components/DealPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealPage({ params }: Props) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) notFound();

  return <DealPageClient id={id} data={deal.data} />;
}
