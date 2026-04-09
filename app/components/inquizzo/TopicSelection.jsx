'use client'

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";

export default function TopicSelection({ topics }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subject = searchParams.get('domain');
  const category = searchParams.get('category');

  const handleTopicClick = (topicKey) => {
    router.push(
      `/inquizzo/QuizDomainSelection?domain=${encodeURIComponent(
        subject
      )}&category=${encodeURIComponent(
        category
      )}&topic=${encodeURIComponent(topicKey)}`
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(topics).map(([topicKey, topic]) => (
        <div
          key={topicKey}
          onClick={() => handleTopicClick(topicKey)}
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
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="font-semibold text-sm text-persona-ink">{topic.name}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#EC38BC] transition-colors" />
        </div>
      ))}
    </div>
  );
}
