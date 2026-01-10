"use client";

import { CheckCircle } from "lucide-react";

interface VerifiedBadgeProps {
  className?: string;
}

export default function VerifiedBadge({ className = "" }: VerifiedBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full ${className}`}
    >
      <CheckCircle size={12} />
      <span>Vahvistettu</span>
    </span>
  );
}



