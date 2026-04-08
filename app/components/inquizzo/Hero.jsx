"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CursorGlow from './effects/CursorGlow';
import CursorTrail from './effects/CursorTrail';
import ParallaxBlob from './effects/ParallaxBlob';
import MagneticButton from './effects/MagneticButton';

const Hero = () => {
  const router = useRouter();
  const messages = ["Welcome to InQuizo,", "Fuel Your Mind. Flex Your Voice."];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) startTypewriterEffect();
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.name.includes("Google UK English")) ||
      voices.find((v) => v.name.includes("Zira")) ||
      voices.find((v) => v.name.includes("Samantha")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  const speakText = (text) => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = getBestVoice();
      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      utterance.volume = 1;
      utterance.lang = "en-US";

      utterance.onend = resolve;
      utterance.onerror = resolve;

      window.speechSynthesis.speak(utterance);
    });
  };

  const typeMessage = async (index) => {
    const message = messages[index];
    setCurrentText("");
    setIsTyping(true);

    const speechPromise = speakText(message);

    for (let i = 0; i <= message.length; i++) {
      setCurrentText(message.slice(0, i));
      await new Promise((r) => setTimeout(r, 85));
    }

    setIsTyping(false);
    await speechPromise;
  };

  const startTypewriterEffect = async () => {
    await typeMessage(0);
    await new Promise((r) => setTimeout(r, 1000));
    setCurrentMessageIndex(1);
    await typeMessage(1);
    setAllComplete(true);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const renderMessage = () => {
    if (currentMessageIndex === 1) {
      return (
        <>
          <div className="text-white mb-1">Welcome to InQuizo</div>
          <span className="bg-gradient-to-r from-[#7303C0] to-[#EC38BC] bg-clip-text text-transparent">
            {currentText}
            {(isTyping || !allComplete) && (
              <span
                className={`${showCursor ? "opacity-100" : "opacity-0"
                  } text-[#EC38BC] transition-opacity duration-150`}
              >
                |
              </span>
            )}
          </span>
        </>
      );
    }

    return (
      <span className="text-white">
        {currentText}
        {(isTyping || !allComplete) && (
          <span
            className={`${showCursor ? "opacity-100" : "opacity-0"
              } text-[#EC38BC] transition-opacity duration-150`}
          >
            |
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white text-center px-4 overflow-hidden bg-gradient-to-br from-[#03001E] via-[#7303C0]/20 to-[#03001E]">

      {/* Effect layers */}
      <CursorTrail />
      <CursorGlow />

      {/* Parallax blobs */}
      <ParallaxBlob offsetFactor={0.025} className="top-0 left-1/3 w-[500px] h-[300px] bg-[#7303C0]/15" />
      <ParallaxBlob offsetFactor={0.015} className="bottom-0 right-1/4 w-[400px] h-[200px] bg-[#EC38BC]/10" />
      <ParallaxBlob offsetFactor={0.035} className="top-1/2 left-0 w-[300px] h-[300px] bg-[#03001E]/80" />

      {/* Grid overlay texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(115,3,192,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(115,3,192,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Badge chip above heading */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7303C0]/30 bg-[#7303C0]/10 backdrop-blur-sm mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EC38BC] animate-pulse" />
          <span className="text-xs font-semibold text-[#FDEFF9] uppercase tracking-widest">
            Voice-Controlled Quiz Platform
          </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
          {renderMessage()}
        </h1>

        {allComplete && (
          <div className="animate-fade-in mt-12 flex flex-col items-center gap-4">
            <MagneticButton>
              <Link href="/inquizzo/Home">
                <button className="bg-gradient-to-r from-[#7303C0] to-[#EC38BC] text-white font-semibold py-4 px-10 rounded-full shadow-[0_0_40px_rgba(236,56,188,0.4)] hover:shadow-[0_0_60px_rgba(236,56,188,0.5)] transition-all duration-300 transform hover:scale-105">
                  Initialize Quiz 🚀
                </button>
              </Link>
            </MagneticButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;