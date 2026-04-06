import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { fadeUp, fadeRight, stagger, scaleIn, viewport } from '@/lib/motion';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trackCTAClick } from "@/lib/analytics";
import { Globe, DollarSign, Users, TrendingUp, Shield, Link, BarChart3, Zap, ArrowRight, HelpCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { SEOHead } from "@/components/SEOHead";
import { Layout } from "@/components/layout/Layout";

const homepageFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Revillion Partners?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Revillion Partners is a premier iGaming affiliate network offering high CPA commissions for promoting 16+ top casino brands including 22Bet, Rabona, Spinit, and more. We provide dedicated affiliate support, real-time tracking, and multiple payment options."
      }
    },
    {
      "@type": "Question",
      "name": "How much can I earn as a Revillion affiliate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Affiliates earn premium CPA (Cost Per Acquisition) commissions with competitive rates depending on the brand and geographic region. We offer flexible payment terms and transparent tracking to maximize your earnings potential."
      }
    },
    {
      "@type": "Question",
      "name": "What payment methods does Revillion offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We support multiple payment methods including bank transfers, e-wallets, and cryptocurrency payments. Payments are processed regularly with transparent reporting through our affiliate dashboard."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get started with Revillion Partners?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Getting started is simple: visit our dashboard at dashboard.revillion.com, register your affiliate account, get your unique tracking links, and start promoting our premium casino brands immediately. Our dedicated support team is available to help you succeed."
      }
    },
    {
      "@type": "Question",
      "name": "Which casino brands can I promote?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can promote 16+ top-tier casino brands including 22Bet, Rabona, Spinit, Nomini, Casinia, Librabet, BetLabel, SafeCasino, Spinanga, RoboCat, Onlyspins, Bassbet, TikiTaka, Burancasino, Cazeus, and AzurSlot. Each brand offers unique features and targets different markets."
      }
    }
  ]
};

import bassbetLogo from "@/assets/Bassbet-partner.png?partner";
import rabonaLogo from "@/assets/Rabona-partner.png?partner";
import spinitLogo from "@/assets/Spinit-partner.png?partner";
import onlyspinsLogo from "@/assets/Onlyspins-partner.png?partner";
import bet22Logo from "@/assets/22bet-partner-3.png?partner";
import azurslotLogo from "@/assets/azurslot-partner.png?partner";
import safecasinoLogo from "@/assets/safecasino-partner.png?partner";
import robocatLogo from "@/assets/robocat-partner.png?partner";
import betlabelLogo from "@/assets/betlabel-partner.png?partner";
import cazeusLogo from "@/assets/cazeus-partner.png?partner";
import burancasinoLogo from "@/assets/burancasino-partner.png?partner";
import casiniaLogo from "@/assets/casinia-partner.png?partner";
import librabetLogo from "@/assets/librabet-partner.png?partner";
import nominiLogo from "@/assets/nomini-partner.png?partner";
import tikitakaLogo from "@/assets/tikitaka-partner.png?partner";
import spinangaLogo from "@/assets/spinanga-partner.png?partner";

const CountUpStat = ({ prefix = '', target, suffix = '', label, support }: {
  prefix?: string; target: number; suffix?: string; label: string; support: string;
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, target]);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white tabular-nums leading-none">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-orange-400 font-semibold text-sm mt-3">{label}</div>
      <div className="text-gray-500 text-xs mt-1">{support}</div>
    </div>
  );
};

const CountUpStats = () => (
  <motion.div
    className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center"
    variants={stagger(0.1, 0)}
    initial="hidden"
    whileInView="visible"
    viewport={viewport}
  >
    {[
      { prefix: '$', target: 10, suffix: 'M+', label: 'Paid to Affiliates', support: 'And counting' },
      { prefix: '$', target: 220, suffix: '', label: 'Top CPA Rate', support: 'Per depositor' },
      { prefix: '', target: 7, suffix: ' Days', label: 'Average Payment', support: 'Fast & reliable' },
      { prefix: '', target: 800, suffix: '+', label: 'Active Affiliates', support: 'Worldwide' },
    ].map((s) => (
      <motion.div key={s.label} variants={scaleIn}>
        <CountUpStat {...s} />
      </motion.div>
    ))}
  </motion.div>
);

