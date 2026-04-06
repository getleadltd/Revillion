import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3, Zap } from "lucide-react";
import { trackCTAClick } from "@/lib/analytics";

// ─── Types ───────────────────────────────────────────────────────────────────

type CommissionType = 'CPA' | 'RevShare' | 'Hybrid';

interface Preset {
  label: string;
  icon: string;
  traffic: number;
  ctr: number;
  regRate: number;
  depRate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS: Preset[] = [
  { label: 'Telegram Channel', icon: '💬', traffic: 15000, ctr: 5, regRate: 25, depRate: 40 },
  { label: 'SEO Blog',         icon: '✍️', traffic: 50000, ctr: 2, regRate: 15, depRate: 35 },
  { label: 'YouTube',          icon: '▶️', traffic: 100000, ctr: 1, regRate: 20, depRate: 45 },
  { label: 'Social Ads',       icon: '📣', traffic: 30000, ctr: 4, regRate: 30, depRate: 50 },
];

const CPA_RATES = [50, 100, 150, 200, 250];
const REVSHARE_RATES = [25, 30, 35, 40, 45];
const AVG_NGR_OPTIONS = [20, 40, 60, 80, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number): string =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
    ? `$${(n / 1_000).toFixed(1)}K`
    : `$${n.toFixed(0)}`;

const fmtNum = (n: number): string =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1)}K`
    : `${Math.round(n)}`;

// ─── Component ────────────────────────────────────────────────────────────────

const Calculator = () => {
  const { lang = 'en' } = useParams();

  // Traffic inputs
  const [traffic, setTraffic]     = useState(20000);
  const [ctr, setCtr]             = useState(3);        // % visitors who click affiliate link
  const [regRate, setRegRate]     = useState(20);       // % clicks who register
  const [depRate, setDepRate]     = useState(35);       // % registrations who deposit

  // Commission model
  const [commType, setCommType]   = useState<CommissionType>('CPA');
  const [cpaRate, setCpaRate]     = useState(150);
  const [revshare, setRevshare]   = useState(35);
  const [avgNGR, setAvgNGR]       = useState(60);
  const [retention, setRetention] = useState(60);       // % players still active next month

  // Hybrid
  const HYBRID_CPA = 75;
  const HYBRID_RS  = 20;

  // ── Derived values ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const clicks      = Math.round(traffic * (ctr / 100));
    const regs        = Math.round(clicks  * (regRate / 100));
    const depositors  = Math.round(regs    * (depRate / 100));

    let monthly = 0;

    if (commType === 'CPA') {
      monthly = depositors * cpaRate;
    } else if (commType === 'RevShare') {
      monthly = depositors * avgNGR * (revshare / 100);
    } else {
      // Hybrid: CPA + RevShare (lower rates)
      monthly = depositors * HYBRID_CPA + depositors * avgNGR * (HYBRID_RS / 100);
    }

    // Multi-month projection with player accumulation (RevShare / Hybrid)
    const buildProjection = (months: number): number => {
      if (commType === 'CPA') return monthly * months;

      let total = 0;
      let activePlayers = 0;
      for (let m = 1; m <= months; m++) {
        activePlayers = activePlayers * (retention / 100) + depositors;
        if (commType === 'RevShare') {
          total += activePlayers * avgNGR * (revshare / 100);
        } else {
          total += depositors * HYBRID_CPA + activePlayers * avgNGR * (HYBRID_RS / 100);
        }
      }
      return total;
    };

    return {
      clicks,
      regs,
      depositors,
      monthly,
      q1:  buildProjection(3),
      q2:  buildProjection(6),
      annual: buildProjection(12),
    };
  }, [traffic, ctr, regRate, depRate, commType, cpaRate, revshare, avgNGR, retention]);

  // Bar chart: monthly projections for 6 months
  const chartData = useMemo(() => {
    const months = [];
    let activePlayers = 0;
    for (let m = 1; m <= 6; m++) {
      let val = 0;
      if (commType === 'CPA') {
        val = stats.depositors * cpaRate;
      } else {
        activePlayers = activePlayers * (retention / 100) + stats.depositors;
        if (commType === 'RevShare') {
          val = activePlayers * avgNGR * (revshare / 100);
        } else {
          val = stats.depositors * HYBRID_CPA + activePlayers * avgNGR * (HYBRID_RS / 100);
        }
      }
      months.push({ month: `M${m}`, value: val });
    }
    const max = Math.max(...months.map(m => m.value), 1);
    return months.map(m => ({ ...m, pct: (m.value / max) * 100 }));
  }, [stats, commType, cpaRate, revshare, avgNGR, retention]);

  const applyPreset = (p: Preset) => {
    setTraffic(p.traffic);
    setCtr(p.ctr);
    setRegRate(p.regRate);
    setDepRate(p.depRate);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <Helmet>
        <title>Affiliate Commission Calculator | Revillion Partners</title>
        <meta name="description" content="Calculate your potential iGaming affiliate earnings with Revillion Partners. Estimate CPA, RevShare, and Hybrid commissions across 16+ casino brands." />
        <link rel="canonical" href={`https://revillion-partners.com/${lang}/calculator`} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/calculator" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/calculator" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/calculator" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/calculator" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/calculator" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/calculator" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Affiliate Commission Calculator | Revillion Partners" />
        <meta property="og:description" content="Calculate your potential iGaming affiliate earnings with Revillion Partners. Estimate CPA, RevShare, and Hybrid commissions across 16+ casino brands." />
        <meta property="og:url" content={`https://revillion-partners.com/${lang}/calculator`} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content="Affiliate Commission Calculator | Revillion Partners" />
        <meta name="twitter:description" content="Calculate your potential iGaming affiliate earnings with Revillion Partners. Estimate CPA, RevShare, and Hybrid commissions." />
        <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] text-white pt-16 pb-12 md:pt-24 md:pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 rounded-full px-4 py-2 mb-6">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">Commission Calculator</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
            How Much Can You <span className="text-orange-500">Earn?</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Enter your traffic and conversion metrics — see your real-time earnings estimate across CPA, RevShare, and Hybrid commission models.
          </p>
        </div>
      </section>

      {/* ── Presets ──────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-5">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-gray-400 font-mono text-xs uppercase tracking-widest mr-2 shrink-0">Quick presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-700 text-sm font-semibold rounded-full px-4 py-2 transition-all duration-200"
              >
                <span>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main calculator ───────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] py-10 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">

            {/* ── Right: Results (sticky) — shown first on mobile ──────── */}
            <div className="lg:hidden space-y-4">
              {/* Main result card */}
              <div className="bg-[#0a0a0a] text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">Estimated Earnings</span>
                  </div>
                  <div className="mb-1">
                    <div className="text-5xl font-black text-white tabular-nums leading-none">
                      {fmt(stats.monthly)}
                    </div>
                    <div className="text-gray-400 text-sm mt-2">per month, month 1</div>
                  </div>
                  <div className="border-t border-white/10 mt-5 pt-5 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{fmt(stats.q1)}</div>
                      <div className="text-gray-400 text-xs mt-1">3 months</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{fmt(stats.q2)}</div>
                      <div className="text-gray-400 text-xs mt-1">6 months</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-orange-400 tabular-nums">{fmt(stats.annual)}</div>
                      <div className="text-gray-400 text-xs mt-1">12 months</div>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <a
                      href="https://dashboard.revillion.com/en/registration"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackCTAClick('calculator_results_panel_mobile')}
                      className="block"
                    >
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 text-base rounded-xl">
                        Start Earning Now
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Left: Inputs ─────────────────────────────────────────── */}
            <div className="space-y-6">

              {/* Traffic & Funnel */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Your Traffic</h2>
                    <p className="text-gray-400 text-sm">Monthly visitors to your channel or site</p>
                  </div>
                </div>

                <div className="space-y-7">
                  {/* Monthly visitors */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm font-semibold text-gray-700">Monthly Visitors</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={traffic}
                          onChange={e => setTraffic(Math.max(1000, Math.min(1000000, Number(e.target.value))))}
                          className="w-28 text-right text-lg font-black text-gray-900 bg-transparent border-none outline-none focus:text-orange-600 transition-colors"
                        />
                      </div>
                    </div>
                    <Slider
                      value={[traffic]}
                      onValueChange={([v]) => setTraffic(v)}
                      min={1000} max={500000} step={1000}
                      className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500 [&_.relative]:bg-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>1K</span><span>500K</span>
                    </div>
                  </div>

                  {/* CTR */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm font-semibold text-gray-700">Click-Through Rate</label>
                      <span className="text-lg font-black text-gray-900">{ctr.toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[ctr]}
                      onValueChange={([v]) => setCtr(v)}
                      min={0.5} max={15} step={0.5}
                      className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>0.5%</span><span>15%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Conversion Funnel</h2>
                    <p className="text-gray-400 text-sm">How clicks become paying players</p>
                  </div>
                </div>

                {/* Funnel visual */}
                <div className="flex items-center gap-2 mb-7 overflow-x-auto pb-1">
                  {[
                    { label: 'Clicks', value: fmtNum(stats.clicks), color: 'bg-orange-100 text-orange-700 border-orange-200' },
                    { label: 'Registrations', value: fmtNum(stats.regs), color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { label: 'Depositors', value: fmtNum(stats.depositors), color: 'bg-green-100 text-green-700 border-green-200' },
                  ].map((s, i, arr) => (
                    <div key={s.label} className="flex items-center gap-2 shrink-0">
                      <div className={`border rounded-xl px-4 py-2.5 text-center ${s.color}`}>
                        <div className="text-xl font-black">{s.value}</div>
                        <div className="text-xs font-semibold mt-0.5">{s.label}</div>
                      </div>
                      {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />}
                    </div>
                  ))}
                </div>

                <div className="space-y-7">
                  {/* Registration rate */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm font-semibold text-gray-700">Registration Rate</label>
                      <span className="text-lg font-black text-gray-900">{regRate}%</span>
                    </div>
                    <Slider
                      value={[regRate]}
                      onValueChange={([v]) => setRegRate(v)}
                      min={5} max={50} step={1}
                      className="[&_[role=slider]]:bg-blue-500 [&_[role=slider]]:border-blue-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>5%</span><span>50%</span>
                    </div>
                  </div>

                  {/* Deposit rate */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <label className="text-sm font-semibold text-gray-700">Deposit Conversion Rate</label>
                      <span className="text-lg font-black text-gray-900">{depRate}%</span>
                    </div>
                    <Slider
                      value={[depRate]}
                      onValueChange={([v]) => setDepRate(v)}
                      min={10} max={70} step={1}
                      className="[&_[role=slider]]:bg-green-500 [&_[role=slider]]:border-green-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>10%</span><span>70%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Commission Model */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-7">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Commission Model</h2>
                    <p className="text-gray-400 text-sm">Choose how you want to get paid</p>
                  </div>
                </div>

                {/* Model tabs */}
                <div className="flex gap-2 mb-7 p-1 bg-gray-100 rounded-xl">
                  {(['CPA', 'RevShare', 'Hybrid'] as CommissionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCommType(type)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        commType === type
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* CPA options */}
                {commType === 'CPA' && (
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">CPA Rate per Depositor</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {CPA_RATES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setCpaRate(r)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              cpaRate === r
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            ${r}
                          </button>
                        ))}
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
                        <span className="font-semibold">How it works:</span> You earn a fixed amount for every player who makes their first deposit. Simple, predictable, and paid fast.
                      </div>
                    </div>
                  </div>
                )}

                {/* RevShare options */}
                {commType === 'RevShare' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-sm font-semibold text-gray-700">Revenue Share %</label>
                        <span className="text-xl font-black text-gray-900">{revshare}%</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {REVSHARE_RATES.map((r) => (
                          <button
                            key={r}
                            onClick={() => setRevshare(r)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              revshare === r
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Avg. NGR per Player / Month</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {AVG_NGR_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() => setAvgNGR(n)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              avgNGR === n
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            ${n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <label className="text-sm font-semibold text-gray-700">Monthly Player Retention</label>
                        <span className="text-xl font-black text-gray-900">{retention}%</span>
                      </div>
                      <Slider
                        value={[retention]}
                        onValueChange={([v]) => setRetention(v)}
                        min={20} max={90} step={5}
                        className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>20%</span><span>90%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">% of last month's players who remain active this month</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                      <span className="font-semibold">How it works:</span> You earn a % of each player's net gaming revenue every month — for as long as they keep playing. Earnings grow as your player base accumulates.
                    </div>
                  </div>
                )}

                {/* Hybrid info */}
                {commType === 'Hybrid' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-purple-700">${HYBRID_CPA}</div>
                        <div className="text-xs text-purple-600 font-semibold mt-1">CPA per depositor</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-blue-700">{HYBRID_RS}%</div>
                        <div className="text-xs text-blue-600 font-semibold mt-1">RevShare on NGR</div>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Avg. NGR per Player / Month</p>
                      <div className="flex flex-wrap gap-2">
                        {AVG_NGR_OPTIONS.map((n) => (
                          <button
                            key={n}
                            onClick={() => setAvgNGR(n)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              avgNGR === n
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            ${n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-700">
                      <span className="font-semibold">How it works:</span> The best of both — an upfront CPA payment for every depositor, plus ongoing RevShare on their activity. Lower rates on each, but combined they often outperform either alone.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Results (sticky) — desktop only ───────────────── */}
            <div className="hidden lg:block lg:sticky lg:top-24 space-y-4">

              {/* Main result card */}
              <div className="bg-[#0a0a0a] text-white rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">Estimated Earnings</span>
                  </div>

                  <div className="mb-1">
                    <div className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none">
                      {fmt(stats.monthly)}
                    </div>
                    <div className="text-gray-500 text-sm mt-2">per month, month 1</div>
                  </div>

                  <div className="border-t border-white/8 mt-6 pt-6 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xl font-black text-white tabular-nums">{fmt(stats.q1)}</div>
                      <div className="text-gray-500 text-xs mt-1">3 months</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-white tabular-nums">{fmt(stats.q2)}</div>
                      <div className="text-gray-500 text-xs mt-1">6 months</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-orange-400 tabular-nums">{fmt(stats.annual)}</div>
                      <div className="text-gray-500 text-xs mt-1">12 months</div>
                    </div>
                  </div>

                  {commType !== 'CPA' && (
                    <div className="mt-4 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-orange-300 text-xs">Earnings grow as your player base accumulates each month</span>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-white/8">
                    <a
                      href="https://dashboard.revillion.com/en/registration"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackCTAClick('calculator_results_panel')}
                      className="block"
                    >
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-base rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-500/20">
                        Start Earning Now
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </a>
                    <p className="text-center text-xs text-gray-500 mt-2">No setup fees · Free to join · Instant access</p>
                  </div>
                </div>
              </div>

              {/* 6-month bar chart */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-900">6-Month Growth</h3>
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{commType}</span>
                </div>
                <div className="flex items-end gap-2 h-32">
                  {chartData.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[10px] text-gray-400 font-mono tabular-nums truncate w-full text-center">{fmt(d.value)}</div>
                      <div
                        className="w-full rounded-t-md bg-orange-500 transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(d.pct * 0.7, 4)}%` }}
                      />
                      <div className="text-[10px] text-gray-400 font-mono">{d.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel summary */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Your Funnel Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Monthly visitors', value: fmtNum(traffic), color: 'text-gray-700' },
                    { label: 'Clicks on affiliate link', value: fmtNum(stats.clicks), color: 'text-orange-600' },
                    { label: 'Registered players', value: fmtNum(stats.regs), color: 'text-blue-600' },
                    { label: 'Depositing players', value: fmtNum(stats.depositors), color: 'text-green-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-black tabular-nums ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <a
                href="https://dashboard.revillion.com/en/registration"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCTAClick('calculator_page')}
                className="block"
              >
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 text-base rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-500/20">
                  Start Earning Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
              <p className="text-center text-xs text-gray-400">No setup fees · Free to join · Instant access</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl">
            <span className="font-semibold">Disclaimer:</span> These estimates are illustrative projections based on the parameters you enter and industry averages. Actual earnings depend on traffic quality, player behavior, geographic markets, and other factors. Past performance is no guarantee of future results. Revillion Partners makes no income guarantees.
          </p>
          <p className="text-gray-500 text-sm font-semibold mt-4">
            Join 800+ affiliates already earning with Revillion
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Calculator;
