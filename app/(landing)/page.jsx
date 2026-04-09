'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BenefitsGrid from '@/app/components/landing/sections/benefits-grid';
import FaqAccordion from '@/app/components/landing/sections/faq-accordion';
import HeroSection from '@/app/components/landing/sections/hero-section';
import ToolsTab from '@/app/components/landing/sections/tools-tab';
import { CoreFeatures } from '@/app/components/landing/sections/core-features';
import AboutSection from '@/app/components/landing/sections/about-section';

export default function Home() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Retain original functionality to trigger the cron
    fetch('/api/dashboard/cron/init').catch(console.error);

    // If a token exists, the user is authenticated and should be redirected to the dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    } else {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeroSection />
      <CoreFeatures />
      <ToolsTab />
      <BenefitsGrid />
      <AboutSection />
      <FaqAccordion />
    </>
  );
}