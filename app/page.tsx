'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { checkEngineHealth } from '@/lib/engine-client';
import FirstLaunch from '@/components/FirstLaunch';
import DesktopLayout from './desktop-layout';
import { isDesktop } from '@/lib/desktop-config';

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);
  const [showDesktop, setShowDesktop] = useState(false);

  useEffect(() => {
    checkEngine();
  }, []);

  const checkEngine = async () => {
    try {
      // Only check engine in desktop mode
      if (isDesktop()) {
        const health = await checkEngineHealth();
        if (!health.engineConfigured || !health.ollamaAvailable) {
          setShowFirstLaunch(true);
        } else {
          setShowDesktop(true);
        }
      } else {
        // Web mode - redirect to projects
        window.location.href = '/projects';
      }
    } catch (error) {
      console.error('Failed to check engine:', error);
      // In desktop mode, show setup if check fails
      if (isDesktop()) {
        setShowFirstLaunch(true);
      } else {
        window.location.href = '/projects';
      }
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f6f1e8]">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (showFirstLaunch) {
    return <FirstLaunch onComplete={() => {
      setShowFirstLaunch(false);
      setShowDesktop(true);
    }} />;
  }

  if (showDesktop || isDesktop()) {
    return <DesktopLayout />;
  }

  // Web mode - show landing page (fallback, should redirect to /projects)
  return (
    <main className="bg-[#f6f1e8] text-slate-900">
      {/* Header with Logo */}
      <header className="border-b border-b-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="Data Confessional"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="text-xl font-bold text-slate-900">Data Confessional</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-b-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-10 px-4 py-16 md:flex-row md:items-center md:py-20">
          {/* Text */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Where your data goes to tell the truth.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-800">
              Drop in exports, spreadsheets, and links. Walk out with honest dashboards,
              clear reports, and decks you can actually take into the room.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/projects"
                className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-[#f6f1e8] shadow-sm hover:bg-slate-800 transition-colors"
              >
                Begin a confession
              </Link>
              <button className="text-sm font-medium underline-offset-4 hover:underline text-slate-700">
                See an example briefing
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              Start with a single project and a couple of files. No complicated setup.
            </p>
          </div>

          {/* Visual placeholder */}
          <div className="md:w-1/2">
            <div className="relative mx-auto h-64 max-w-md rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 shadow-xl md:h-80">
              {/* Booth frame */}
              <div className="h-full rounded-lg border border-white/10 bg-[#201710] bg-[radial-gradient(circle_at_top,_#3b2a1a,_#1a120c)] p-3">
                <div className="h-full rounded-md bg-slate-950/60 p-3">
                  {/* Simulated "screen" with charts */}
                  <div className="grid h-full gap-3">
                    <div className="h-1/2 rounded-md bg-slate-800/70 flex items-center justify-center">
                      <div className="text-xs text-slate-400">📊 Dashboard</div>
                    </div>
                    <div className="grid h-1/2 grid-cols-2 gap-3">
                      <div className="rounded-md bg-slate-800/70 flex items-center justify-center">
                        <div className="text-xs text-slate-400">📈 Chart</div>
                      </div>
                      <div className="rounded-md bg-slate-800/70 flex items-center justify-center">
                        <div className="text-xs text-slate-400">📋 Report</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Optional "light" accent */}
              <div className="pointer-events-none absolute inset-x-8 bottom-0 h-4 rounded-full bg-black/60 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-b-slate-200 bg-[#f1ebdf]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            A quiet booth between spreadsheets and the boardroom.
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-800">
            Data Confessional helps you bring in the mess, interview your data, and leave
            with a story you can actually tell.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">1. Bring in the mess</h3>
              <p className="mt-2 text-sm text-slate-800">
                Upload CSVs and Excel files, paste URLs, or drop in text. Data Confessional
                profiles your tables and pulls out the useful bits.
              </p>
            </div>
            {/* Step 2 */}
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">2. Interview the data</h3>
              <p className="mt-2 text-sm text-slate-800">
                The app generates dashboards and first-draft reports, then lets you ask questions
                in plain language. It always shows which numbers and sources it used.
              </p>
            </div>
            {/* Step 3 */}
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">3. Leave with a story</h3>
              <p className="mt-2 text-sm text-slate-800">
                Export executive summaries, board decks, or detailed reports. Everything is
                structured, readable, and ready to share.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-b-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Not another dashboard. A room where the story comes together.
          </h2>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold">
                Honest insights, not vanity metrics
              </h3>
              <p className="mt-2 text-sm text-slate-800">
                See what&apos;s really happening, with clear caveats and context instead of
                cherry-picked numbers.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">
                From raw exports to ready-to-share decks
              </h3>
              <p className="mt-2 text-sm text-slate-800">
                Turn messy inputs into slides and reports without spending your nights doing
                slide surgery.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">
                A workspace you actually want to open
              </h3>
              <p className="mt-2 text-sm text-slate-800">
                Calm, warm, focused — more like a quiet office than a blinking control center.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Answers that show their receipts
              </h3>
              <p className="mt-2 text-sm text-slate-800">
                Every answer explains which tables, columns, and links it drew from, so you
                can trust what you share.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-b-slate-200 bg-[#f1ebdf]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            When should you send your data to confession?
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Quarterly sales briefings</h3>
              <p className="mt-2 text-sm text-slate-800">
                Bring in CRM exports and pipeline snapshots. Leave with funnels, conversion charts,
                and a summary you can walk through in ten minutes.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Market research snapshots</h3>
              <p className="mt-2 text-sm text-slate-800">
                Mix public links with internal numbers. Let the booth pull out what&apos;s growing,
                who&apos;s winning, and where the gaps are.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Marketing performance reviews</h3>
              <p className="mt-2 text-sm text-slate-800">
                Upload channel reports and landing page URLs. See the story across channels without
                spending all day formatting slides.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/70 p-5 shadow-sm">
              <h3 className="text-base font-semibold">Consulting and client reporting</h3>
              <p className="mt-2 text-sm text-slate-800">
                Use consistent templates to turn client data into polished deliverables, project
                after project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-b border-b-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Ready to hear what your data has been trying to tell you?
          </h2>
          <p className="mt-4 text-base text-slate-800">
            Start a project, drop in a few files, and see what comes out of the booth.
          </p>
          <div className="mt-8">
            <Link
              href="/projects"
              className="inline-block rounded-md bg-slate-900 px-6 py-3 text-sm font-medium text-[#f6f1e8] shadow-sm hover:bg-slate-800 transition-colors"
            >
              Begin a confession
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#201710] text-slate-300 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="text-sm">
            Data Confessional — bring the mess, leave with the story.
          </p>
        </div>
      </footer>
    </main>
  );
}
