import { notFound } from "next/navigation";
import { getDeal } from "@/lib/store";
import DealSummary from "@/components/DealSummary";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: Props) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) notFound();

  return <DealSummary data={deal.data} printMode />;
}
