'use client';
import Link from 'next/link';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Space_Grotesk } from 'next/font/google';
import { useTheme } from 'next-themes';
import {
  MessageCircle, UserRound, BrainCircuit, Sparkles, Heart,
  Flame, ShieldCheck, Hourglass, Crown,
  Monitor, Lock, Bot, Cpu, Zap,
  Ruler, BarChart3, Sigma, Infinity,
  Atom, FlaskConical, Dna, Globe,
  Megaphone, Coins, Rocket, ClipboardList,
  Scroll, Microscope, Users, Lightbulb,
  Palette, Smartphone, Landmark, Music, Search, GraduationCap
} from 'lucide-react';
import BackButton from '@/app/components/micro-learning/BackButton';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const personalityCategories = [
  {
    name: 'Communication',
    slug: 'communication',
    icon: MessageCircle,
    description: 'Master clear expression, storytelling, voice tone, active listening & persuasive speaking.'
  },
  {
    name: 'Posture & Presence',
    slug: 'posture',
    icon: UserRound,
    description: 'Develop powerful body language, confident stance, eye contact and physical charisma.'
  },
  {
    name: 'Confidence & Self-Belief',
    slug: 'confidence',
    icon: BrainCircuit,
    description: 'Build unshakeable inner confidence, overcome self-doubt, and radiate self-worth.'
  },
  {
    name: 'Charisma & Magnetism',
    slug: 'charisma',
    icon: Sparkles,
    description: 'Become naturally magnetic — warmth, likability, social energy & instant connection.'
  },
  {
    name: 'Emotional Intelligence',
    slug: 'emotional-intelligence',
    icon: Heart,
    description: 'Understand & manage emotions — yours and others — empathy, self-regulation & social awareness.'
  },
  {
    name: 'Motivation & Mindset',
    slug: 'motivation',
    icon: Flame,
    description: 'Cultivate growth mindset, daily drive, resilience and peak mental performance.'
  },
  {
    name: 'Resilience & Mental Toughness',
    slug: 'resilience',
    icon: ShieldCheck,
    description: 'Bounce back from failure, handle stress, develop grit and emotional endurance.'
  },
  {
    name: 'Self-Discipline & Habits',
    slug: 'self-discipline',
    icon: Hourglass,
    description: 'Create unbreakable consistency, strong routines, willpower and long-term focus.'
  },
  {
    name: 'Leadership & Influence',
    slug: 'leadership',
    icon: Crown,
    description: 'Inspire, guide, make decisions, build trust and lead without formal authority.'
  },
];

const academicSections = [
  {
    title: 'Technology & Engineering',
    description: 'This is where your Programming sits. It covers how to build and use digital or physical systems.',
    items: [
      { name: 'Software Development', slug: 'software-development', icon: Monitor, description: 'Coding, web, apps, DevOps' },
      { name: 'Cybersecurity', slug: 'cybersecurity', icon: Lock, description: 'Hacking prevention, encryption, security' },
      { name: 'Robotics', slug: 'robotics', icon: Bot, description: 'Automation, drones, mechanical AI' },
      { name: 'AI & Machine Learning', slug: 'ai', icon: Cpu, description: 'Neural networks, LLMs, data science' },
      { name: 'Electronics', slug: 'electronics', icon: Zap, description: 'Circuits, embedded systems, IoT' },
    ]
  },
  {
    title: 'Mathematics & Logic',
    description: 'This is the foundation for technical work.',
    items: [
      { name: 'Algebra', slug: 'algebra', icon: Ruler, description: 'Equations, functions, polynomials' },
      { name: 'Statistics & Probability', slug: 'statistics', icon: BarChart3, description: 'Data analysis, inference, distributions' },
      { name: 'Calculus', slug: 'calculus', icon: Sigma, description: 'Limits, derivatives, integrals' },
      { name: 'Discrete Mathematics', slug: 'discrete-math', icon: Infinity, description: 'Logic, sets, graphs, algorithms' },
    ]
  },
  {
    title: 'Science & Nature',
    description: 'Understanding the physical and biological world.',
    items: [
      { name: 'Physics', slug: 'physics', icon: Atom, description: 'Matter, energy, space, time' },
      { name: 'Chemistry', slug: 'chemistry', icon: FlaskConical, description: 'Reactions, elements, molecules' },
      { name: 'Biology', slug: 'biology', icon: Dna, description: 'Life, genetics, cells, evolution' },
      { name: 'Environment', slug: 'environment', icon: Globe, description: 'Climate, geology, oceans' },
    ]
  },
  {
    title: 'Business & Leadership',
    description: 'Essential skills for the modern professional world.',
    items: [
      { name: 'Marketing', slug: 'marketing', icon: Megaphone, description: 'Branding, ads, strategy, sales' },
      { name: 'Finance & Investing', slug: 'finance', icon: Coins, description: 'Stocks, crypto, personal finance' },
      { name: 'Entrepreneurship', slug: 'entrepreneurship', icon: Rocket, description: 'Starting, scaling, MVPs' },
      { name: 'Project Management', slug: 'project-management', icon: ClipboardList, description: 'Agile, Scrum, workflows' },
    ]
  },
  {
    title: 'Humanities & Social Sciences',
    description: 'Understanding people, culture, and history.',
    items: [
      { name: 'History', slug: 'history', icon: Scroll, description: 'Civilizations, wars, revolutions' },
      { name: 'Psychology', slug: 'psychology', icon: Microscope, description: 'Human behavior, development, brain' },
      { name: 'Sociology', slug: 'sociology', icon: Users, description: 'Groups, society, interactions' },
      { name: 'Philosophy', slug: 'philosophy', icon: Lightbulb, description: 'Ethics, truth, existence' },
    ]
  },
  {
    title: 'Arts & Languages',
    description: 'Expressing creativity and connecting through communication.',
    items: [
      { name: 'Graphic Design', slug: 'graphic-design', icon: Palette, description: 'UI/UX, graphic design, art history' },
      { name: 'Language Learning', slug: 'language', icon: Smartphone, description: 'Speaking, grammar, fluency' },
      { name: 'Economics', slug: 'economics', icon: Landmark, description: 'Markets, supply/demand, policy' },
      { name: 'Music Theory', slug: 'music', icon: Music, description: 'Composition, rhythm, melody' },
    ]
  }
];

function CategoriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const initialSearch = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState("personality");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = resolvedTheme === 'light';

  // Theme object
  const t = {
    primary: isLight ? '#9067C6' : '#934CF0',
    textPrimary: isLight ? '#242038' : '#ffffff',
    textMuted: isLight ? '#655A7C' : '#94A3B8',
    cardBorder: isLight ? 'rgba(144, 103, 198, 0.15)' : 'rgba(255, 255, 255, 0.1)',
    glow: isLight ? 'rgba(144, 103, 198, 0.4)' : '#934CF0',
    inputBg: isLight ? 'rgba(144, 103, 198, 0.03)' : 'rgba(255, 255, 255, 0.04)',
  };

  const filteredPersonality = useMemo(() => {
    if (!searchQuery) return personalityCategories;
    return personalityCategories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredAcademic = useMemo(() => {
    if (!searchQuery) return academicSections;
    return academicSections
      .map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(section => section.items.length > 0);
  }, [searchQuery]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }
    router.replace(`/micro-learning?${params.toString()}`, { scroll: false });
  };

  if (!mounted) return null;

  return (
    <main className={spaceGrotesk.className} style={styles.page}>
      <BackButton target="/" />
      
      {/* Search Input */}
      <div style={styles.searchContainer}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: t.textMuted,
            }}
          />
          <input
            type="text"
            placeholder="Search subjects, skills, or fields..."
            value={searchQuery}
            onChange={handleSearch}
            className="glass-input"
            style={{
              ...styles.searchInput,
              paddingLeft: '55px',
              background: t.inputBg,
              borderColor: t.cardBorder,
              color: t.textPrimary,
            }}
          />
        </div>
      </div>
      
      {/* Tab Switcher */}
      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('personality')}
          className={`tab-button ${activeTab === 'personality' ? 'active' : ''}`}
          style={{
            ...styles.tabButton,
            color: activeTab === 'personality' ? '#fff' : t.textMuted,
            background: activeTab === 'personality' ? t.primary : 'transparent',
            borderColor: activeTab === 'personality' ? t.primary : t.cardBorder,
          }}
        >
          <UserRound size={18} style={{ marginRight: '8px' }} />
          Personality
        </button>
        <button 
          onClick={() => setActiveTab('academic')}
          className={`tab-button ${activeTab === 'academic' ? 'active' : ''}`}
          style={{
            ...styles.tabButton,
            color: activeTab === 'academic' ? '#fff' : t.textMuted,
            background: activeTab === 'academic' ? t.primary : 'transparent',
            borderColor: activeTab === 'academic' ? t.primary : t.cardBorder,
          }}
        >
          <GraduationCap size={18} style={{ marginRight: '8px' }} />
          Academics
        </button>
      </div>

      <h1 className="gradient-text" style={{ ...styles.title, color: t.textPrimary }}>
        {activeTab === 'personality' ? 'Build Your Personality' : 'Academic Excellence'}
      </h1>

      <div style={styles.content}>
        {/* Personality Section */}
        {activeTab === 'personality' && filteredPersonality.length > 0 && (
          <div style={styles.section}>
            <h2 style={{ ...styles.sectionTitle, color: t.primary }}>Personality & Growth</h2>
            <p style={{ ...styles.sectionDesc, color: t.textMuted }}>Build the inner skills that define your presence and mindset.</p>

            <div style={styles.grid}>
              {filteredPersonality.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/micro-learning/category/${cat.slug}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="glass-card group" style={styles.card}>
                    <div className="icon-container" style={{ margin: '0 auto 18px auto' }}>
                      <div className="icon-glow" style={{ background: t.glow }} />
                      <cat.icon className="icon-symbol" size={48} strokeWidth={1.5} style={{ color: isLight ? t.primary : '#fff' }} />
                    </div>
                    <h3 style={{ ...styles.name, color: t.textPrimary }}>{cat.name}</h3>
                    <p style={{ ...styles.desc, color: t.textMuted }}>{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Academic Sections */}
        {activeTab === 'academic' && (
          filteredAcademic.length > 0 ? (
            filteredAcademic.map((sec) => (
              <div key={sec.title} style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, color: t.primary }}>{sec.title}</h2>
                <p style={{ ...styles.sectionDesc, color: t.textMuted }}>{sec.description}</p>

                <div style={styles.grid}>
                  {sec.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/micro-learning/category/${item.slug}?mode=academic`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="glass-card group" style={styles.card}>
                        <div className="icon-container" style={{ margin: '0 auto 18px auto' }}>
                          <div className="icon-glow" style={{ background: t.glow }} />
                          <item.icon className="icon-symbol" size={48} strokeWidth={1.5} style={{ color: isLight ? t.primary : '#fff' }} />
                        </div>
                        <h3 style={{ ...styles.name, color: t.textPrimary }}>{item.name}</h3>
                        <p style={{ ...styles.desc, color: t.textMuted }}>{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            searchQuery && (
              <p style={{ ...styles.noResults, color: t.textMuted }}>
                No academic subjects match &quot;{searchQuery}&quot;
              </p>
            )
          )
        )}

        {/* Universal No Results fallback */}
        {((activeTab === 'personality' && filteredPersonality.length === 0) || (activeTab === 'academic' && filteredAcademic.length === 0)) && searchQuery && (
          <p style={{ ...styles.noResults, color: t.textMuted }}>
            No matches found for &quot;{searchQuery}&quot; in this category.
          </p>
        )}
      </div>
    </main>
  );
}

export default function MicroLearningPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesContent />
    </Suspense>
  );
}

const styles = {
  page: {
    padding: 'clamp(60px, 10vh, 90px) 5% 80px 5%',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100vw',
    boxSizing: 'border-box',
    position: 'relative',
    background: 'transparent',
    overflow: 'hidden',
  },
  searchContainer: {
    width: '100%',
    maxWidth: '600px',
    margin: '20px auto 20px auto',
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    justifyContent: 'center',
    width: '100%',
  },
  tabButton: {
    padding: '10px 24px',
    borderRadius: '30px',
    border: '1px solid',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    padding: '14px 24px',
    fontSize: '1.1rem',
    borderRadius: '50px',
    border: '1px solid rgba(147,76,240,0.2)',
    outline: 'none',
    transition: 'all 0.3s',
  },
  title: {
    fontSize: '3.2rem',
    marginBottom: '40px',
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    width: '100%',
    maxWidth: '1200px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '28px',
  },
  section: {
    marginBottom: '60px',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    fontWeight: '700',
    marginBottom: '12px',
  },
  sectionDesc: {
    fontSize: '1.05rem',
    marginBottom: '28px',
    lineHeight: '1.5',
  },
  card: {
    padding: '36px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '280px',
  },
  name: {
    fontSize: '1.5rem',
    fontWeight: '700',
    marginBottom: '8px',
    textAlign: 'center',
  },
  desc: {
    fontSize: '0.95rem',
    lineHeight: '1.45',
    textAlign: 'center',
  },
  noResults: {
    fontSize: '1.25rem',
    marginTop: '60px',
    textAlign: 'center',
    padding: '20px',
  },
};
