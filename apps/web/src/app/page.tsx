'use client';

import { motion } from 'framer-motion';
import { Activity, Database, Terminal, Cpu, ArrowRight, Cloud, Check } from 'lucide-react';
import Link from 'next/link';

function HeroBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Flowing Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-grid-flow" />

      {/* Existing Scanline */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]">
        <motion.div
          initial={{ y: '-10%' }}
          animate={{ y: '100vh' }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="w-full h-32 bg-gradient-to-b from-transparent via-neutral-800/20 to-transparent"
        />
      </div>

      {/* Registration Marks */}
      <div className="absolute inset-0 max-w-screen-xl mx-auto w-full">
        <div className="absolute top-[20%] left-0 w-4 h-4 border-l border-t border-neutral-600 opacity-50" />
        <div className="absolute top-[20%] right-0 w-4 h-4 border-r border-t border-neutral-600 opacity-50" />
        <div className="absolute bottom-[20%] left-0 w-4 h-4 border-l border-b border-neutral-600 opacity-50" />
        <div className="absolute bottom-[20%] right-0 w-4 h-4 border-r border-b border-neutral-600 opacity-50" />
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
  return (
    <main
      className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth"
      suppressHydrationWarning
    >
      {/* 1. HERO SECTION */}
      <section className="px-6 flex flex-col justify-center h-[100dvh] snap-start snap-always relative overflow-hidden bg-neutral-950">
        <HeroBackground />

        <motion.div
          suppressHydrationWarning
          initial="initial"
          animate="animate"
          variants={stagger}
          className="max-w-screen-xl mx-auto w-full relative z-10 pointer-events-none"
        >
          <motion.h1
            suppressHydrationWarning
            variants={fadeInUp}
            className="font-serif text-7xl md:text-9xl text-white leading-[0.9] mb-12 tracking-tight"
          >
            The Universal <br />
            Fitness Interface.
          </motion.h1>

          <motion.p
            suppressHydrationWarning
            variants={fadeInUp}
            className="max-w-2xl text-xl md:text-2xl font-light text-neutral-400 leading-relaxed mb-12"
          >
            A comprehensive open-source infrastructure for fitness data. High-performance API for foods, supplements,
            and exercises.
          </motion.p>

          <motion.div
            suppressHydrationWarning
            variants={fadeInUp}
            className="flex flex-col sm:flex-row w-fit border border-neutral-800 pointer-events-auto"
          >
            <button className="group relative flex items-center justify-between gap-12 bg-white px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-black transition-all hover:bg-neutral-300">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 bg-black" />
                <span className="font-bold">Access Platform</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[8px] tracking-widest text-neutral-500">EXE</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
            <Link
              href="/docs"
              className="group relative flex items-center justify-between gap-12 bg-transparent px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 transition-all hover:bg-neutral-900 hover:text-white border-t border-neutral-800 sm:border-t-0 sm:border-l"
            >
              <div className="flex items-center gap-4">
                <span className="text-neutral-700 transition-colors group-hover:text-white">{'//'}</span>
                <span>Read Specs</span>
              </div>
              <span className="text-[8px] tracking-widest text-neutral-700 transition-colors group-hover:text-neutral-500">
                DOC
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. DATA WITHOUT BORDERS */}
      <section className="flex flex-col h-[100dvh] snap-start snap-always relative overflow-hidden bg-neutral-950">
        {/* Static Decorations */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#171717_1px,transparent_1px),linear-gradient(to_bottom,#171717_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex justify-between w-full">
              <span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Sec_02</span>
              <span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Schema.Def</span>
            </div>
            <div className="flex justify-between w-full mt-auto">
              <span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Vol_4.0</span>
              <span className="font-mono text-[9px] text-neutral-700 uppercase tracking-[0.3em]">Sys.Active</span>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, amount: 0.2 }}
          className="flex flex-col flex-1 w-full relative z-10"
        >
          <div className="pt-24 md:pt-32 px-6 max-w-screen-xl mx-auto w-full shrink-0">
            <h2 className="font-serif text-5xl md:text-6xl text-white mb-6 tracking-tight">Data without borders.</h2>
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-12">
              <p className="text-neutral-400 text-lg max-w-xl leading-relaxed">
                Aggregating and normalizing disparate international fitness datasets into a single, high-performance
                universal interface.
              </p>
              <div className="flex items-center gap-4 text-neutral-600 font-mono text-[10px] uppercase tracking-widest">
                <span>Scroll to explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full overflow-x-auto snap-x snap-mandatory flex items-center pb-12 relative z-10 hide-scrollbar">
            <div className="flex gap-4 px-6 w-max lg:px-[max(1.5rem,calc((100vw-80rem)/2))]">
              {/* Card 1: Food Registry */}
              <div className="w-[320px] sm:w-[400px] h-[380px] border border-neutral-800 bg-neutral-950/50 flex flex-col shrink-0 snap-center relative group hover:bg-neutral-900 transition-colors">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
                  <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">Registry.01</span>
                  <div className="flex gap-1.5">
                    <span className="w-1 h-1 bg-neutral-600" />
                    <span className="w-1 h-1 bg-neutral-600" />
                    <span className="w-1 h-1 bg-emerald-500" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-mono text-sm text-white uppercase mb-6 tracking-widest">Food Entities</h3>
                  <pre className="text-[10px] text-neutral-400 font-mono leading-[1.8] opacity-80">
                    <span className="text-emerald-400">GET</span>
                    {' /v1/foods/search?q=kale\n\n'}
                    {`{
  "id": "fd_982x1z",
  "name": "Kale, raw",
  "normalized_macros": {
    "protein": 4.3,
    "carbs": 8.8,
    "fat": 0.9
  },
  "sources": ["USDA", "CIQUAL"]
}`}
                  </pre>
                </div>
              </div>

              {/* Card 2: Trigram Index */}
              <div className="w-[320px] sm:w-[400px] h-[380px] border border-neutral-800 bg-neutral-950/50 flex flex-col shrink-0 snap-center relative group hover:bg-neutral-900 transition-colors">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
                  <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">Index.02</span>
                  <Database className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-mono text-sm text-white uppercase mb-6 tracking-widest">Trigram Search</h3>
                  <div className="flex-1 border border-neutral-800 p-4 font-mono text-[10px] flex flex-col gap-3">
                    <div className="flex justify-between text-neutral-500 border-b border-neutral-800 pb-2">
                      <span>Query</span>
                      <span>Similarity</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>"Whae protien"</span>
                      <span className="text-emerald-400">0.92</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>"Whey protein"</span>
                      <span className="text-emerald-400">1.00</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>"Wheat protein"</span>
                      <span className="text-amber-400">0.65</span>
                    </div>
                    <div className="mt-auto text-neutral-500 pt-3 border-t border-neutral-800 flex items-center gap-2">
                      <Cpu className="w-3 h-3" /> PG_TRGM EXTENSION
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: LLM Pipeline */}
              <div className="w-[320px] sm:w-[400px] h-[380px] border border-neutral-800 bg-neutral-950/50 flex flex-col shrink-0 snap-center relative group hover:bg-neutral-900 transition-colors">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
                  <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">Pipeline.03</span>
                  <Activity className="w-3.5 h-3.5 text-neutral-500" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="font-mono text-sm text-white uppercase mb-8 tracking-widest">LLM Normalization</h3>
                  <div className="flex flex-col gap-3 font-mono text-[10px]">
                    <div className="p-3 border border-red-900/30 bg-red-950/20 text-red-400 text-center">
                      "Lait demi-écrémé UHT"
                    </div>
                    <div className="w-px h-6 bg-neutral-800 mx-auto" />
                    <div className="p-3 border border-neutral-800 flex items-center justify-center gap-2 text-neutral-400">
                      <Cpu className="w-3 h-3" /> AI.NORMALIZE()
                    </div>
                    <div className="w-px h-6 bg-neutral-800 mx-auto" />
                    <div className="p-3 border border-emerald-900/30 bg-emerald-950/20 text-emerald-400 text-center">
                      "Milk, semi-skimmed"
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Exercises */}
              <div className="w-[320px] sm:w-[400px] h-[380px] border border-neutral-800 bg-neutral-950/50 flex flex-col shrink-0 snap-center relative group hover:bg-neutral-900 transition-colors">
                <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
                  <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">Registry.04</span>
                  <div className="w-1.5 h-1.5 bg-white" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-mono text-sm text-white uppercase mb-6 tracking-widest">Exercise Vectors</h3>
                  <pre className="text-[10px] text-neutral-400 font-mono leading-[1.8] opacity-80">
                    <span className="text-emerald-400">GET</span>
                    {' /v1/exercises/bbar-squat\n\n'}
                    {`{
  "id": "ex_m291pp",
  "name": "Barbell Squat",
  "mechanics": "Compound",
  "force": "Push",
  "primary_muscles": [
    "Quadriceps",
    "Gluteus Maximus"
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. PRICING / ACCESS SECTION */}
      <section className="flex flex-col min-h-[100dvh] md:h-[100dvh] snap-start snap-always relative bg-neutral-950 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, amount: 0.2 }}
          className="flex-1 flex flex-col justify-center max-w-screen-xl mx-auto w-full px-6 py-12"
        >
          <div className="mb-12">
            <h2 className="font-serif text-5xl md:text-7xl text-white tracking-tight mb-4">Resource Allocation.</h2>
            <p className="font-light text-neutral-400 max-w-2xl leading-relaxed">
              Fitness data should be universally accessible. Our core API is free forever. If you run a production app,
              consider becoming a supporter to guarantee your bandwidth.
            </p>
          </div>

          <div className="flex flex-col border border-neutral-800 shadow-2xl shadow-black">
            {/* Tier 1: Free (Top Row, Highlighted) */}
            <div className="p-8 md:p-12 border-b border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="flex-1 pl-4 md:pl-0">
                <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Tier . 01</h3>
                <div className="flex items-end gap-6 mb-4">
                  <div className="text-5xl md:text-6xl text-white font-serif tracking-tight">Community</div>
                  <div className="font-mono text-xl text-emerald-400 mb-1">
                    $0.00 <span className="text-sm text-neutral-500">/ mo</span>
                  </div>
                </div>
                <p className="text-lg text-neutral-300 font-light leading-relaxed max-w-xl">
                  <span className="text-white font-medium">Free, forever, for everyone.</span> Everything included.
                </p>
              </div>
              <div className="shrink-0 w-full md:w-auto mt-6 md:mt-0">
                <button className="w-full md:w-64 p-5 border border-neutral-700 bg-black text-white font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-colors">
                  Get Free Key
                </button>
              </div>
            </div>

            {/* Bottom Row: Split */}
            <div className="flex flex-col md:flex-row">
              {/* Tier 2: Supporter */}
              <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950 flex flex-col hover:bg-neutral-900/40 transition-colors">
                <div className="mb-8">
                  <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Tier . 02</h3>
                  <div className="text-3xl text-white font-serif mb-2">Supporter</div>

                  {/* Custom Amount Input */}
                  <div className="flex items-center gap-2 mt-4 mb-2">
                    <div className="flex items-center border border-neutral-700 bg-black px-3 py-2 w-32 focus-within:border-emerald-500 transition-colors">
                      <span className="text-neutral-500 font-mono text-sm mr-2">$</span>
                      <input
                        type="number"
                        min="2"
                        defaultValue="5"
                        className="bg-transparent text-white font-mono text-sm w-full outline-none hide-spinners"
                      />
                    </div>
                    <span className="font-mono text-xs text-neutral-500">/ mo</span>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest">Minimum $2.00</span>
                </div>
                <ul className="space-y-4 font-mono text-xs text-neutral-400 mb-10 flex-1">
                  <li className="flex items-start gap-3">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{' '}
                    <span className="leading-relaxed">(Near) guaranteed uptime, even during peak usage times.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{' '}
                    <span className="leading-relaxed">Directly supports infrastructure & upkeep costs.</span>
                  </li>
                </ul>
                <button className="w-full p-4 border border-emerald-900 bg-emerald-950/30 text-emerald-500 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-black transition-colors">
                  Pledge Support
                </button>
              </div>

              {/* Tier 3: Self Hosted */}
              <div className="flex-1 p-8 md:p-12 bg-neutral-950 flex flex-col hover:bg-neutral-900/40 transition-colors">
                <div className="mb-8">
                  <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-4">Tier . 03</h3>
                  <div className="text-3xl text-white font-serif mb-2">Self-Hosted</div>
                  <div className="font-mono text-sm text-neutral-500">Open Source</div>
                </div>
                <p className="text-sm text-neutral-400 font-light leading-relaxed mb-10 flex-1">
                  Own your infrastructure. Deploy the full stack to your own hardware. Zero rate limits, maximum
                  privacy.
                </p>
                <button className="w-full p-4 border border-neutral-800 bg-black text-neutral-400 font-mono text-[10px] uppercase tracking-[0.2em] hover:text-white hover:bg-neutral-900 transition-colors flex items-center justify-center gap-3">
                  <Terminal className="w-3.5 h-3.5" /> View Docs
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 4. DEPLOY / FOOTER SECTION */}
      <section className="flex flex-col h-[100dvh] snap-start snap-always relative bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: false, amount: 0.2 }}
          className="flex-1 flex flex-col justify-center max-w-screen-xl mx-auto w-full px-6 py-12 md:py-24"
        >
          <div className="border border-neutral-800 flex flex-col w-full shadow-2xl shadow-black">
            {/* Top Header */}
            <div className="border-b border-neutral-800 p-8 md:p-12 flex flex-col md:flex-row md:items-end justify-between gap-6 bg-neutral-900/20">
              <div>
                <h2 className="font-serif text-5xl md:text-7xl text-white tracking-tight mb-6">Deploy.</h2>
                <p className="font-light text-neutral-400 max-w-md leading-relaxed">
                  Choose your integration path. Run the infrastructure yourself, or connect to our global edge network.
                </p>
              </div>
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                [ System Architecture ]
              </span>
            </div>

            {/* Split Content */}
            <div className="flex flex-col md:flex-row">
              {/* Left: Self-Hosted */}
              <div className="flex-1 border-b md:border-b-0 md:border-r border-neutral-800 p-8 md:p-12 flex flex-col bg-neutral-950 hover:bg-neutral-900/40 transition-colors">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="font-mono text-sm text-white uppercase tracking-widest">01. Open Source</h3>
                  <Terminal className="w-5 h-5 text-neutral-500" />
                </div>
                <div className="mb-12">
                  <p className="text-sm text-neutral-400 font-light leading-relaxed">
                    Deploy the full PostgreSQL, LLM normalization, and API stack to your own hardware. Full Docker
                    support for air-gapped environments.
                  </p>
                </div>
                <div className="mt-auto border border-neutral-800 bg-black p-5 font-mono text-xs text-neutral-300">
                  <div className="text-neutral-600 mb-3"># Clone and start services</div>
                  <div className="mb-1">
                    <span className="text-emerald-500">git</span> clone open-fitness-data
                  </div>
                  <div>
                    <span className="text-emerald-500">bun</span> start
                  </div>
                </div>
              </div>

              {/* Right: Hosted API */}
              <div className="flex-1 p-8 md:p-12 flex flex-col bg-neutral-950 hover:bg-neutral-900 group transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-12">
                  <h3 className="font-mono text-sm text-white uppercase tracking-widest transition-colors">
                    02. Managed Cloud
                  </h3>
                  <Cloud className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                </div>
                <div className="mb-12">
                  <p className="text-sm text-neutral-400 group-hover:text-neutral-300 font-light leading-relaxed transition-colors">
                    Skip the infrastructure. Get instant, rate-limited access to the live, continuously updating global
                    dataset via our edge API.
                  </p>
                </div>
                <div className="mt-auto">
                  <button className="w-full flex items-center justify-between p-5 border border-neutral-700 group-hover:border-white bg-neutral-950 group-hover:bg-white text-white group-hover:text-black font-mono text-[10px] uppercase tracking-[0.2em] transition-all">
                    <span>Generate API Key</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <footer className="py-8 px-6 border-t border-neutral-900 mt-auto shrink-0 bg-neutral-950 z-10">
          <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-widest text-white uppercase">Open Fitness Data</span>
              <span className="text-[10px] font-mono text-neutral-600 uppercase">© 2024</span>
            </div>
            <div className="flex gap-8">
              <Link
                href="/docs"
                className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="https://github.com"
                className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
              >
                GitHub
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
