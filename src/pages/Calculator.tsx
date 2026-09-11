import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight, TrendingUp, Users, DollarSign, BarChart3, Zap } from "lucide-react";
import { trackCTAClick } from "@/lib/analytics";
import { getDashboardUrl, getSiteLanguage, type SiteLanguage } from '@/lib/dashboard';

// ─── Types ───────────────────────────────────────────────────────────────────

type CommissionType = 'CPA' | 'RevShare' | 'Hybrid';

interface Preset {
  id: PresetId;
  icon: string;
  traffic: number;
  ctr: number;
  regRate: number;
  depRate: number;
}

type PresetId = 'telegram' | 'seoBlog' | 'youtube' | 'socialAds';

interface CalculatorCopy {
  meta: {
    title: string;
    description: string;
  };
  schema: {
    name: string;
    description: string;
  };
  presets: Record<PresetId, string>;
  badge: string;
  heroBefore: string;
  heroHighlight: string;
  heroDescription: string;
  quickPresets: string;
  estimatedEarnings: string;
  perMonthMonthOne: string;
  threeMonths: string;
  sixMonths: string;
  twelveMonths: string;
  accumulatingEarnings: string;
  startEarning: string;
  ctaNote: string;
  sixMonthGrowth: string;
  funnelSummary: string;
  monthlyVisitors: string;
  affiliateClicks: string;
  registeredPlayers: string;
  depositingPlayers: string;
  trafficTitle: string;
  trafficDescription: string;
  clickThroughRate: string;
  conversionFunnel: string;
  conversionDescription: string;
  clicks: string;
  registrations: string;
  depositors: string;
  registrationRate: string;
  depositConversionRate: string;
  commissionModel: string;
  commissionDescription: string;
  commissionNames: Record<CommissionType, string>;
  cpaRate: string;
  howItWorks: string;
  cpaExplanation: string;
  revenueShare: string;
  averageNgr: string;
  monthlyRetention: string;
  retentionExplanation: string;
  revShareExplanation: string;
  cpaPerDepositor: string;
  revShareOnNgr: string;
  hybridExplanation: string;
  disclaimerLabel: string;
  disclaimer: string;
  affiliatesNote: string;
  aria: {
    monthlyVisitorsSlider: string;
    monthlyVisitorsValue: (value: string) => string;
    percentValue: (value: string) => string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESETS: Preset[] = [
  { id: 'telegram', icon: '💬', traffic: 15000, ctr: 5, regRate: 25, depRate: 40 },
  { id: 'seoBlog',  icon: '✍️', traffic: 50000, ctr: 2, regRate: 15, depRate: 35 },
  { id: 'youtube',  icon: '▶️', traffic: 100000, ctr: 1, regRate: 20, depRate: 45 },
  { id: 'socialAds', icon: '📣', traffic: 30000, ctr: 4, regRate: 30, depRate: 50 },
];

const CPA_RATES = [50, 100, 150, 200, 220];
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

// ─── Localized copy ──────────────────────────────────────────────────────────

const CALCULATOR_COPY: Record<SiteLanguage, CalculatorCopy> = {
  en: {
    meta: {
      title: 'iGaming Affiliate Earnings Calculator | Revillion Partners',
      description: 'Calculate your potential earnings as an iGaming affiliate. Estimate CPA, RevShare and Hybrid commissions based on your traffic source, CTR and conversion rates.',
    },
    schema: {
      name: 'iGaming Affiliate Earnings Calculator',
      description: 'Free calculator to estimate affiliate commissions (CPA, RevShare and Hybrid) for iGaming traffic monetization.',
    },
    presets: { telegram: 'Telegram Channel', seoBlog: 'SEO Blog', youtube: 'YouTube', socialAds: 'Social Ads' },
    badge: 'Commission Calculator',
    heroBefore: 'How Much Can You',
    heroHighlight: 'Earn?',
    heroDescription: 'Enter your traffic and conversion metrics — see your real-time earnings estimate across CPA, RevShare, and Hybrid commission models.',
    quickPresets: 'Quick presets:',
    estimatedEarnings: 'Estimated Earnings',
    perMonthMonthOne: 'per month, month 1',
    threeMonths: '3 months',
    sixMonths: '6 months',
    twelveMonths: '12 months',
    accumulatingEarnings: 'Earnings grow as your player base accumulates each month',
    startEarning: 'Start Earning Now',
    ctaNote: 'No setup fees · Free to join · Instant access',
    sixMonthGrowth: '6-Month Growth',
    funnelSummary: 'Your Funnel Summary',
    monthlyVisitors: 'Monthly visitors',
    affiliateClicks: 'Clicks on affiliate link',
    registeredPlayers: 'Registered players',
    depositingPlayers: 'Depositing players',
    trafficTitle: 'Your Traffic',
    trafficDescription: 'Monthly visitors to your channel or site',
    clickThroughRate: 'Click-Through Rate',
    conversionFunnel: 'Conversion Funnel',
    conversionDescription: 'How clicks become paying players',
    clicks: 'Clicks',
    registrations: 'Registrations',
    depositors: 'Depositors',
    registrationRate: 'Registration Rate',
    depositConversionRate: 'Deposit Conversion Rate',
    commissionModel: 'Commission Model',
    commissionDescription: 'Choose how you want to get paid',
    commissionNames: { CPA: 'CPA', RevShare: 'RevShare', Hybrid: 'Hybrid' },
    cpaRate: 'CPA Rate per Depositor',
    howItWorks: 'How it works:',
    cpaExplanation: 'You earn a fixed amount for every player who makes their first deposit. Simple, predictable, and paid fast.',
    revenueShare: 'Revenue Share %',
    averageNgr: 'Avg. NGR per Player / Month',
    monthlyRetention: 'Monthly Player Retention',
    retentionExplanation: "% of last month's players who remain active this month",
    revShareExplanation: "You earn a % of each player's net gaming revenue every month — for as long as they keep playing. Earnings grow as your player base accumulates.",
    cpaPerDepositor: 'CPA per depositor',
    revShareOnNgr: 'RevShare on NGR',
    hybridExplanation: 'The best of both — an upfront CPA payment for every depositor, plus ongoing RevShare on their activity. Lower rates on each, but combined they often outperform either alone.',
    disclaimerLabel: 'Disclaimer:',
    disclaimer: 'These estimates are illustrative projections based on the parameters you enter and industry averages. Actual earnings depend on traffic quality, player behavior, geographic markets, and other factors. Past performance is no guarantee of future results. Revillion Partners makes no income guarantees.',
    affiliatesNote: 'Join 800+ affiliates already earning with Revillion',
    aria: {
      monthlyVisitorsSlider: 'Monthly visitors slider',
      monthlyVisitorsValue: value => `${value} monthly visitors`,
      percentValue: value => `${value} percent`,
    },
  },
  it: {
    meta: {
      title: 'Calcolatore Guadagni Affiliazione iGaming | Revillion Partners',
      description: 'Calcola i tuoi guadagni potenziali come affiliato iGaming. Stima commissioni CPA, RevShare e Hybrid in base al tuo traffico, CTR e tassi di conversione.',
    },
    schema: {
      name: 'Calcolatore dei guadagni per affiliati iGaming',
      description: 'Calcolatore gratuito per stimare le commissioni di affiliazione CPA, RevShare e Hybrid generate dal traffico iGaming.',
    },
    presets: { telegram: 'Canale Telegram', seoBlog: 'Blog SEO', youtube: 'YouTube', socialAds: 'Annunci social' },
    badge: 'Calcolatore commissioni',
    heroBefore: 'Quanto puoi',
    heroHighlight: 'guadagnare?',
    heroDescription: 'Inserisci i dati di traffico e conversione per vedere in tempo reale una stima dei guadagni con i modelli CPA, RevShare e Hybrid.',
    quickPresets: 'Preset rapidi:',
    estimatedEarnings: 'Guadagni stimati',
    perMonthMonthOne: 'al mese, primo mese',
    threeMonths: '3 mesi',
    sixMonths: '6 mesi',
    twelveMonths: '12 mesi',
    accumulatingEarnings: 'I guadagni crescono man mano che la tua base giocatori aumenta ogni mese',
    startEarning: 'Inizia a guadagnare',
    ctaNote: 'Nessun costo di attivazione · Iscrizione gratuita · Accesso immediato',
    sixMonthGrowth: 'Crescita in 6 mesi',
    funnelSummary: 'Riepilogo del funnel',
    monthlyVisitors: 'Visitatori mensili',
    affiliateClicks: 'Clic sul link di affiliazione',
    registeredPlayers: 'Giocatori registrati',
    depositingPlayers: 'Giocatori depositanti',
    trafficTitle: 'Il tuo traffico',
    trafficDescription: 'Visitatori mensili del tuo canale o sito',
    clickThroughRate: 'Tasso di clic',
    conversionFunnel: 'Funnel di conversione',
    conversionDescription: 'Come i clic diventano giocatori paganti',
    clicks: 'Clic',
    registrations: 'Registrazioni',
    depositors: 'Depositanti',
    registrationRate: 'Tasso di registrazione',
    depositConversionRate: 'Tasso di conversione in deposito',
    commissionModel: 'Modello di commissione',
    commissionDescription: 'Scegli come vuoi essere pagato',
    commissionNames: { CPA: 'CPA', RevShare: 'RevShare', Hybrid: 'Hybrid' },
    cpaRate: 'CPA per depositante',
    howItWorks: 'Come funziona:',
    cpaExplanation: 'Ricevi un importo fisso per ogni giocatore che effettua il primo deposito. Semplice, prevedibile e pagato rapidamente.',
    revenueShare: 'Quota ricavi %',
    averageNgr: 'NGR medio per giocatore / mese',
    monthlyRetention: 'Retention mensile dei giocatori',
    retentionExplanation: '% dei giocatori del mese precedente che resta attivo nel mese corrente',
    revShareExplanation: 'Ricevi ogni mese una percentuale dei ricavi netti di gioco di ciascun giocatore, finché continua a giocare. I guadagni aumentano con la crescita della tua base giocatori.',
    cpaPerDepositor: 'CPA per depositante',
    revShareOnNgr: 'RevShare sul NGR',
    hybridExplanation: 'Il meglio di entrambi: un pagamento CPA iniziale per ogni depositante e una RevShare continuativa sulla sua attività. Le singole percentuali sono inferiori, ma insieme spesso rendono più di un solo modello.',
    disclaimerLabel: 'Avvertenza:',
    disclaimer: 'Queste stime sono proiezioni illustrative basate sui parametri inseriti e sulle medie del settore. I guadagni effettivi dipendono dalla qualità del traffico, dal comportamento dei giocatori, dai mercati geografici e da altri fattori. I risultati passati non garantiscono quelli futuri. Revillion Partners non garantisce alcun reddito.',
    affiliatesNote: 'Unisciti a oltre 800 affiliati che guadagnano già con Revillion',
    aria: {
      monthlyVisitorsSlider: 'Cursore dei visitatori mensili',
      monthlyVisitorsValue: value => `${value} visitatori mensili`,
      percentValue: value => `${value} percento`,
    },
  },
  de: {
    meta: {
      title: 'iGaming Affiliate Einnahmen Rechner | Revillion Partners',
      description: 'Berechne deine potenziellen Einnahmen als iGaming-Affiliate. Schätze CPA-, RevShare- und Hybrid-Provisionen basierend auf Traffic, CTR und Konversionsraten.',
    },
    schema: {
      name: 'iGaming-Affiliate-Einnahmenrechner',
      description: 'Kostenloser Rechner zur Schätzung von CPA-, RevShare- und Hybrid-Affiliate-Provisionen bei der Monetarisierung von iGaming-Traffic.',
    },
    presets: { telegram: 'Telegram-Kanal', seoBlog: 'SEO-Blog', youtube: 'YouTube', socialAds: 'Social Ads' },
    badge: 'Provisionsrechner',
    heroBefore: 'Wie viel kannst du',
    heroHighlight: 'verdienen?',
    heroDescription: 'Gib deine Traffic- und Conversion-Daten ein und erhalte in Echtzeit eine Einnahmenschätzung für CPA-, RevShare- und Hybrid-Provisionsmodelle.',
    quickPresets: 'Schnellauswahl:',
    estimatedEarnings: 'Geschätzte Einnahmen',
    perMonthMonthOne: 'pro Monat, im 1. Monat',
    threeMonths: '3 Monate',
    sixMonths: '6 Monate',
    twelveMonths: '12 Monate',
    accumulatingEarnings: 'Die Einnahmen wachsen, wenn deine Spielerbasis jeden Monat größer wird',
    startEarning: 'Jetzt Geld verdienen',
    ctaNote: 'Keine Einrichtungsgebühr · Kostenlose Teilnahme · Sofortiger Zugang',
    sixMonthGrowth: 'Wachstum über 6 Monate',
    funnelSummary: 'Zusammenfassung deines Funnels',
    monthlyVisitors: 'Monatliche Besucher',
    affiliateClicks: 'Klicks auf den Affiliate-Link',
    registeredPlayers: 'Registrierte Spieler',
    depositingPlayers: 'Einzahlende Spieler',
    trafficTitle: 'Dein Traffic',
    trafficDescription: 'Monatliche Besucher deines Kanals oder deiner Website',
    clickThroughRate: 'Klickrate',
    conversionFunnel: 'Conversion-Funnel',
    conversionDescription: 'So werden Klicks zu zahlenden Spielern',
    clicks: 'Klicks',
    registrations: 'Registrierungen',
    depositors: 'Einzahler',
    registrationRate: 'Registrierungsrate',
    depositConversionRate: 'Einzahlungsrate',
    commissionModel: 'Provisionsmodell',
    commissionDescription: 'Wähle aus, wie du bezahlt werden möchtest',
    commissionNames: { CPA: 'CPA', RevShare: 'RevShare', Hybrid: 'Hybrid' },
    cpaRate: 'CPA-Satz pro Einzahler',
    howItWorks: 'So funktioniert es:',
    cpaExplanation: 'Du erhältst einen festen Betrag für jeden Spieler, der seine erste Einzahlung tätigt. Einfach, planbar und schnell ausgezahlt.',
    revenueShare: 'Umsatzbeteiligung in %',
    averageNgr: 'Durchschn. NGR pro Spieler / Monat',
    monthlyRetention: 'Monatliche Spielerbindung',
    retentionExplanation: '% der Spieler des Vormonats, die im aktuellen Monat aktiv bleiben',
    revShareExplanation: 'Du erhältst jeden Monat einen Anteil am Nettospielertrag jedes Spielers – solange er weiterspielt. Deine Einnahmen wachsen mit deiner Spielerbasis.',
    cpaPerDepositor: 'CPA pro Einzahler',
    revShareOnNgr: 'RevShare auf den NGR',
    hybridExplanation: 'Das Beste aus beiden Modellen: eine einmalige CPA-Zahlung für jeden Einzahler plus laufende RevShare für seine Aktivität. Die einzelnen Sätze sind niedriger, zusammen übertreffen sie aber häufig ein einzelnes Modell.',
    disclaimerLabel: 'Hinweis:',
    disclaimer: 'Diese Schätzungen sind beispielhafte Prognosen auf Grundlage deiner Eingaben und von Branchendurchschnitten. Die tatsächlichen Einnahmen hängen von der Traffic-Qualität, dem Spielerverhalten, den geografischen Märkten und weiteren Faktoren ab. Vergangene Ergebnisse garantieren keine zukünftigen Erträge. Revillion Partners gibt keine Einkommensgarantie.',
    affiliatesNote: 'Schließe dich mehr als 800 Affiliates an, die bereits mit Revillion verdienen',
    aria: {
      monthlyVisitorsSlider: 'Regler für monatliche Besucher',
      monthlyVisitorsValue: value => `${value} monatliche Besucher`,
      percentValue: value => `${value} Prozent`,
    },
  },
  pt: {
    meta: {
      title: 'Calculadora de Ganhos para Afiliados iGaming | Revillion Partners',
      description: 'Calcule os seus ganhos potenciais como afiliado iGaming. Estime comissões CPA, RevShare e Híbridas com base no seu tráfego e taxas de conversão.',
    },
    schema: {
      name: 'Calculadora de ganhos para afiliados iGaming',
      description: 'Calculadora gratuita para estimar comissões CPA, RevShare e Híbridas geradas pela monetização de tráfego iGaming.',
    },
    presets: { telegram: 'Canal de Telegram', seoBlog: 'Blogue SEO', youtube: 'YouTube', socialAds: 'Anúncios nas redes sociais' },
    badge: 'Calculadora de comissões',
    heroBefore: 'Quanto pode',
    heroHighlight: 'ganhar?',
    heroDescription: 'Introduza os seus dados de tráfego e conversão para ver, em tempo real, uma estimativa de ganhos nos modelos CPA, RevShare e Híbrido.',
    quickPresets: 'Predefinições rápidas:',
    estimatedEarnings: 'Ganhos estimados',
    perMonthMonthOne: 'por mês, no 1.º mês',
    threeMonths: '3 meses',
    sixMonths: '6 meses',
    twelveMonths: '12 meses',
    accumulatingEarnings: 'Os ganhos aumentam à medida que a sua base de jogadores cresce todos os meses',
    startEarning: 'Comece a ganhar agora',
    ctaNote: 'Sem custos de configuração · Adesão gratuita · Acesso imediato',
    sixMonthGrowth: 'Crescimento em 6 meses',
    funnelSummary: 'Resumo do seu funil',
    monthlyVisitors: 'Visitantes mensais',
    affiliateClicks: 'Cliques no link de afiliado',
    registeredPlayers: 'Jogadores registados',
    depositingPlayers: 'Jogadores com depósito',
    trafficTitle: 'O seu tráfego',
    trafficDescription: 'Visitantes mensais do seu canal ou site',
    clickThroughRate: 'Taxa de cliques',
    conversionFunnel: 'Funil de conversão',
    conversionDescription: 'Como os cliques se tornam jogadores pagantes',
    clicks: 'Cliques',
    registrations: 'Registos',
    depositors: 'Depositantes',
    registrationRate: 'Taxa de registo',
    depositConversionRate: 'Taxa de conversão em depósito',
    commissionModel: 'Modelo de comissão',
    commissionDescription: 'Escolha como pretende receber',
    commissionNames: { CPA: 'CPA', RevShare: 'RevShare', Hybrid: 'Híbrido' },
    cpaRate: 'Valor CPA por depositante',
    howItWorks: 'Como funciona:',
    cpaExplanation: 'Recebe um valor fixo por cada jogador que faz o primeiro depósito. Simples, previsível e pago rapidamente.',
    revenueShare: 'Partilha de receita %',
    averageNgr: 'NGR médio por jogador / mês',
    monthlyRetention: 'Retenção mensal de jogadores',
    retentionExplanation: '% dos jogadores do mês anterior que continuam ativos no mês atual',
    revShareExplanation: 'Recebe todos os meses uma percentagem da receita líquida de jogo de cada jogador, enquanto este continuar a jogar. Os ganhos aumentam com a sua base de jogadores.',
    cpaPerDepositor: 'CPA por depositante',
    revShareOnNgr: 'RevShare sobre o NGR',
    hybridExplanation: 'O melhor dos dois modelos: um pagamento CPA inicial por cada depositante, mais RevShare contínua sobre a sua atividade. As taxas individuais são mais baixas, mas, em conjunto, muitas vezes superam um modelo isolado.',
    disclaimerLabel: 'Aviso:',
    disclaimer: 'Estas estimativas são projeções ilustrativas baseadas nos parâmetros introduzidos e nas médias do setor. Os ganhos reais dependem da qualidade do tráfego, do comportamento dos jogadores, dos mercados geográficos e de outros fatores. O desempenho passado não garante resultados futuros. A Revillion Partners não garante rendimentos.',
    affiliatesNote: 'Junte-se a mais de 800 afiliados que já ganham com a Revillion',
    aria: {
      monthlyVisitorsSlider: 'Controlo de visitantes mensais',
      monthlyVisitorsValue: value => `${value} visitantes mensais`,
      percentValue: value => `${value} por cento`,
    },
  },
  es: {
    meta: {
      title: 'Calculadora de Ganancias para Afiliados iGaming | Revillion Partners',
      description: 'Calcula tus ganancias potenciales como afiliado iGaming. Estima comisiones CPA, RevShare e Híbridas según tu tráfico, CTR y tasas de conversión.',
    },
    schema: {
      name: 'Calculadora de ganancias para afiliados iGaming',
      description: 'Calculadora gratuita para estimar comisiones CPA, RevShare e Híbridas generadas por la monetización de tráfico iGaming.',
    },
    presets: { telegram: 'Canal de Telegram', seoBlog: 'Blog SEO', youtube: 'YouTube', socialAds: 'Anuncios en redes sociales' },
    badge: 'Calculadora de comisiones',
    heroBefore: '¿Cuánto puedes',
    heroHighlight: 'ganar?',
    heroDescription: 'Introduce tus datos de tráfico y conversión para ver en tiempo real una estimación de ganancias con los modelos CPA, RevShare e Híbrido.',
    quickPresets: 'Preajustes rápidos:',
    estimatedEarnings: 'Ganancias estimadas',
    perMonthMonthOne: 'al mes, en el 1.er mes',
    threeMonths: '3 meses',
    sixMonths: '6 meses',
    twelveMonths: '12 meses',
    accumulatingEarnings: 'Las ganancias aumentan a medida que tu base de jugadores crece cada mes',
    startEarning: 'Empieza a ganar ahora',
    ctaNote: 'Sin costes de configuración · Registro gratuito · Acceso inmediato',
    sixMonthGrowth: 'Crecimiento en 6 meses',
    funnelSummary: 'Resumen de tu embudo',
    monthlyVisitors: 'Visitantes mensuales',
    affiliateClicks: 'Clics en el enlace de afiliado',
    registeredPlayers: 'Jugadores registrados',
    depositingPlayers: 'Jugadores con depósito',
    trafficTitle: 'Tu tráfico',
    trafficDescription: 'Visitantes mensuales de tu canal o sitio',
    clickThroughRate: 'Tasa de clics',
    conversionFunnel: 'Embudo de conversión',
    conversionDescription: 'Cómo los clics se convierten en jugadores de pago',
    clicks: 'Clics',
    registrations: 'Registros',
    depositors: 'Depositantes',
    registrationRate: 'Tasa de registro',
    depositConversionRate: 'Tasa de conversión en depósito',
    commissionModel: 'Modelo de comisión',
    commissionDescription: 'Elige cómo quieres cobrar',
    commissionNames: { CPA: 'CPA', RevShare: 'RevShare', Hybrid: 'Híbrido' },
    cpaRate: 'Tarifa CPA por depositante',
    howItWorks: 'Cómo funciona:',
    cpaExplanation: 'Recibes una cantidad fija por cada jugador que realiza su primer depósito. Sencillo, predecible y con pago rápido.',
    revenueShare: 'Participación en ingresos %',
    averageNgr: 'NGR medio por jugador / mes',
    monthlyRetention: 'Retención mensual de jugadores',
    retentionExplanation: '% de jugadores del mes anterior que siguen activos este mes',
    revShareExplanation: 'Recibes cada mes un porcentaje de los ingresos netos de juego de cada jugador, mientras siga jugando. Las ganancias aumentan junto con tu base de jugadores.',
    cpaPerDepositor: 'CPA por depositante',
    revShareOnNgr: 'RevShare sobre el NGR',
    hybridExplanation: 'Lo mejor de ambos modelos: un pago CPA inicial por cada depositante y RevShare continua sobre su actividad. Las tarifas individuales son menores, pero combinadas suelen superar a un solo modelo.',
    disclaimerLabel: 'Aviso:',
    disclaimer: 'Estas estimaciones son proyecciones ilustrativas basadas en los parámetros introducidos y en promedios del sector. Las ganancias reales dependen de la calidad del tráfico, el comportamiento de los jugadores, los mercados geográficos y otros factores. Los resultados pasados no garantizan resultados futuros. Revillion Partners no garantiza ingresos.',
    affiliatesNote: 'Únete a más de 800 afiliados que ya ganan con Revillion',
    aria: {
      monthlyVisitorsSlider: 'Control de visitantes mensuales',
      monthlyVisitorsValue: value => `${value} visitantes mensuales`,
      percentValue: value => `${value} por ciento`,
    },
  },
};

const calculatorSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Revillion Partners',
    url: 'https://revillion-partners.com',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const Calculator = () => {
  const { lang: routeLanguage } = useParams();
  const lang = getSiteLanguage(routeLanguage);
  const copy = CALCULATOR_COPY[lang];
  const m = copy.meta;
  const canonicalUrl = `https://revillion-partners.com/${lang}/calculator`;
  const localizedCalculatorSchema = {
    ...calculatorSchema,
    name: copy.schema.name,
    description: copy.schema.description,
    url: canonicalUrl,
    inLanguage: lang,
  };

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
        <title>{m.title}</title>
        <meta name="description" content={m.description} />
        <link rel="canonical" href={canonicalUrl} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/calculator" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/calculator" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/calculator" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/calculator" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/calculator" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/calculator" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={m.title} />
        <meta property="og:description" content={m.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Revillion Partners" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={m.title} />
        <meta name="twitter:description" content={m.description} />
        <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />

        {/* SoftwareApplication schema */}
        <script type="application/ld+json">{JSON.stringify(localizedCalculatorSchema)}</script>
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-[#0a0a0a] text-white pt-16 pb-12 md:pt-24 md:pb-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-orange-500/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 rounded-full px-4 py-2 mb-6">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">{copy.badge}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 leading-tight tracking-tight">
            {copy.heroBefore} <span className="text-orange-500">{copy.heroHighlight}</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {copy.heroDescription}
          </p>
        </div>
      </section>

      {/* ── Presets ──────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-5">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-400 font-mono text-xs uppercase tracking-widest mr-1 shrink-0">{copy.quickPresets}</span>
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-orange-400 hover:bg-orange-50 text-gray-700 text-sm font-semibold rounded-full px-4 py-2 transition-all duration-200"
              >
                <span aria-hidden="true">{p.icon}</span>
                {copy.presets[p.id]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main calculator ───────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] py-10 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 items-start">

            {/* ── Right: Results — shown first on mobile ───────────────── */}
            <div className="lg:hidden space-y-4">
              {/* Main result card */}
              <div className="bg-[#0a0a0a] text-white rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-orange-400" />
                    <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">{copy.estimatedEarnings}</span>
                  </div>
                  <div className="mb-1">
                    <div className="text-5xl font-black text-white tabular-nums leading-none">
                      {fmt(stats.monthly)}
                    </div>
                    <div className="text-gray-400 text-sm mt-2">{copy.perMonthMonthOne}</div>
                  </div>
                  <div className="border-t border-white/10 mt-5 pt-5 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{fmt(stats.q1)}</div>
                      <div className="text-gray-400 text-xs mt-1">{copy.threeMonths}</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{fmt(stats.q2)}</div>
                      <div className="text-gray-400 text-xs mt-1">{copy.sixMonths}</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-orange-400 tabular-nums">{fmt(stats.annual)}</div>
                      <div className="text-gray-400 text-xs mt-1">{copy.twelveMonths}</div>
                    </div>
                  </div>
                  {commType !== 'CPA' && (
                    <div className="mt-4 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-orange-300 text-xs">{copy.accumulatingEarnings}</span>
                    </div>
                  )}
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <Button
                      asChild
                      className="w-full bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold py-3 text-base rounded-xl"
                    >
                      <a
                        href={getDashboardUrl(lang, 'registration')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackCTAClick('calculator_results_panel_mobile')}
                      >
                        {copy.startEarning}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-2">{copy.ctaNote}</p>
                  </div>
                </div>
              </div>

              {/* 6-month bar chart — mobile */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">{copy.sixMonthGrowth}</h3>
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{copy.commissionNames[commType]}</span>
                </div>
                <div className="flex items-end gap-2 h-28">
                  {chartData.map((d) => (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-[9px] text-gray-400 font-mono tabular-nums truncate w-full text-center">{fmt(d.value)}</div>
                      <div
                        className="w-full rounded-t-md bg-orange-500 transition-all duration-500 min-h-[4px]"
                        style={{ height: `${Math.max(d.pct * 0.7, 4)}%` }}
                      />
                      <div className="text-[9px] text-gray-400 font-mono">{d.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funnel summary — mobile */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{copy.funnelSummary}</h3>
                <div className="space-y-2.5">
                  {[
                    { label: copy.monthlyVisitors, value: fmtNum(traffic), color: 'text-gray-700' },
                    { label: copy.affiliateClicks, value: fmtNum(stats.clicks), color: 'text-orange-600' },
                    { label: copy.registeredPlayers, value: fmtNum(stats.regs), color: 'text-blue-600' },
                    { label: copy.depositingPlayers, value: fmtNum(stats.depositors), color: 'text-green-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-black tabular-nums ${color}`}>{value}</span>
                    </div>
                  ))}
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
                    <h2 className="text-lg font-bold text-gray-900">{copy.trafficTitle}</h2>
                    <p className="text-gray-400 text-sm">{copy.trafficDescription}</p>
                  </div>
                </div>

                <div className="space-y-7">
                  {/* Monthly visitors */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3 gap-2">
                      <label htmlFor="monthly-visitors" className="text-sm font-semibold text-gray-700 min-w-0 truncate">{copy.monthlyVisitors}</label>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          id="monthly-visitors"
                          type="number"
                          min={1000}
                          max={500000}
                          step={1000}
                          inputMode="numeric"
                          value={traffic}
                          onChange={e => setTraffic(Math.max(1000, Math.min(500000, Number(e.target.value))))}
                          className="w-20 sm:w-28 text-right text-lg font-black text-gray-900 bg-transparent border-none outline-none focus:text-orange-600 transition-colors"
                        />
                      </div>
                    </div>
                    <Slider
                      thumbProps={{
                        'aria-label': copy.aria.monthlyVisitorsSlider,
                        'aria-valuetext': copy.aria.monthlyVisitorsValue(traffic.toLocaleString(lang)),
                      }}
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
                      <span id="ctr-label" className="text-sm font-semibold text-gray-700">{copy.clickThroughRate}</span>
                      <span id="ctr-value" className="text-lg font-black text-gray-900">{ctr.toFixed(1)}%</span>
                    </div>
                    <Slider
                      thumbProps={{
                        'aria-labelledby': 'ctr-label',
                        'aria-describedby': 'ctr-value',
                        'aria-valuetext': copy.aria.percentValue(ctr.toFixed(1)),
                      }}
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
                    <h2 className="text-lg font-bold text-gray-900">{copy.conversionFunnel}</h2>
                    <p className="text-gray-400 text-sm">{copy.conversionDescription}</p>
                  </div>
                </div>

                {/* Funnel visual */}
                <div className="grid grid-cols-3 gap-2 mb-7">
                  {[
                    { label: copy.clicks, value: fmtNum(stats.clicks), color: 'bg-orange-100 text-orange-700 border-orange-200' },
                    { label: copy.registrations, value: fmtNum(stats.regs), color: 'bg-blue-100 text-blue-700 border-blue-200' },
                    { label: copy.depositors, value: fmtNum(stats.depositors), color: 'bg-green-100 text-green-700 border-green-200' },
                  ].map((s) => (
                    <div key={s.label} className={`border rounded-xl px-2 py-2.5 text-center ${s.color}`}>
                      <div className="text-lg sm:text-xl font-black">{s.value}</div>
                      <div className="text-xs font-semibold mt-0.5 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-7">
                  {/* Registration rate */}
                  <div>
                    <div className="flex justify-between items-baseline mb-3">
                      <span id="registration-rate-label" className="text-sm font-semibold text-gray-700">{copy.registrationRate}</span>
                      <span id="registration-rate-value" className="text-lg font-black text-gray-900">{regRate}%</span>
                    </div>
                    <Slider
                      thumbProps={{
                        'aria-labelledby': 'registration-rate-label',
                        'aria-describedby': 'registration-rate-value',
                        'aria-valuetext': copy.aria.percentValue(String(regRate)),
                      }}
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
                      <span id="deposit-rate-label" className="text-sm font-semibold text-gray-700">{copy.depositConversionRate}</span>
                      <span id="deposit-rate-value" className="text-lg font-black text-gray-900">{depRate}%</span>
                    </div>
                    <Slider
                      thumbProps={{
                        'aria-labelledby': 'deposit-rate-label',
                        'aria-describedby': 'deposit-rate-value',
                        'aria-valuetext': copy.aria.percentValue(String(depRate)),
                      }}
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
                    <h2 className="text-lg font-bold text-gray-900">{copy.commissionModel}</h2>
                    <p className="text-gray-400 text-sm">{copy.commissionDescription}</p>
                  </div>
                </div>

                {/* Model tabs */}
                <div className="flex gap-1 mb-7 p-1 bg-gray-100 rounded-xl" role="group" aria-label={copy.commissionModel}>
                  {(['CPA', 'RevShare', 'Hybrid'] as CommissionType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setCommType(type)}
                      aria-pressed={commType === type}
                      className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 ${
                        commType === type
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {copy.commissionNames[type]}
                    </button>
                  ))}
                </div>

                {/* CPA options */}
                {commType === 'CPA' && (
                  <div className="space-y-5">
                    <div>
                      <p id="cpa-rate-label" className="text-sm font-semibold text-gray-700 mb-3">{copy.cpaRate}</p>
                      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-labelledby="cpa-rate-label">
                        {CPA_RATES.map((r) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => setCpaRate(r)}
                            aria-pressed={cpaRate === r}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              cpaRate === r
                                ? 'bg-orange-500 border-orange-500 text-gray-950'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            ${r}
                          </button>
                        ))}
                      </div>
                      <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-sm text-orange-700">
                        <span className="font-semibold">{copy.howItWorks}</span>{' '}{copy.cpaExplanation}
                      </div>
                    </div>
                  </div>
                )}

                {/* RevShare options */}
                {commType === 'RevShare' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-3">
                        <span id="revshare-rate-label" className="text-sm font-semibold text-gray-700">{copy.revenueShare}</span>
                        <span className="text-xl font-black text-gray-900">{revshare}%</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-labelledby="revshare-rate-label">
                        {REVSHARE_RATES.map((r) => (
                          <button
                            type="button"
                            key={r}
                            onClick={() => setRevshare(r)}
                            aria-pressed={revshare === r}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              revshare === r
                                ? 'bg-orange-500 border-orange-500 text-gray-950'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p id="revshare-ngr-label" className="text-sm font-semibold text-gray-700 mb-3">{copy.averageNgr}</p>
                      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-labelledby="revshare-ngr-label">
                        {AVG_NGR_OPTIONS.map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => setAvgNGR(n)}
                            aria-pressed={avgNGR === n}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              avgNGR === n
                                ? 'bg-orange-500 border-orange-500 text-gray-950'
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
                        <span id="retention-label" className="text-sm font-semibold text-gray-700">{copy.monthlyRetention}</span>
                        <span id="retention-value" className="text-xl font-black text-gray-900">{retention}%</span>
                      </div>
                      <Slider
                        thumbProps={{
                          'aria-labelledby': 'retention-label',
                          'aria-describedby': 'retention-value',
                          'aria-valuetext': copy.aria.percentValue(String(retention)),
                        }}
                        value={[retention]}
                        onValueChange={([v]) => setRetention(v)}
                        min={20} max={90} step={5}
                        className="[&_[role=slider]]:bg-orange-500 [&_[role=slider]]:border-orange-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                        <span>20%</span><span>90%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{copy.retentionExplanation}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                      <span className="font-semibold">{copy.howItWorks}</span>{' '}{copy.revShareExplanation}
                    </div>
                  </div>
                )}

                {/* Hybrid info */}
                {commType === 'Hybrid' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-purple-700">${HYBRID_CPA}</div>
                        <div className="text-xs text-purple-600 font-semibold mt-1">{copy.cpaPerDepositor}</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                        <div className="text-2xl font-black text-blue-700">{HYBRID_RS}%</div>
                        <div className="text-xs text-blue-600 font-semibold mt-1">{copy.revShareOnNgr}</div>
                      </div>
                    </div>

                    <div>
                      <p id="hybrid-ngr-label" className="text-sm font-semibold text-gray-700 mb-3">{copy.averageNgr}</p>
                      <div className="flex flex-wrap gap-2" role="group" aria-labelledby="hybrid-ngr-label">
                        {AVG_NGR_OPTIONS.map((n) => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => setAvgNGR(n)}
                            aria-pressed={avgNGR === n}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-200 ${
                              avgNGR === n
                                ? 'bg-orange-500 border-orange-500 text-gray-950'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                            }`}
                          >
                            ${n}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-700">
                      <span className="font-semibold">{copy.howItWorks}</span>{' '}{copy.hybridExplanation}
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
                    <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">{copy.estimatedEarnings}</span>
                  </div>

                  <div className="mb-1">
                    <div className="text-5xl sm:text-6xl font-black text-white tabular-nums leading-none">
                      {fmt(stats.monthly)}
                    </div>
                    <div className="text-gray-500 text-sm mt-2">{copy.perMonthMonthOne}</div>
                  </div>

                  <div className="border-t border-white/8 mt-6 pt-6 grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xl font-black text-white tabular-nums">{fmt(stats.q1)}</div>
                      <div className="text-gray-500 text-xs mt-1">{copy.threeMonths}</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-white tabular-nums">{fmt(stats.q2)}</div>
                      <div className="text-gray-500 text-xs mt-1">{copy.sixMonths}</div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-orange-400 tabular-nums">{fmt(stats.annual)}</div>
                      <div className="text-gray-500 text-xs mt-1">{copy.twelveMonths}</div>
                    </div>
                  </div>

                  {commType !== 'CPA' && (
                    <div className="mt-4 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-2">
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="text-orange-300 text-xs">{copy.accumulatingEarnings}</span>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-white/8">
                    <Button
                      asChild
                      className="w-full bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold py-4 text-base rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-500/20"
                    >
                      <a
                        href={getDashboardUrl(lang, 'registration')}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackCTAClick('calculator_results_panel')}
                      >
                        {copy.startEarning}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                    <p className="text-center text-xs text-gray-500 mt-2">{copy.ctaNote}</p>
                  </div>
                </div>
              </div>

              {/* 6-month bar chart */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-gray-900">{copy.sixMonthGrowth}</h3>
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-wider">{copy.commissionNames[commType]}</span>
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
                <h3 className="text-sm font-bold text-gray-900 mb-4">{copy.funnelSummary}</h3>
                <div className="space-y-3">
                  {[
                    { label: copy.monthlyVisitors, value: fmtNum(traffic), color: 'text-gray-700' },
                    { label: copy.affiliateClicks, value: fmtNum(stats.clicks), color: 'text-orange-600' },
                    { label: copy.registeredPlayers, value: fmtNum(stats.regs), color: 'text-blue-600' },
                    { label: copy.depositingPlayers, value: fmtNum(stats.depositors), color: 'text-green-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{label}</span>
                      <span className={`font-black tabular-nums ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button
                asChild
                className="w-full bg-orange-500 hover:bg-orange-600 text-gray-950 font-bold py-4 text-base rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-orange-500/20"
              >
                <a
                  href={getDashboardUrl(lang, 'registration')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCTAClick('calculator_page')}
                >
                  {copy.startEarning}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <p className="text-center text-xs text-gray-400">{copy.ctaNote}</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
          <p className="text-gray-400 text-xs leading-relaxed max-w-3xl">
            <span className="font-semibold">{copy.disclaimerLabel}</span>{' '}{copy.disclaimer}
          </p>
          <p className="text-gray-500 text-sm font-semibold mt-4">
            {copy.affiliatesNote}
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Calculator;