const Index = () => {
  const { t, i18n } = useTranslation();
  const { lang } = useParams();

  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const logos = [
    { src: bassbetLogo, alt: "BassBet - Licensed iGaming Partner Casino" },
    { src: rabonaLogo, alt: "Rabona - Premium Online Casino Partner" },
    { src: spinitLogo, alt: "Spinit - Licensed Casino Affiliate Partner" },
    { src: onlyspinsLogo, alt: "OnlySpins - Trusted iGaming Casino Partner" },
    { src: bet22Logo, alt: "22Bet - Global Casino & Sports Betting Partner" },
    { src: azurslotLogo, alt: "Azurslot - Premium Slot Casino Partner" },
    { src: safecasinoLogo, alt: "SafeCasino - Secure Licensed iGaming Partner" },
    { src: robocatLogo, alt: "Robocat - Innovative Casino Partner" },
    { src: betlabelLogo, alt: "Betlabel - Licensed Betting Casino Partner" },
    { src: cazeusLogo, alt: "Cazeus - Premium iGaming Casino Partner" },
    { src: burancasinoLogo, alt: "Buran Casino - Trusted Online Casino Partner" },
    { src: casiniaLogo, alt: "Casinia - Licensed Casino Affiliate Partner" },
    { src: librabetLogo, alt: "Librabet - Premium Betting & Casino Partner" },
    { src: nominiLogo, alt: "Nomini - Trusted iGaming Casino Partner" },
    { src: tikitakaLogo, alt: "Tikitaka - Licensed Sports & Casino Partner" },
    { src: spinangaLogo, alt: "Spinanga - Premium Online Casino Partner" },
  ];

  return (
    <Layout showScrollLinks={true}>
      <SEOHead />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(homepageFaqSchema)}
        </script>
      </Helmet>

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section id="hero" className="relative bg-[#0a0a0a] text-white overflow-hidden flex items-center">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-orange-500/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left col */}
            <motion.div
              variants={stagger(0.1, 0)}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2.5 border border-orange-500/30 bg-orange-500/5 rounded-full px-4 py-2 mb-6 md:mb-10">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">Trusted by 800+ Affiliates</span>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-[2.6rem] sm:text-5xl md:text-[5.5rem] font-black mb-5 md:mb-6 leading-[0.95] tracking-tight">
                Earn Up to{' '}
                <span className="text-orange-500">$220 CPA</span>
                <br />
                Per Player
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base sm:text-lg text-gray-400 mb-7 md:mb-10 leading-relaxed">
                Premier iGaming affiliate network. <span className="text-white font-semibold">16+ licensed casino brands.</span>{' '}
                Paid <span className="text-orange-400 font-semibold">$10M+</span> to partners. Get your first payment in 7 days.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-10">
                <a
                  href="https://dashboard.revillion.com/en/registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCTAClick('hero_section')}
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20">
                    Start Earning Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <RouterLink to={`/${lang || 'en'}/calculator`} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border border-white/15 text-white hover:bg-white/8 hover:border-white/30 font-semibold py-4 px-8 text-base rounded-full transition-all duration-200 bg-transparent"
                  >
                    Calculate Your Earnings
                  </Button>
                </RouterLink>
              </motion.div>

              {/* Trust bar */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6 mb-10 md:mb-14">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>7-Day Payments</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span>Real-Time Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span>Dedicated Manager</span>
                </div>
              </motion.div>

              {/* Inline stats */}
              <motion.div variants={fadeUp} className="flex items-center gap-5 sm:gap-8 border-t border-white/8 pt-6 md:pt-7">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">$10M+</div>
                  <div className="text-gray-500 text-xs mt-1">{t('stats.paid')}</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-white/10" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">800</div>
                  <div className="text-gray-500 text-xs mt-1">{t('stats.affiliates')}</div>
                </div>
                <div className="w-px h-8 sm:h-10 bg-white/10" />
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white tabular-nums">40+</div>
                  <div className="text-gray-500 text-xs mt-1">{t('stats.markets')}</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right col — dashboard card */}
            <motion.div
              className="relative hidden lg:block"
              variants={fadeRight}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            >
              <div className="absolute -inset-4 bg-orange-500/15 rounded-3xl blur-[60px]" />
              <div className="relative bg-[#141414] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/8">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
                  <div className="ml-3 flex-1 bg-white/5 rounded-md px-3 py-1.5">
                    <span className="text-gray-500 text-xs font-mono">dashboard.revillion.com</span>
                  </div>
                </div>

                {/* Dashboard body */}
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                      <div className="text-2xl font-black text-orange-400 tabular-nums">1,247</div>
                      <div className="text-gray-500 text-xs mt-1">{t('dashboard.liveClicks')}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs">{t('dashboard.realTime')}</span>
                      </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                      <div className="text-2xl font-black text-green-400 tabular-nums">89</div>
                      <div className="text-gray-500 text-xs mt-1">{t('dashboard.registrations')}</div>
                      <div className="text-green-400 text-xs mt-2">+12% {t('dashboard.today')}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="text-2xl font-black text-blue-400 tabular-nums">34</div>
                      <div className="text-gray-500 text-xs mt-1">{t('dashboard.deposits')}</div>
                      <div className="text-blue-400 text-xs mt-2">{t('dashboard.earned')}</div>
                    </div>
                  </div>

                  {/* Mini revenue chart */}
                  <div className="bg-white/4 rounded-xl p-4">
                    <div className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wider">Revenue — Last 7 days</div>
                    <svg viewBox="0 0 280 70" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,55 C35,50 55,35 85,32 C115,28 135,18 165,12 C195,6 215,20 245,8 L280,4"
                        stroke="#f97316"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M0,55 C35,50 55,35 85,32 C115,28 135,18 165,12 C195,6 215,20 245,8 L280,4 L280,70 L0,70 Z"
                        fill="url(#chartGrad)"
                      />
                      {/* Dot markers */}
                      {[[0,55],[40,48],[80,33],[120,22],[160,13],[200,16],[240,9],[280,4]].map(([x,y], i) => (
                        <circle key={i} cx={x} cy={y} r="3" fill="#f97316" />
                      ))}
                    </svg>
                  </div>

                  {/* Live badge */}
                  <div className="flex items-center justify-between mt-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-green-400 text-xs font-semibold">{t('dashboard.realtimeUpdate')}</span>
                    </div>
                    <span className="text-gray-600 text-xs font-mono">rev. 2s ago</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 2. PARTNER MARQUEE ──────────────────────────────────────────── */}
      <section className="py-10 md:py-14 bg-[#F8F7F4] overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl mb-8 md:mb-10">
          <div className="flex items-center gap-5">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="text-gray-900 font-semibold text-sm uppercase tracking-widest shrink-0">Promote World-Class Brands</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>
        </div>

        <div
          className="relative flex overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)' }}
        >
          <div className="flex gap-6 animate-marquee shrink-0 min-w-max">
            {logos.map((logo) => (
              <div key={logo.alt} className="bg-white rounded-xl px-5 py-3 border border-gray-200 flex items-center justify-center h-16 w-32 shrink-0">
                <img src={logo.src} alt={logo.alt} width="100" height="44" className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <div className="flex gap-6 animate-marquee shrink-0 min-w-max" aria-hidden="true">
            {logos.map((logo) => (
              <div key={logo.alt + '-dup'} className="bg-white rounded-xl px-5 py-3 border border-gray-200 flex items-center justify-center h-16 w-32 shrink-0">
                <img src={logo.src} alt="" width="100" height="44" className="h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl mt-8 md:mt-10">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm text-center">
            <Shield className="w-4 h-4 text-green-600 shrink-0" />
            <span>All brands licensed & regulated &middot; Multi-GEO coverage &middot; Exclusive deals available</span>
          </div>
        </div>
      </section>

      {/* ── 3. THE NUMBERS — Stats Bar ──────────────────────────────────── */}
      <section id="why-join" className="py-16 md:py-28 bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-orange-500 font-mono text-xs uppercase tracking-widest">The Numbers</span>
            <h2 className="text-4xl md:text-6xl font-black mt-3 leading-tight tracking-tight">
              Results That{' '}
              <span className="text-orange-500">Speak</span>
            </h2>
          </div>

          <CountUpStats />

          <div className="text-center mt-10 md:mt-14">
            <RouterLink
              to={`/${lang || 'en'}/calculator`}
              className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold text-sm transition-colors"
            >
              See what you could earn
              <ArrowRight className="w-4 h-4" />
            </RouterLink>
          </div>
        </div>
      </section>

      {/* ── 4. TOOLS — Bento Grid ───────────────────────────────────────── */}
      <section id="tools" className="py-16 md:py-32 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

          <div className="mb-10 md:mb-16">
            <span className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('tools.badge')}</span>
            <h2 className="text-4xl md:text-6xl font-black mt-3 leading-tight tracking-tight">
              {t('tools.title')}{' '}
              <span className="text-orange-500">{t('tools.titleHighlight')}</span>{' '}
              {t('tools.titleEnd')}
            </h2>
            <p className="text-gray-400 text-lg md:text-xl mt-4 max-w-2xl leading-relaxed">{t('tools.subtitle')}</p>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger(0.1, 0)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >

            {/* Smart URLs — large card */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-[#1a0a2e] border border-purple-500/20 rounded-2xl p-8 group hover:border-purple-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Link className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{t('tools.smartUrls.title')}</h3>
              <p className="text-gray-400 leading-relaxed mb-6">{t('tools.smartUrls.description')}</p>
              <div className="bg-black/30 rounded-xl p-4 font-mono text-sm">
                <span className="text-gray-500">&rarr; </span>
                <span className="text-purple-400">rev.ly/</span>
                <span className="text-orange-400">casino-win</span>
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div variants={fadeUp} className="bg-[#0a1528] border border-blue-500/20 rounded-2xl p-8 group hover:border-blue-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{t('tools.analytics.title')}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{t('tools.analytics.description')}</p>
            </motion.div>

            {/* Postback */}
            <motion.div variants={fadeUp} className="bg-[#0a1f0a] border border-green-500/20 rounded-2xl p-8 group hover:border-green-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{t('tools.postback.title')}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">{t('tools.postback.description')}</p>
            </motion.div>

            {/* Tracking — large card */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-[#1f0a0a] border border-orange-500/20 rounded-2xl p-8 group hover:border-orange-500/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{t('tools.tracking.title')}</h3>
              <p className="text-gray-400 leading-relaxed mb-6">{t('tools.tracking.description')}</p>
              <div className="flex gap-3 flex-wrap">
                {['Real-time', 'Fraud-proof', 'Multi-brand', 'API ready'].map((tag) => (
                  <span key={tag} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-3 py-1 font-mono">{tag}</span>
                ))}
              </div>
            </motion.div>

          </motion.div>

          {/* Micro-CTA */}
          <div className="text-center mt-8 md:mt-10">
            <p className="text-gray-500 text-sm">All tools included free. No hidden fees.</p>
          </div>
        </div>
      </section>

      {/* ── 5. DASHBOARD PREVIEW ────────────────────────────────────────── */}
      <section className="py-16 md:py-32 bg-[#F8F7F4]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — text */}
            <motion.div
              variants={stagger(0.1, 0)}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <motion.span variants={fadeUp} className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('dashboard.badge')}</motion.span>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black text-gray-900 mt-3 mb-5 md:mb-6 leading-tight tracking-tight">
                {t('dashboard.title')}{' '}
                <span className="text-orange-500">{t('dashboard.titleHighlight')}</span>{' '}
                {t('dashboard.titleEnd')}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 text-lg md:text-xl leading-relaxed mb-8 md:mb-10">
                {t('dashboard.subtitle')}
              </motion.p>
              <motion.div variants={fadeUp}>
                <a
                  href="https://dashboard.revillion.com/en/registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCTAClick('dashboard_section')}
                >
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20">
                    {t('dashboard.accessButton')}
                    <BarChart3 className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                {/* Micro-CTA */}
                <div className="mt-4">
                  <a
                    href="https://dashboard.revillion.com/en/registration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors"
                  >
                    See the dashboard live
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — stat cards */}
            <motion.div
              className="grid grid-cols-2 gap-3 md:gap-4"
              variants={stagger(0.1, 0.2)}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <motion.div variants={scaleIn} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="text-3xl md:text-4xl font-black text-gray-900 tabular-nums mb-1">1,247</div>
                <div className="text-gray-500 text-sm font-medium">{t('dashboard.liveClicks')}</div>
                <div className="flex items-center gap-1.5 mt-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-600 text-xs font-semibold">{t('dashboard.realTime')}</span>
                </div>
              </motion.div>
              <motion.div variants={scaleIn} className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
                <div className="text-3xl md:text-4xl font-black text-gray-900 tabular-nums mb-1">89</div>
                <div className="text-gray-500 text-sm font-medium">{t('dashboard.registrations')}</div>
                <div className="text-green-600 text-xs font-semibold mt-3 md:mt-4">+12% {t('dashboard.today')}</div>
              </motion.div>
              <motion.div variants={fadeUp} className="col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-400 text-sm font-semibold">Revenue trend</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                    <span className="text-gray-500 text-xs">7d</span>
                  </div>
                </div>
                <svg viewBox="0 0 320 80" className="w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,65 C45,55 65,40 100,38 C135,34 155,20 190,14 C225,8 250,22 285,10 L320,5" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M0,65 C45,55 65,40 100,38 C135,34 155,20 190,14 C225,8 250,22 285,10 L320,5 L320,80 L0,80 Z" fill="url(#chartGrad2)" />
                </svg>
                <div className="text-4xl font-black text-white tabular-nums mt-2">34</div>
                <div className="text-gray-500 text-sm">{t('dashboard.deposits')} — {t('dashboard.earned')}</div>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 6. OFFERS ───────────────────────────────────────────────────── */}
      <section id="offers" className="py-16 md:py-32 bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — markets as pills */}
            <motion.div
              variants={stagger(0.1, 0)}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <motion.span variants={fadeUp} className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('offers.badge')}</motion.span>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black mt-3 mb-5 md:mb-6 leading-tight tracking-tight">
                {t('offers.title')}{' '}
                <span className="text-orange-500">{t('offers.titleHighlight')}</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-400 text-lg md:text-xl leading-relaxed mb-8 md:mb-10">{t('offers.subtitle')}</motion.p>
              <motion.div variants={fadeUp}>
                <a
                  href="https://dashboard.revillion.com/en/registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCTAClick('offers_section')}
                >
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20">
                    {t('offers.exploreButton')}
                    <Globe className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            {/* Right — markets as structured grid */}
            <motion.div
              variants={stagger(0.08, 0.1)}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <motion.h3 variants={fadeUp} className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-500" />
                {t('offers.marketsTitle')}
              </motion.h3>

              <div className="space-y-3">
                {[
                  { region: t('offers.marketsData.europe'), brands: '6 brands', flag: '🇪🇺' },
                  { region: t('offers.marketsData.latam'), brands: '4 brands', flag: '🌎' },
                  { region: t('offers.marketsData.asiaPacific'), brands: '3 brands', flag: '🌏' },
                  { region: t('offers.marketsData.northAmerica'), brands: '2 brands', flag: '🇺🇸' },
                  { region: t('offers.marketsData.africa'), brands: '3 brands', flag: '🌍' },
                ].map((market) => (
                  <motion.div
                    key={market.region}
                    variants={fadeUp}
                    className="group flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{market.flag}</span>
                      <div>
                        <div className="text-white font-semibold text-sm">{market.region}</div>
                        <div className="text-gray-500 text-xs">{market.brands}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-orange-400 transition-colors" />
                  </motion.div>
                ))}
              </div>

              {/* Urgency text */}
              <div className="mt-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-orange-400 text-sm font-semibold">Limited slots available for Q2 2026</span>
              </div>

              <div className="mt-8 pt-8 border-t border-white/8 grid grid-cols-3 gap-4 md:gap-6">
                <div>
                  <div className="text-2xl md:text-3xl font-black text-white">16+</div>
                  <div className="text-gray-500 text-sm mt-1">{t('finalCta.stat1')}</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-white">{t('finalCta.stat2Value')}</div>
                  <div className="text-gray-500 text-xs md:text-sm mt-1">{t('finalCta.stat2')}</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-black text-white">24/7</div>
                  <div className="text-gray-500 text-sm mt-1">{t('finalCta.stat3')}</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 7. HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 bg-[#F8F7F4]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <motion.div
            className="text-center mb-12 md:mb-20"
            variants={stagger(0.1, 0)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <motion.span variants={fadeUp} className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('socialMedia.badge')}</motion.span>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-black text-gray-900 mt-3 leading-tight tracking-tight">
              {t('socialMedia.title')}{' '}
              <span className="text-orange-500">{t('socialMedia.titleHighlight')}</span>{' '}
              {t('socialMedia.titleEnd')}
            </motion.h2>
          </motion.div>

          {/* Desktop: 4-col grid with connector; Mobile: vertical list */}
          <motion.div
            className="hidden md:grid md:grid-cols-4 gap-0 relative"
            variants={stagger(0.12, 0)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <div className="absolute top-9 left-[12.5%] right-[12.5%] h-px bg-gray-200 z-0" />
            {[
              { step: '01', icon: Users, title: t('socialMedia.telegram.title'), desc: t('socialMedia.telegram.description'), iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
              { step: '02', icon: Globe, title: t('socialMedia.twitter.title'), desc: t('socialMedia.twitter.description'), iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
              { step: '03', icon: Link, title: t('socialMedia.instagram.title'), desc: t('socialMedia.instagram.description'), iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
              { step: '04', icon: DollarSign, title: t('socialMedia.urlExamplesTitle'), desc: t('socialMedia.urlExample1'), iconBg: 'bg-green-100', iconColor: 'text-green-600' },
            ].map(({ step, icon: Icon, title, desc, iconBg, iconColor }) => (
              <motion.div key={step} variants={fadeUp} className="relative z-10 flex flex-col items-center text-center px-6">
                <div className={`w-[72px] h-[72px] rounded-2xl ${iconBg} flex items-center justify-center mb-6 shadow-sm border border-gray-100`}>
                  <Icon className={`w-7 h-7 ${iconColor}`} />
                </div>
                <div className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-2">{step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile: vertical stepper */}
          <div className="flex flex-col gap-6 md:hidden">
            {[
              { step: '01', icon: Users, title: t('socialMedia.telegram.title'), desc: t('socialMedia.telegram.description'), iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
              { step: '02', icon: Globe, title: t('socialMedia.twitter.title'), desc: t('socialMedia.twitter.description'), iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
              { step: '03', icon: Link, title: t('socialMedia.instagram.title'), desc: t('socialMedia.instagram.description'), iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
              { step: '04', icon: DollarSign, title: t('socialMedia.urlExamplesTitle'), desc: t('socialMedia.urlExample1'), iconBg: 'bg-green-100', iconColor: 'text-green-600' },
            ].map(({ step, icon: Icon, title, desc, iconBg, iconColor }, idx, arr) => (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 border border-gray-100`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  {idx < arr.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-2" />}
                </div>
                <div className="pb-6">
                  <div className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-1">{step}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 md:mt-16">
            <a
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('social_media_section')}
              className="inline-block w-full sm:w-auto"
            >
              <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20">
                {t('socialMedia.getUrlsButton')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── 8. TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 bg-[#F8F7F4]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-orange-500 font-mono text-xs uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mt-3 leading-tight tracking-tight">
              What Our Affiliates <span className="text-orange-500">Say</span>
            </h2>
          </div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            variants={stagger(0.12, 0)}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            {[
              {
                quote: "Switched from another network and my earnings doubled in the first month. The CPA rates are unbeatable.",
                name: "Alex M.",
                role: "Content Creator",
                earning: "$8K+/month",
              },
              {
                quote: "Best tracking system I've used. Real-time postbacks, dedicated manager, payments always on time.",
                name: "Maria S.",
                role: "SEO Specialist",
                earning: "$12K+/month",
              },
              {
                quote: "16+ brands to promote means I can always find the right offer for my traffic. The dashboard makes it easy.",
                name: "David R.",
                role: "Media Buyer",
                earning: "$25K+/month",
              },
            ].map(({ quote, name, role, earning }) => (
              <motion.div key={name} variants={fadeUp} className="bg-white border border-gray-200 rounded-2xl p-7 md:p-8 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                <p className="text-gray-700 italic leading-relaxed mb-6">"{quote}"</p>
                <div>
                  <div className="font-bold text-gray-900">{name}</div>
                  <div className="text-gray-500 text-sm">{role}</div>
                  <div className="text-orange-500 font-black text-lg mt-2">{earning}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8">
            <a
              href="https://dashboard.revillion.com/en/registration"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCTAClick('testimonials_section')}
              className="inline-block"
            >
              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 text-base rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-orange-500/20">
                Join Them
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ────────────────────────────────────────────────── */}
      <section
        className="py-20 md:py-40 bg-[#0a0a0a] relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          className="container mx-auto px-4 sm:px-6 max-w-5xl text-center relative z-10"
          variants={stagger(0.1, 0)}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
        >
          <motion.span variants={fadeUp} className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('finalCta.title')}</motion.span>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg mt-4 mb-2 font-medium">Join 800+ affiliates already earning</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-5 md:mb-6 leading-tight tracking-tight">
            {t('finalCta.subtitle')}
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-base md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('finalCta.footer')}
          </motion.p>
          <a
            href="https://dashboard.revillion.com/en/registration"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCTAClick('final_cta_section')}
            className="inline-block w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-4 md:py-6 px-8 md:px-14 text-lg md:text-xl rounded-full transition-all duration-200 hover:scale-105 shadow-2xl shadow-orange-500/30">
              {t('finalCta.button')}
              <TrendingUp className="ml-3 w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </a>

          {/* Trust icons */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 mt-8 md:mt-10">
            <span className="text-gray-400 text-sm flex items-center gap-1.5">
              <span className="text-green-400">&#10003;</span> Free to join
            </span>
            <span className="text-gray-400 text-sm flex items-center gap-1.5">
              <span className="text-green-400">&#10003;</span> No setup fees
            </span>
            <span className="text-gray-400 text-sm flex items-center gap-1.5">
              <span className="text-green-400">&#10003;</span> First payment in 7 days
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── 10. FAQ — Editorial ─────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-32 bg-[#F8F7F4]">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">

          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-24 items-start">

            {/* Left — sticky heading */}
            <motion.div
              className="lg:sticky lg:top-28"
              variants={stagger(0.1, 0)}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-orange-500" />
                <span className="text-orange-500 font-mono text-xs uppercase tracking-widest">{t('faq.badge')}</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
                {t('faq.title')}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-gray-500 leading-relaxed">{t('faq.subtitle')}</motion.p>
            </motion.div>

            {/* Right — accordion */}
            <Accordion type="single" collapsible className="space-y-0 divide-y divide-gray-200">
              {[
                { value: 'item-1', q: t('faq.q1.question'), a: t('faq.q1.answer') },
                { value: 'item-2', q: t('faq.q2.question'), a: t('faq.q2.answer') },
                { value: 'item-3', q: t('faq.q3.question'), a: t('faq.q3.answer') },
                { value: 'item-4', q: t('faq.q4.question'), a: t('faq.q4.answer') },
                { value: 'item-5', q: t('faq.q5.question'), a: t('faq.q5.answer') },
              ].map(({ value, q, a }) => (
                <AccordionItem key={value} value={value} className="border-none py-2">
                  <AccordionTrigger className="text-left font-bold text-gray-900 hover:text-orange-500 transition-colors text-lg py-6 hover:no-underline">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-500 leading-relaxed text-base pb-6">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

          </div>
        </div>
      </section>

    </Layout>
  );
};

export default Index;
