'use client'

import React, { useState } from "react";
import Link from "next/link";
import CursorGlow from './effects/CursorGlow';
import ParallaxBlob from './effects/ParallaxBlob';
import MagneticButton from './effects/MagneticButton';

const ShowcaseSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const items = [
    {
      title: "Home",
      subtitle: "Welcome to InQuizo",
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
      link: "/inquizzo/Home",
    },
    {
      title: "Quiz Game",
      subtitle: "Challenge Your Mind",
      img: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80",
      link: "/inquizzo/Quiz",
    },
    {
      title: "MCQ Practice",
      subtitle: "Test Your Knowledge",
      img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      link: "/inquizzo/Quiz",
    },
    {
      title: "Coming Soon",
      subtitle: "More Features",
      img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
      link: "#",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#03001E] via-[#7303C0]/20 to-[#03001E]">
      <CursorGlow />

      {/* Parallax blobs */}
      <ParallaxBlob offsetFactor={0.025} className="top-1/4 left-1/4 w-[500px] h-[300px] bg-[#7303C0]/15" />
      <ParallaxBlob offsetFactor={0.015} className="bottom-1/3 right-1/4 w-[400px] h-[200px] bg-[#EC38BC]/10" />
      <ParallaxBlob offsetFactor={0.035} className="top-1/2 left-0 w-[300px] h-[300px] bg-[#03001E]/80" />

      {/* Grid overlay texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(115,3,192,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(115,3,192,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#7303C0] to-[#EC38BC] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">📚</span>
          </div>
          <span className="text-white text-2xl font-bold">InQuizo</span>
        </div>
        <MagneticButton>
          <Link href="/inquizzo/Quiz">
            <button className="bg-gradient-to-r from-[#7303C0] to-[#EC38BC] hover:shadow-[0_0_40px_rgba(236,56,188,0.4)] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
              Start Quiz
            </button>
          </Link>
        </MagneticButton>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        {/* Badge chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7303C0]/30 bg-[#7303C0]/10 backdrop-blur-sm mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#EC38BC] animate-pulse" />
          <span className="text-xs font-semibold text-[#FDEFF9] uppercase tracking-widest">
            Voice-Controlled Quiz Platform
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          InQuizo
        </h1>
        <h2 className="text-2xl md:text-3xl text-white/90 mb-4 font-light">
          Voice-Controlled Quiz Platform
        </h2>
        <p className="text-lg text-white/80 mb-12 max-w-2xl">
          Experience the future of learning with our advanced voice-controlled
          quiz system
        </p>

        <MagneticButton>
          <Link href="/inquizzo/Quiz">
            <button className="bg-gradient-to-r from-[#7303C0] to-[#EC38BC] text-white font-semibold py-4 px-8 rounded-full text-lg shadow-[0_0_40px_rgba(236,56,188,0.4)] hover:shadow-[0_0_60px_rgba(236,56,188,0.5)] transition-all duration-300 transform hover:scale-105">
              View Demo
            </button>
          </Link>
        </MagneticButton>
      </div>

      {/* Feature Cards Section */}
      <div className="relative z-10 py-20">
        <div className="container mx-auto px-8">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Explore InQuizo Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item, index) => (
              <Link
                href={item.link}
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl shadow-black/20 hover:border-[#7303C0]/40 hover:shadow-[#7303C0]/20 transition-all duration-500 transform hover:scale-105 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h4 className="text-xl font-bold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-white/80 text-sm">{item.subtitle}</p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#7303C0] to-[#EC38BC] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(236,56,188,0.4)]">
                    <span className="text-white text-lg">→</span>
                  </div>
                </div>

                {/* Hover Border Glow Effect */}
                <div className="absolute inset-0 border-2 border-[#7303C0]/0 group-hover:border-[#7303C0]/30 rounded-2xl transition-colors duration-300"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#03001E] to-transparent pointer-events-none" />
    </div>
  );
};

export default ShowcaseSection;
