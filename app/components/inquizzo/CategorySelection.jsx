'use client'

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, ChevronRight } from "lucide-react";

export default function CategorySelection({ structure }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const domain = searchParams.get('domain');
  const categories = structure[domain]?.categories || {};

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(categories).map(([catKey, category]) => (
        <div
          key={catKey}
          onClick={() => router.push(`/inquizzo/QuizDomainSelection?domain=${domain}&category=${catKey}`)}
          className="flex items-center justify-between rounded-xl px-5 py-4
                     border border-[#1a0533]/60 bg-gradient-to-r from-[#08011a] to-transparent
                     hover:border-[#7303C0]/30 hover:bg-gradient-to-r 
                     hover:from-[#7303C0]/5 hover:to-transparent
                     hover:shadow-md hover:shadow-[#7303C0]/10
                     transition-all duration-200 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7303C0]/20 to-[#9b10a8]/10
                           flex items-center justify-center text-[#EC38BC]
                           ring-1 ring-[#7303C0]/20 group-hover:ring-[#7303C0]/50 transition-all">
              <Brain className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-persona-ink">{category.name}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#EC38BC] transition-colors" />
        </div>
      ))}
    </div>
  );
}
