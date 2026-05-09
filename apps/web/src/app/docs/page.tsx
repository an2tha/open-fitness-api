'use client';

import { ArrowLeft, Terminal, Database, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const ENDPOINTS = [
  {
    id: 'search-foods',
    category: 'Foods',
    method: 'GET',
    path: '/api/v1/foods/search',
    title: 'Search Foods',
    description:
      'Retrieve a normalized list of food items using fuzzy matching. Our trigram index ensures high accuracy even with incomplete or misspelled queries, seamlessly mapping across USDA, CIQUAL, and proprietary datasets.',
    params: (
      <>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">q</span>
            <span className="text-[10px] text-neutral-500">string</span>
            <span className="text-[10px] text-white border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 tracking-widest">
              REQUIRED
            </span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light">
            The search query for the food item (e.g., "kale", "whey protein").
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">limit</span>
            <span className="text-[10px] text-neutral-500">integer</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light">
            Maximum number of results to return. Default is <span className="font-mono text-neutral-300">20</span>.
            Maximum is <span className="font-mono text-neutral-300">100</span>.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">source</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light mb-3">
            Filter by specific data source database. Valid options:
          </p>
          <div className="flex flex-wrap gap-2">
            {['usda', 'ciqual', 'bls', 'cnf', 'cofid', 'nevo', 'swiss'].map((src) => (
              <span
                key={src}
                className="border border-neutral-800 bg-neutral-900/50 px-2 py-1 font-mono text-[10px] text-neutral-400"
              >
                "{src}"
              </span>
            ))}
          </div>
        </div>
      </>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/foods/search?q=kale" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
    res: `{
  "status": "success",
  "metadata": { "count": 1, "query": "kale" },
  "data": [
    {
      "id": "fd_982x1z",
      "name": "Kale, raw",
      "source": "USDA",
      "macros": { "protein": 4.3, "carbs": 8.8, "fat": 0.9 },
      "micros": { "iron_mg": 1.5, "calcium_mg": 250 }
    }
  ]
}`,
  },
  {
    id: 'get-food',
    category: 'Foods',
    method: 'GET',
    path: '/api/v1/foods/:id',
    title: 'Get Food by ID',
    description:
      'Retrieve exact normalized records, macros, and full micronutrient profiles for a specific food entity using its unique identifier.',
    params: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="text-white">id</span>
          <span className="text-[10px] text-neutral-500">string</span>
          <span className="text-[10px] text-white border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 tracking-widest">
            REQUIRED
          </span>
        </div>
        <p className="text-neutral-400 text-sm font-sans font-light">
          The unique system identifier for the food entity.
        </p>
      </div>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/foods/fd_982x1z" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
  },
  {
    id: 'search-exercises',
    category: 'Exercises',
    method: 'GET',
    path: '/api/v1/exercises/search',
    title: 'Search Exercises',
    description:
      'Query our comprehensive exercise database mapped to primary muscle groups, mechanics, and required equipment.',
    params: (
      <>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">q</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light">
            The search query for the exercise (e.g., "squat", "deadlift").
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">muscle</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light mb-3">
            Filter by primary targeted muscle group. Valid options:
          </p>
          <div className="flex flex-wrap gap-2">
            {['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body'].map((m) => (
              <span
                key={m}
                className="border border-neutral-800 bg-neutral-900/50 px-2 py-1 font-mono text-[10px] text-neutral-400"
              >
                "{m}"
              </span>
            ))}
          </div>
        </div>
      </>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/exercises/search?muscle=legs" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
    res: `{
  "status": "success",
  "data": [
    {
      "id": "ex_m291pp",
      "name": "Barbell Squat",
      "primary_muscle": "legs",
      "mechanics": "compound",
      "equipment": "barbell"
    }
  ]
}`,
  },
  {
    id: 'get-exercise',
    category: 'Exercises',
    method: 'GET',
    path: '/api/v1/exercises/:id',
    title: 'Get Exercise by ID',
    description:
      'Retrieve full biomechanical specifications, force types, and instructions for a specific exercise entity.',
    params: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="text-white">id</span>
          <span className="text-[10px] text-neutral-500">string</span>
          <span className="text-[10px] text-white border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 tracking-widest">
            REQUIRED
          </span>
        </div>
        <p className="text-neutral-400 text-sm font-sans font-light">
          The unique system identifier for the exercise entity.
        </p>
      </div>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/exercises/ex_m291pp" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
  },
  {
    id: 'search-supplements',
    category: 'Supplements',
    method: 'GET',
    path: '/api/v1/supplements/search',
    title: 'Search Supplements',
    description:
      'Search our aggregate database of dietary supplements, including third-party testing status (e.g., WADA compliance) and active ingredients.',
    params: (
      <>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">q</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light">
            The search query (e.g., "creatine", "whey isolate").
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">form</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light mb-3">Filter by physical form. Valid options:</p>
          <div className="flex flex-wrap gap-2">
            {['powder', 'pill', 'liquid', 'bar', 'gel'].map((m) => (
              <span
                key={m}
                className="border border-neutral-800 bg-neutral-900/50 px-2 py-1 font-mono text-[10px] text-neutral-400"
              >
                "{m}"
              </span>
            ))}
          </div>
        </div>
      </>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/supplements/search?q=creatine" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
    res: `{
  "status": "success",
  "data": [
    {
      "id": "sup_cr8821",
      "name": "Creatine Monohydrate",
      "form": "powder",
      "certifications": ["wada_compliant", "nsf_sport"],
      "active_ingredients": [
        { "name": "Creatine", "amount_per_serving": "5g" }
      ]
    }
  ]
}`,
  },
  {
    id: 'get-supplement',
    category: 'Supplements',
    method: 'GET',
    path: '/api/v1/supplements/:id',
    title: 'Get Supplement by ID',
    description: 'Retrieve full ingredient profiles, dosages, and compliance certifications for a specific supplement.',
    params: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="text-white">id</span>
          <span className="text-[10px] text-neutral-500">string</span>
          <span className="text-[10px] text-white border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 tracking-widest">
            REQUIRED
          </span>
        </div>
        <p className="text-neutral-400 text-sm font-sans font-light">
          The unique system identifier for the supplement entity.
        </p>
      </div>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/supplements/sup_cr8821" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
  },
  {
    id: 'search-nutrients',
    category: 'Nutrients',
    method: 'GET',
    path: '/api/v1/nutrients/search',
    title: 'Search Nutrients',
    description: 'Query our database of normalized micronutrients, macronutrients, and trace elements.',
    params: (
      <>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">q</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light">The search query (e.g., "vitamin c", "zinc").</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <span className="text-white">category</span>
            <span className="text-[10px] text-neutral-500">string</span>
          </div>
          <p className="text-neutral-400 text-sm font-sans font-light mb-3">
            Filter by nutrient category. Valid options:
          </p>
          <div className="flex flex-wrap gap-2">
            {['macronutrient', 'vitamin', 'mineral', 'trace_element'].map((m) => (
              <span
                key={m}
                className="border border-neutral-800 bg-neutral-900/50 px-2 py-1 font-mono text-[10px] text-neutral-400"
              >
                "{m}"
              </span>
            ))}
          </div>
        </div>
      </>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/nutrients/search?q=zinc" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
    res: `{
  "status": "success",
  "data": [
    {
      "id": "nut_zn22",
      "name": "Zinc",
      "category": "mineral",
      "rda_adult_male": "11mg",
      "rda_adult_female": "8mg",
      "upper_limit": "40mg"
    }
  ]
}`,
  },
  {
    id: 'get-nutrient',
    category: 'Nutrients',
    method: 'GET',
    path: '/api/v1/nutrients/:id',
    title: 'Get Nutrient by ID',
    description:
      'Retrieve exact recommended daily allowances (RDA), toxicity limits, and physiological functions for a specific nutrient.',
    params: (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="text-white">id</span>
          <span className="text-[10px] text-neutral-500">string</span>
          <span className="text-[10px] text-white border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 tracking-widest">
            REQUIRED
          </span>
        </div>
        <p className="text-neutral-400 text-sm font-sans font-light">
          The unique system identifier for the nutrient entity.
        </p>
      </div>
    ),
    req: `curl -X GET "http://localhost:3000/api/v1/nutrients/nut_zn22" \\\n     -H "Authorization: Bearer YOUR_KEY"`,
  },
];

function EndpointBlock({
  endpoint,
  toggleSignal,
}: {
  endpoint: (typeof ENDPOINTS)[0];
  toggleSignal?: { open: boolean; id: number } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (toggleSignal) {
      setIsOpen(toggleSignal.open);
    }
  }, [toggleSignal]);

  return (
    <div id={endpoint.id} className="border border-neutral-800 bg-neutral-950 mb-4 transition-colors group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-neutral-900/50 transition-colors text-left gap-4"
      >
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] text-white uppercase border border-neutral-700 bg-neutral-800 px-2 py-1 tracking-widest shrink-0">
            {endpoint.method}
          </span>
          <span className="font-mono text-sm text-neutral-300 break-all">{endpoint.path}</span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <span className="text-sm text-neutral-500 font-serif italic tracking-wide">{endpoint.title}</span>
          <div className="shrink-0 p-1 border border-neutral-800 bg-neutral-950 group-hover:border-neutral-600 transition-colors">
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-800"
          >
            <div className="p-6 lg:p-8 flex flex-col xl:flex-row gap-12 bg-neutral-950">
              {/* Left Column: Docs & Params */}
              <div className="flex-1">
                <h2 className="font-serif text-4xl text-white mb-6 tracking-tight">{endpoint.title}</h2>
                <p className="text-neutral-400 font-light leading-relaxed mb-10">{endpoint.description}</p>

                {endpoint.params && (
                  <>
                    <h3 className="font-mono text-[10px] uppercase text-neutral-500 tracking-[0.2em] mb-6 border-b border-neutral-900 pb-4">
                      Parameters
                    </h3>
                    <div className="space-y-6 font-mono text-sm mb-8 xl:mb-0">{endpoint.params}</div>
                  </>
                )}
              </div>

              {/* Right Column: Code & Interactive */}
              <div className="w-full xl:w-[450px] 2xl:w-[500px] shrink-0 flex flex-col gap-6">
                {/* Request Box */}
                <div className="border border-neutral-800 bg-neutral-900/20">
                  <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/40">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">
                        Example Request
                      </span>
                    </div>
                    <button className="flex items-center gap-2 font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:text-white hover:bg-neutral-800 transition-all px-3 py-1.5 uppercase tracking-widest">
                      Copy to Clipboard <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="p-4 overflow-x-auto hide-scrollbar">
                    <pre className="font-mono text-[11px] text-neutral-300 leading-relaxed">{endpoint.req}</pre>
                  </div>
                </div>

                {/* Response Box */}
                {endpoint.res && (
                  <div className="border border-neutral-800 bg-neutral-900/20">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/40">
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="font-mono text-[10px] uppercase text-neutral-500 tracking-widest">
                          Response
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500" />
                        <span className="font-mono text-[10px] text-white tracking-widest">200 OK</span>
                      </div>
                    </div>
                    <div className="p-4 overflow-x-auto hide-scrollbar">
                      <pre className="font-mono text-[11px] text-neutral-400 leading-[1.8]">{endpoint.res}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategorySection({ category, endpoints }: { category: string; endpoints: typeof ENDPOINTS }) {
  const [toggleSignal, setToggleSignal] = useState<{ open: boolean; id: number } | null>(null);

  return (
    <div className="mb-24">
      <div className="flex items-end justify-between border-b border-neutral-900 pb-4 mb-8">
        <h2 className="font-mono text-xs uppercase text-white tracking-[0.2em]">{category}</h2>
        <div className="flex items-center gap-4 font-mono text-[10px] tracking-widest uppercase">
          <button
            onClick={() => setToggleSignal({ open: true, id: Date.now() })}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            [ Expand All ]
          </button>
          <button
            onClick={() => setToggleSignal({ open: false, id: Date.now() })}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            [ Collapse All ]
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        {endpoints.map((endpoint) => (
          <EndpointBlock key={endpoint.id} endpoint={endpoint} toggleSignal={toggleSignal} />
        ))}
      </div>
    </div>
  );
}

export default function DocsPage() {
  const categories = Array.from(new Set(ENDPOINTS.map((e) => e.category)));

  return (
    <div
      className="min-h-[100dvh] bg-neutral-950 text-neutral-400 font-sans flex flex-col lg:flex-row selection:bg-white selection:text-black"
      suppressHydrationWarning
    >
      {/* Sidebar */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-neutral-900 lg:h-screen lg:sticky top-0 bg-neutral-950 z-20 flex flex-col shrink-0">
        <div className="p-6 border-b border-neutral-900 flex items-center justify-between lg:justify-start">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-white hover:text-neutral-400 transition-colors flex items-center gap-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Index
          </Link>
        </div>
        <div className="p-6 overflow-y-auto flex-1 hidden lg:block">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-6">Core System</div>
          <ul className="space-y-4 font-mono text-xs mb-12">
            <li>
              <Link href="#auth" className="text-neutral-500 hover:text-white transition-colors">
                Authentication
              </Link>
            </li>
            <li>
              <Link href="#pagination" className="text-neutral-500 hover:text-white transition-colors">
                Pagination
              </Link>
            </li>
          </ul>

          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600 mb-6">Endpoints</div>

          {categories.map((category) => (
            <div key={category} className="mb-8">
              <h5 className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 border-b border-neutral-900 pb-2 mb-3">
                {category}
              </h5>
              <ul className="space-y-3 font-mono text-xs">
                {ENDPOINTS.filter((e) => e.category === category).map((e) => (
                  <li key={e.id}>
                    <Link href={`#${e.id}`} className="text-neutral-500 hover:text-white transition-colors">
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-2xl mx-auto p-6 lg:p-16">
        <div className="mb-16">
          <h1 className="font-serif text-5xl lg:text-7xl text-white mb-6 tracking-tight">API Reference</h1>
          <p className="text-lg text-neutral-400 font-light max-w-2xl">
            Explore the Open Fitness Data endpoints. Click on any endpoint below to expand its documentation, view
            parameters, and execute live test requests.
          </p>
        </div>

        {categories.map((category) => (
          <CategorySection
            key={category}
            category={category}
            endpoints={ENDPOINTS.filter((e) => e.category === category)}
          />
        ))}
      </main>
    </div>
  );
}
