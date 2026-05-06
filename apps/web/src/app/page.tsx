'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Database, Terminal, Cpu, ArrowRight, Cloud, Check, Activity } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const HERO_VIDEOS = [
  '/videos/hero-1.mp4',
  '/videos/hero-2.mp4',
  '/videos/hero-3.mp4',
  '/videos/hero-4.mp4',
  '/videos/hero-5.mp4',
  '/videos/hero-6.mp4',
];

function HeroBackground() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentVideoIndex(Math.floor(Math.random() * HERO_VIDEOS.length));
  }, []);

  const handleVideoEnd = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * HERO_VIDEOS.length);
    } while (nextIndex === currentVideoIndex && HERO_VIDEOS.length > 1);
    setCurrentVideoIndex(nextIndex);
  };

  return (
    <div className="z-0 absolute inset-0 bg-black overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        {isMounted && (
          <motion.video
            key={HERO_VIDEOS[currentVideoIndex]}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 grayscale w-full h-full object-cover"
          >
            <source src={HERO_VIDEOS[currentVideoIndex]} type="video/mp4" />
          </motion.video>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/60 to-neutral-950" />
      <div className="absolute inset-0 bg-neutral-950/20" />
      <div className="absolute inset-0 mx-auto w-full max-w-screen-xl">
        <div className="top-[20%] left-0 absolute opacity-50 border-neutral-600 border-t border-l w-4 h-4" />
        <div className="top-[20%] right-0 absolute opacity-50 border-neutral-600 border-t border-r w-4 h-4" />
        <div className="bottom-[20%] left-0 absolute opacity-50 border-neutral-600 border-b border-l w-4 h-4" />
        <div className="right-0 bottom-[20%] absolute opacity-50 border-neutral-600 border-r border-b w-4 h-4" />
      </div>
    </div>
  );
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('ofdata_session_token');
    if (session) setIsLoggedIn(true);
  }, []);

  const handleAccessClick = () => {
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  return (
    <main className="w-full h-[100dvh] overflow-x-hidden overflow-y-auto scroll-smooth snap-mandatory snap-y" suppressHydrationWarning>
      <section className="relative flex flex-col justify-center bg-neutral-950 px-6 h-[100dvh] overflow-hidden snap-always snap-start">
        <HeroBackground />
        <motion.div initial="initial" animate="animate" variants={stagger} className="z-10 relative mx-auto w-full max-w-screen-xl pointer-events-none">
          <motion.h1 variants={fadeInUp} className="mb-12 font-serif text-white text-7xl md:text-9xl leading-[0.9] tracking-tight">The Universal <br /> Fitness Interface.</motion.h1>
          <motion.p variants={fadeInUp} className="mb-12 max-w-2xl font-light text-neutral-400 text-xl md:text-2xl leading-relaxed">A comprehensive open-source infrastructure for fitness data. High-performance API for foods, supplements, and exercises.</motion.p>
          <motion.div variants={fadeInUp} className="flex sm:flex-row flex-col border border-neutral-800 w-fit pointer-events-auto">
            <button onClick={handleAccessClick} className="group relative flex justify-between items-center gap-12 bg-white hover:bg-neutral-300 px-6 py-4 font-mono text-[10px] text-black uppercase tracking-[0.2em] transition-all">
              <div className="flex items-center gap-4"><div className="bg-black w-1.5 h-1.5" /><span className="font-bold">{isLoggedIn ? 'Go to Dashboard' : 'Access Platform'}</span></div>
              <div className="flex items-center gap-4"><span className="text-[8px] text-neutral-500 tracking-widest">EXE</span><ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" /></div>
            </button>
            <Link href="/docs" className="group relative flex justify-between items-center gap-12 bg-transparent hover:bg-neutral-900 px-6 py-4 border-neutral-800 border-t sm:border-t-0 sm:border-l font-mono text-[10px] text-neutral-500 hover:text-white uppercase tracking-[0.2em] transition-all">
              <div className="flex items-center gap-4"><span className="text-neutral-700 group-hover:text-white transition-colors">{'//'}</span><span>Read Specs</span></div>
              <span className="text-[8px] text-neutral-700 group-hover:text-neutral-500 tracking-widest transition-colors">DOC</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="relative flex flex-col bg-neutral-950 h-[100dvh] overflow-hidden snap-always snap-start">
        <div className="z-0 absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex justify-between w-full"><span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Sec_02</span><span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Schema.Def</span></div>
            <div className="flex justify-between mt-auto w-full"><span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Vol_4.0</span><span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Sys.Active</span></div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: false, amount: 0.2 }} className="z-10 relative flex flex-col flex-1 w-full">
          <div className="mx-auto px-6 pt-24 md:pt-32 w-full max-w-screen-xl shrink-0">
            <h2 className="mb-6 font-serif text-white text-5xl md:text-6xl tracking-tight">Data without borders.</h2>
            <div className="flex md:flex-row flex-col justify-between md:items-end gap-6 mb-12">
              <p className="max-w-xl text-neutral-400 text-lg leading-relaxed">Aggregating and normalizing disparate international fitness datasets into a single, high-performance universal interface.</p>
              <div className="flex items-center gap-4 font-mono text-[10px] text-neutral-600 uppercase tracking-widest"><span>Scroll to explore</span><ArrowRight className="w-3.5 h-3.5" /></div>
            </div>
          </div>
          <div className="z-10 relative flex flex-1 items-center pb-12 w-full overflow-x-auto snap-mandatory snap-x hide-scrollbar">
            <div className="flex gap-4 px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2))] w-max">
              <div className="group relative flex flex-col bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 w-[320px] sm:w-[400px] h-[380px] transition-colors snap-center shrink-0">
                <div className="flex justify-between items-center bg-neutral-900/30 p-4 border-neutral-800 border-b"><span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Registry.01</span><div className="flex gap-1.5"><span className="bg-neutral-600 w-1 h-1" /><span className="bg-neutral-600 w-1 h-1" /><span className="bg-emerald-500 w-1 h-1" /></div></div>
                <div className="flex flex-col flex-1 p-6"><h3 className="mb-6 font-mono text-white text-sm uppercase tracking-widest">Food Entities</h3><pre className="opacity-80 font-mono text-[10px] text-neutral-400 leading-[1.8]"><span className="text-emerald-400">GET</span>{' /v1/foods/search?q=kale\n\n'}{`{
  "id": "fd_982x1z",
  "name": "Kale, raw",
  "normalized_macros": {
    "protein": 4.3,
    "carbs": 8.8,
    "fat": 0.9
  },
  "sources": ["USDA", "CIQUAL"]
}`}</pre></div></div>
              <div className="group relative flex flex-col bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 w-[320px] sm:w-[400px] h-[380px] transition-colors snap-center shrink-0">
                <div className="flex justify-between items-center bg-neutral-900/30 p-4 border-neutral-800 border-b"><span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Index.02</span><Database className="w-3.5 h-3.5 text-neutral-500" /></div>
                <div className="flex flex-col flex-1 p-6"><h3 className="mb-6 font-mono text-white text-sm uppercase tracking-widest">Trigram Search</h3><div className="flex flex-col flex-1 gap-3 p-4 border border-neutral-800 font-mono text-[10px]"><div className="flex justify-between pb-2 border-neutral-800 border-b text-neutral-500"><span>Query</span><span>Similarity</span></div><div className="flex justify-between text-white"><span>"Whae protien"</span><span className="text-emerald-400">0.92</span></div><div className="flex justify-between text-neutral-400"><span>"Whey protein"</span><span className="text-emerald-400">1.00</span></div><div className="flex justify-between text-neutral-600"><span>"Wheat protein"</span><span className="text-amber-400">0.65</span></div><div className="flex items-center gap-2 mt-auto pt-3 border-neutral-800 border-t text-neutral-500"><Cpu className="w-3 h-3" /> PG_TRGM EXTENSION</div></div></div></div>
              <div className="group relative flex flex-col bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 w-[320px] sm:w-[400px] h-[380px] transition-colors snap-center shrink-0">
                <div className="flex justify-between items-center bg-neutral-900/30 p-4 border-neutral-800 border-b"><span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Pipeline.03</span><Activity className="w-3.5 h-3.5 text-neutral-500" /></div>
                <div className="flex flex-col flex-1 justify-center p-6"><h3 className="mb-8 font-mono text-white text-sm uppercase tracking-widest">LLM Normalization</h3><div className="flex flex-col gap-3 font-mono text-[10px]"><div className="bg-red-950/20 p-3 border border-red-900/30 text-red-400 text-center">"Lait demi-écrémé UHT"</div><div className="bg-neutral-800 mx-auto w-px h-6" /><div className="flex justify-center items-center gap-2 p-3 border border-neutral-800 text-neutral-400"><Cpu className="w-3 h-3" /> AI.NORMALIZE()</div><div className="bg-neutral-800 mx-auto w-px h-6" /><div className="bg-emerald-950/20 p-3 border border-emerald-900/30 text-emerald-400 text-center">"Milk, semi-skimmed"</div></div></div></div>
              <div className="group relative flex flex-col bg-neutral-950/50 hover:bg-neutral-900 border border-neutral-800 w-[320px] sm:w-[400px] h-[380px] transition-colors snap-center shrink-0">
                <div className="flex justify-between items-center bg-neutral-900/30 p-4 border-neutral-800 border-b"><span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Registry.04</span><div className="bg-white w-1.5 h-1.5" /></div>
                <div className="flex flex-col flex-1 p-6"><h3 className="mb-6 font-mono text-white text-sm uppercase tracking-widest">Exercise Vectors</h3><pre className="opacity-80 font-mono text-[10px] text-neutral-400 leading-[1.8]"><span className="text-emerald-400">GET</span>{' /v1/exercises/bbar-squat\n\n'}{`{
  "id": "ex_m291pp",
  "name": "Barbell Squat",
  "mechanics": "Compound",
  "force": "Push",
  "primary_muscles": ["Quadriceps", "Gluteus Maximus"]
}`}</pre></div></div>
            </div>
          </div>
        </motion.div>
      </section>
      
      <section className="relative flex flex-col bg-neutral-950 h-[100dvh] snap-always snap-start">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} viewport={{ once: false, amount: 0.2 }} className="flex flex-col flex-1 justify-center mx-auto px-6 py-12 md:py-24 w-full max-w-screen-xl">
          <div className="flex flex-col shadow-2xl shadow-black border border-neutral-800 w-full">
            <div className="flex md:flex-row flex-col justify-between md:items-end gap-6 bg-neutral-900/20 p-8 md:p-12 border-neutral-800 border-b"><div><h2 className="mb-6 font-serif text-white text-5xl md:text-7xl tracking-tight">Deploy.</h2><p className="max-w-md font-light text-neutral-400 leading-relaxed">Choose your integration path. Run the infrastructure yourself, or connect to our global edge network.</p></div><span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">[ System Architecture ]</span></div>
            <div className="flex md:flex-row flex-col">
              <div className="flex flex-col flex-1 bg-neutral-950 hover:bg-neutral-900/40 p-8 md:p-12 border-neutral-800 md:border-r border-b md:border-b-0 transition-colors">
                <div className="flex justify-between items-center mb-12"><h3 className="font-mono text-white text-sm uppercase tracking-widest">01. Open Source</h3><Terminal className="w-5 h-5 text-neutral-500" /></div>
                <div className="mb-12"><p className="font-light text-neutral-400 text-sm leading-relaxed">Deploy the full PostgreSQL, LLM normalization, and API stack to your own hardware. Full Docker support for air-gapped environments.</p></div>
                <div className="bg-black mt-auto p-5 border border-neutral-800 font-mono text-neutral-300 text-xs"><div className="mb-3 text-neutral-600"># Clone and start services</div><div className="mb-1"><span className="text-emerald-500">git</span> clone open-fitness-data</div><div><span className="text-emerald-500">bun</span> start</div></div>
              </div>
              <div className="group flex flex-col flex-1 bg-neutral-950 hover:bg-neutral-900 p-8 md:p-12 transition-colors cursor-pointer">
                <div className="flex justify-between items-center mb-12"><h3 className="font-mono text-white text-sm uppercase tracking-widest transition-colors">02. Managed Cloud</h3><Cloud className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" /></div>
                <div className="mb-12"><p className="font-light text-neutral-400 group-hover:text-neutral-300 text-sm leading-relaxed transition-colors">Skip the infrastructure. Get instant, rate-limited access to the live, continuously updating global dataset via our edge API.</p></div>
                <div className="mt-auto"><button className="flex justify-between items-center bg-neutral-950 group-hover:bg-white p-5 border border-neutral-700 group-hover:border-white w-full font-mono text-[10px] text-white group-hover:text-black uppercase tracking-[0.2em] transition-all"><span>Generate API Key</span><ArrowRight className="w-3.5 h-3.5" /></button></div>
              </div>
            </div>
          </div>
        </motion.div>
        <footer className="z-10 bg-neutral-950 mt-auto px-6 py-8 border-neutral-900 border-t shrink-0">
          <div className="flex md:flex-row flex-col justify-between items-center gap-6 mx-auto max-w-screen-xl">
            <div className="flex items-center gap-4"><span className="font-mono text-[10px] text-white uppercase tracking-widest">Open Fitness Data</span><span className="font-mono text-[10px] text-neutral-600 uppercase">© 2024</span></div>
            <div className="flex gap-8"><Link href="/docs" className="font-mono text-[10px] text-neutral-500 hover:text-white uppercase tracking-widest transition-colors">Documentation</Link><Link href="https://github.com" className="font-mono text-[10px] text-neutral-500 hover:text-white uppercase tracking-widest transition-colors">GitHub</Link></div>
          </div>
        </footer>
      </section>
    </main>
  );
}
