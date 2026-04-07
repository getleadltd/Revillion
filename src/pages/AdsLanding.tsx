/**
 * /earn — Dedicated Meta Ads landing page
 *
 * Design principles (Meta compliance):
 * - No casino imagery above the fold
 * - Language focused on "performance marketing" and "affiliate revenue"
 * - Single clear CTA → dashboard registration
 * - noindex (ads traffic only, not for SEO)
 * - Tracks: PageView, ViewContent (calculator), Lead (CTA click)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, TrendingUp, Zap, Shield, Clock, BarChart3, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { trackMetaPageView, trackMetaViewContent, trackMetaLead } from '@/lib/metaPixel';
import revillionLogo from '@/assets/revillion-logo.png?format=webp&quality=85&w=170';

// ─── Mini calculator (self-contained, no Layout wrapper) ─────────────────────

type TrafficSource = { label: string; icon: string; traffic: number; ctr: number; reg: number; dep: number };

const SOURCES: TrafficSource[] = [
  { label: 'Telegram',   icon: '💬', traffic: 15000, ctr: 5,  reg: 25, dep: 40 },
  { label: 'SEO Blog',   icon: '✍️', traffic: 50000, ctr: 2,  reg: 15, dep: 35 },
  { label: 'YouTube',    icon: '▶️', traffic: 100000, ctr: 1, reg: 20, dep: 45 },
  { label: 'Paid Ads',   icon: '📣', traffic: 30000, ctr: 4,  reg: 30, dep: 50 },
];

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}K`
  : `$${Math.round(n)}`;

function MiniCalculator({ onResult }: { onResult: (monthly: number) => void }) {
  const [traffic, setTraffic]   = useState(20000);
  const [ctr, setCtr]           = useState(3);
  const [regRate, setRegRate]   = useState(20);
  const [depRate, setDepRate]   = useState(35);
  const [cpaRate, setCpaRate]   = useState(150);
  const [active, setActive]     = useState<number | null>(null);
  const tracked                 = useRef(false);

  const stats = useMemo(() => {
    const clicks     = Math.round(traffic * (ctr / 100));
    const regs       = Math.round(clicks  * (regRate / 100));
    const depositors = Math.round(regs    * (depRate / 100));
    const monthly    = depositors * cpaRate;
    return { clicks, regs, depositors, monthly };
  }, [traffic, ctr, regRate, depRate, cpaRate]);

  useEffect(() => {
    onResult(stats.monthly);
    if (!tracked.current && stats.monthly > 0) {
      tracked.current = true;
      trackMetaViewContent('calculator_interaction');
    }
  }, [stats.monthly, onResult]);

  const applySource = (s: TrafficSource, idx: number) => {
    setActive(idx);
    setTraffic(s.traffic);
    setCtr(s.ctr);
    setRegRate(s.reg);
    setDepRate(s.dep);
  };

  return (
    <div className="space-y-6">
      {/* Source presets */}
      <div>
        <p className="text-sm text-gray-400 mb-3">I bring traffic from:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOURCES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => applySource(s, i)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                active === i
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Monthly visitors</span>
            <span className="text-sm font-bold text-white tabular-nums">{traffic.toLocaleString()}</span>
          </div>
          <Slider min={1000} max={500000} step={1000} value={[traffic]} onValueChange={([v]) => { setActive(null); setTraffic(v); }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Click-through rate</span>
            <span className="text-sm font-bold text-white tabular-nums">{ctr}%</span>
          </div>
          <Slider min={0.5} max={15} step={0.5} value={[ctr]} onValueChange={([v]) => { setActive(null); setCtr(v); }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Registration rate</span>
            <span className="text-sm font-bold text-white tabular-nums">{regRate}%</span>
          </div>
          <Slider min={1} max={60} step={1} value={[regRate]} onValueChange={([v]) => { setActive(null); setRegRate(v); }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Deposit rate</span>
            <span className="text-sm font-bold text-white tabular-nums">{depRate}%</span>
          </div>
          <Slider min={5} max={80} step={1} value={[depRate]} onValueChange={([v]) => { setActive(null); setDepRate(v); }} />
        </div>
      </div>

      {/* CPA rate selector */}
      <div>
        <p className="text-sm text-gray-400 mb-3">CPA rate (based on your GEO)</p>
        <div className="flex flex-wrap gap-2">
          {[50, 100, 150, 200, 220].map(r => (
            <button
              key={r}
              onClick={() => setCpaRate(r)}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all duration-200 ${
                cpaRate === r
                  ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              ${r}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Your estimated monthly earnings</p>
            <div className="text-4xl font-black text-orange-400 tabular-nums">{fmt(stats.monthly)}</div>
            <p className="text-gray-500 text-xs mt-1">
              {stats.depositors} depositors × ${cpaRate} CPA
            </p>
          </div>
          <div className="hidden sm:block text-right space-y-1">
            <div className="text-sm text-gray-500">{stats.clicks.toLocaleString()} clicks</div>
            <div className="text-sm text-gray-500">{stats.regs.toLocaleString()} registrations</div>
            <div className="text-sm font-semibold text-orange-400">{stats.depositors} conversions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: 'Marco R.',
    country: '🇮🇹 Italy',
    source: 'SEO Blog',
    monthly: '$4,200',
    quote: 'Switched from my old network 6 months ago. Same traffic, almost double the CPA. Payments always on time.',
  },
  {
    name: 'Dmitri V.',
    country: '🇩🇪 Germany',
    source: 'Telegram',
    monthly: '$6,800',
    quote: '22,000 subscribers, $220 CPA on German traffic. The dashboard tracking is transparent and accurate.',
  },
  {
    name: 'Ana S.',
    country: '🇧🇷 Brazil',
    source: 'YouTube',
    monthly: '$3,100',
    quote: 'Started with RevShare, moved to CPA after seeing the numbers. The affiliate manager actually responds.',
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdsLanding() {
  const { lang = 'en' } = useParams();
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const ctaLabel = monthlyEarnings > 0
    ? `Start earning ${fmt(monthlyEarnings)}/mo →`
    : 'Start earning now →';

  useEffect(() => {
    trackMetaPageView();
  }, []);

  const handleCTAClick = (source: string) => {
    trackMetaLead({ source, value: monthlyEarnings });
  };

  return (
    <>
      <Helmet>
        <title>Earn Up to $220 Per Referral | Revillion Partners</title>
        <meta name="description" content="Join 800+ performance marketers earning up to $220 CPA with Revillion Partners. 16 top brands, real-time tracking, weekly payments." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-[#0a0a0a] text-white">

        {/* ── Minimal header ────────────────────────────────────────────── */}
        <header className="border-b border-white/8 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to={`/${lang}`}>
              <img src={revillionLogo} alt="Revillion Partners" height={40} className="h-10 w-auto" />
            </Link>
            <a
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCTAClick('header')}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm rounded-full px-5 py-2 transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-orange-500/20"
            >
              Join free <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/6 rounded-full blur-[160px] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-3xl mx-auto"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">843 active affiliates · $11.2M paid</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-[3.8rem] font-black leading-[1.05] tracking-tight mb-6">
                Turn your audience into
                <span className="text-orange-500"> up to $220</span>
                <br />per referral
              </h1>

              <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Revillion Partners pays performance marketers, bloggers, and content creators
                for every qualified referral — with <span className="text-white font-semibold">weekly payments</span> and{' '}
                <span className="text-white font-semibold">real-time tracking</span>.
              </p>

              {/* Trust pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { icon: <Zap className="w-3.5 h-3.5" />, label: 'Weekly payments' },
                  { icon: <Shield className="w-3.5 h-3.5" />, label: '16 top brands' },
                  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: 'Real-time dashboard' },
                  { icon: <Clock className="w-3.5 h-3.5" />, label: 'Instant approval' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-gray-400 text-sm border border-white/10 rounded-full px-3 py-1.5">
                    <span className="text-orange-500">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>

              <a
                href="https://dashboard.revillion.com/en/registration"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('hero')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-lg rounded-full px-10 py-4 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03]"
              >
                Create free account <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-gray-600 text-xs mt-3">No setup fees · Cancel anytime · Free to join</p>
            </motion.div>

            {/* Scroll hint */}
            <div className="flex justify-center mt-12">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-1 text-gray-600"
              >
                <span className="text-xs uppercase tracking-widest">Calculate your earnings</span>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Calculator ────────────────────────────────────────────────── */}
        <section className="py-16 border-t border-white/8">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">How much will you earn?</h2>
              <p className="text-gray-400">Enter your traffic numbers — see your exact monthly CPA income.</p>
            </div>

            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 md:p-8">
              <MiniCalculator onResult={setMonthlyEarnings} />
            </div>

            <div className="text-center mt-8">
              <a
                href="https://dashboard.revillion.com/en/registration"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCTAClick('calculator')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-base rounded-full px-8 py-3.5 shadow-lg shadow-orange-500/20 transition-all duration-300 hover:scale-[1.03]"
              >
                {ctaLabel}
              </a>
            </div>
          </div>
        </section>

        {/* ── Social proof ──────────────────────────────────────────────── */}
        <section className="py-16 border-t border-white/8">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3">What affiliates say</h2>
              <p className="text-gray-400">Real results from people with traffic sources like yours.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/3 border border-white/10 rounded-2xl p-6"
                >
                  <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.quote}"</p>
                  <div className="border-t border-white/8 pt-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{t.name}</div>
                      <div className="text-gray-500 text-xs">{t.country} · {t.source}</div>
                    </div>
                    <div className="text-orange-400 font-black text-lg tabular-nums">{t.monthly}<span className="text-xs text-gray-500 font-normal">/mo</span></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Revillion ─────────────────────────────────────────────── */}
        <section className="py-16 border-t border-white/8">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-3">Why affiliates choose us</h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { icon: '💰', title: 'Up to $220 CPA', desc: 'Industry-leading rates. The average CPA on the market is $80–120. We pay more.' },
                { icon: '⚡', title: '7-day payments', desc: 'Weekly payment cycles. Bank transfer, crypto, e-wallet — you choose.' },
                { icon: '📊', title: 'Real-time tracking', desc: 'Every click, registration, and deposit tracked live. Full transparency, zero discrepancies.' },
                { icon: '🎯', title: '16 top brands', desc: 'Pick the brands that convert best for your audience and GEO.' },
                { icon: '🌍', title: '40+ markets', desc: 'We operate in Tier-1 and emerging markets. High CPA rates available in IT, DE, PT, ES, and more.' },
                { icon: '🤝', title: 'Dedicated manager', desc: 'A real person who knows your traffic and helps you optimize. Not a ticket system.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <div className="text-2xl mb-3">{icon}</div>
                  <div className="font-bold text-white mb-2">{title}</div>
                  <div className="text-gray-400 text-sm leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────── */}
        <section className="py-20 border-t border-white/8">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 text-orange-400 text-sm font-mono uppercase tracking-widest mb-6">
              <CheckCircle2 className="w-4 h-4" />
              Free · No minimum traffic · Instant access
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              Ready to monetize<br />your traffic?
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Join 843 affiliates already earning with Revillion Partners.
              Setup takes less than 5 minutes.
            </p>
            <a
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleCTAClick('footer_cta')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-xl rounded-full px-12 py-5 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-[1.03]"
            >
              {ctaLabel}
            </a>
            <p className="text-gray-600 text-xs mt-4">
              Already have an account?{' '}
              <a href="https://dashboard.revillion.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">
                Log in →
              </a>
            </p>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/8 py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-xs">
            <span>© 2026 Revillion Partners. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to={`/${lang}/privacy-policy`} className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
              <Link to={`/${lang}/terms-of-service`} className="hover:text-gray-400 transition-colors">Terms</Link>
              <Link to={`/${lang}/responsible-gaming`} className="hover:text-gray-400 transition-colors">Responsible Gaming</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
