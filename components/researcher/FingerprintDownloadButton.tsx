"use client";

import React, { useState } from "react";
import { Download, Loader2, FileText, Lock } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { MPFingerprintReport } from "@/lib/researcher/pdf-generator";
import { getMPFingerprint } from "@/app/actions/fingerprint";
import { toast } from "react-hot-toast";

interface FingerprintDownloadButtonProps {
  mpId: string | number;
  userPlan?: string;
}

export default function FingerprintDownloadButton({ mpId, userPlan }: FingerprintDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    // Researcher check
    if (userPlan !== 'researcher' && userPlan !== 'premium' && userPlan !== 'enterprise' && userPlan !== 'admin') {
      toast.error("Researcher-tila vaaditaan raportin lataamiseen.", {
        icon: '🔒',
        style: {
          borderRadius: '10px',
          background: '#0f172a',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        },
      });
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Fetch data and summary from server
      const { data, summary } = await getMPFingerprint(mpId);

      // 2. Generate PDF blob
      const blob = await pdf(<MPFingerprintReport data={data} summary={summary} />).toBlob();

      // 3. Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sormenjalki_${data.mp.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Raportti generoitu onnistuneesti!", {
        style: {
          borderRadius: '10px',
          background: '#0f172a',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        },
      });
    } catch (error: any) {
      console.error("PDF Error:", error);
      toast.error("Raportin luonti epäonnistui.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-3 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-purple-600/20 group"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <FileText size={16} className="group-hover:scale-110 transition-transform" />
      )}
      {isGenerating ? "Generoidaan raporttia..." : "Lataa poliittinen sormenjälki (PDF)"}
      {userPlan !== 'researcher' && userPlan !== 'premium' && userPlan !== 'enterprise' && userPlan !== 'admin' && (
        <Lock size={12} className="ml-1 opacity-50" />
      )}
    </button>
  );
}

