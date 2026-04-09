"use client";

import Header from '@/app/components/shared/header/Header.jsx';
import { ConfidenceCoachUI } from '@/app/components/confidence-coach/ConfidenceCoachUI.jsx';

export default function ConfidenceCoachPage() {
    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <div className="w-full h-screen flex flex-col bg-background">
            {/* Header Section */}
            <div className="sticky top-0 z-50 w-full shrink-0">
                <Header
                    DateValue="Confidence Coach"
                    onDateChange={() => { }}
                    tempDate={today}
                    showDateFilter={false}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-2 px-3 flex gap-3 overflow-y-auto lg:overflow-hidden">
                <ConfidenceCoachUI />
            </div>
        </div>
    );
}
