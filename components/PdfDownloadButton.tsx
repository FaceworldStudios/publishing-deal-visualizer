"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { DealData } from "@/lib/types";
import DealSummaryPDF from "@/components/DealSummaryPDF";

interface Props {
  data: DealData;
  mode: "minimal" | "wrapped";
  fileName: string;
  style?: React.CSSProperties;
}

export default function PdfDownloadButton({ data, mode, fileName, style }: Props) {
  return (
    <PDFDownloadLink
      document={<DealSummaryPDF data={data} mode={mode} />}
      fileName={fileName}
      style={style}
    >
      {({ loading }) => (loading ? "Preparing…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
