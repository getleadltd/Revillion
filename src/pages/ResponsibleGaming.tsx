import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Shield, Clock, Users, Phone } from 'lucide-react';

const ResponsibleGaming = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();

  const content: Record<string, { title: string; intro: string; sections: { icon?: string; title: string; content: string[] }[]; resources: { title: string; items: { name: string; url: string }[] } }> = {
    en: {
      title: "Responsible Gaming",
      intro: "At Revillion Partners, we are committed to promoting responsible gambling practices. We believe that gambling should be an enjoyable form of entertainment, not a way to make money or escape problems.",
      sections: [
        {
          icon: "shield",
          title: "Our Commitment",
          content: [
            "We only partner with licensed and regulated gaming operators.",
            "We ensure all our partners have responsible gambling policies in place.",
            "We promote gambling as entertainment, not as a way to make money."
          ]
        },
        {
          icon: "alert",
          title: "Signs of Problem Gambling",
          content: [
            "Spending more money or time gambling than you can afford",
            "Finding it hard to manage or stop gambling",
            "Having arguments with family or friends about money and gambling",
            "Losing interest in usual activities or hobbies",
            "Always thinking or talking about gambling",
            "Lying about gambling or hiding it from others"
          ]
        },
        {
          icon: "clock",
          title: "Tips for Responsible Gambling",
          content: [
            "Set a budget before you start and stick to it",
            "Set a time limit for your gambling sessions",
            "Never chase your losses",
            "Don't gamble when you're upset, stressed, or depressed",
            "Take regular breaks during gambling sessions",
            "Don't gamble under the influence of alcohol or drugs"
          ]
        },
        {
          icon: "users",
          title: "Age Verification",
          content: [
            "Gambling is only for adults aged 18 or over (or the legal age in your jurisdiction).",
            "All our partner operators have strict age verification processes in place.",
            "We do not target or accept underage players."
          ]
        }
      ],
      resources: {
        title: "Help & Support Resources",
        items: [
          { name: "GamCare", url: "https://www.gamcare.org.uk" },
          { name: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" },
          { name: "BeGambleAware", url: "https://www.begambleaware.org" },
          { name: "National Council on Problem Gambling", url: "https://www.ncpgambling.org" }
        ]
      }
    },
    de: {
      title: "Verantwortungsvolles Spielen",
      intro: "Bei Revillion Partners setzen wir uns für verantwortungsvolles Glücksspiel ein. Wir glauben, dass Glücksspiel eine unterhaltsame Freizeitbeschäftigung sein sollte, nicht eine Möglichkeit, Geld zu verdienen oder Problemen zu entkommen.",
      sections: [
        {
          icon: "shield",
          title: "Unser Engagement",
          content: [
            "Wir arbeiten nur mit lizenzierten und regulierten Glücksspielanbietern zusammen.",
            "Wir stellen sicher, dass alle unsere Partner Richtlinien für verantwortungsvolles Spielen haben.",
            "Wir bewerben Glücksspiel als Unterhaltung, nicht als Möglichkeit, Geld zu verdienen."
          ]
        },
        {
          icon: "alert",
          title: "Anzeichen von Spielsucht",
          content: [
            "Mehr Geld oder Zeit für Glücksspiele ausgeben, als Sie sich leisten können",
            "Schwierigkeiten, das Spielen zu kontrollieren oder aufzuhören",
            "Streit mit Familie oder Freunden über Geld und Glücksspiel",
            "Verlust des Interesses an üblichen Aktivitäten oder Hobbys",
            "Ständig an Glücksspiel denken oder darüber sprechen",
            "Lügen über das Glücksspiel oder es vor anderen verbergen"
          ]
        },
        {
          icon: "clock",
          title: "Tipps für verantwortungsvolles Spielen",
          content: [
            "Legen Sie vor dem Spielen ein Budget fest und halten Sie sich daran",
            "Setzen Sie ein Zeitlimit für Ihre Spielsitzungen",
            "Jagen Sie niemals Ihren Verlusten nach",
            "Spielen Sie nicht, wenn Sie aufgeregt, gestresst oder deprimiert sind",
            "Machen Sie regelmäßige Pausen während der Spielsitzungen",
            "Spielen Sie nicht unter Einfluss von Alkohol oder Drogen"
          ]
        },
        {
          icon: "users",
          title: "Altersverifizierung",
          content: [
            "Glücksspiel ist nur für Erwachsene ab 18 Jahren (oder dem gesetzlichen Alter in Ihrer Gerichtsbarkeit).",
            "Alle unsere Partnerbetreiber haben strenge Altersverifizierungsverfahren.",
            "Wir richten uns nicht an minderjährige Spieler und akzeptieren diese nicht."
          ]
        }
      ],
      resources: {
        title: "Hilfe & Unterstützung",
        items: [
          { name: "Spielsucht Therapie", url: "https://www.spielsucht-therapie.de" },
          { name: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" },
          { name: "BZgA", url: "https://www.bzga.de" }
        ]
      }
    },
    it: {
      title: "Gioco Responsabile",
      intro: "In Revillion Partners, ci impegniamo a promuovere pratiche di gioco responsabile. Crediamo che il gioco d'azzardo debba essere una forma di intrattenimento piacevole, non un modo per guadagnare soldi o fuggire dai problemi.",
      sections: [
        {
          icon: "shield",
          title: "Il Nostro Impegno",
          content: [
            "Collaboriamo solo con operatori di gioco autorizzati e regolamentati.",
            "Garantiamo che tutti i nostri partner abbiano politiche di gioco responsabile.",
            "Promuoviamo il gioco d'azzardo come intrattenimento, non come un modo per guadagnare."
          ]
        },
        {
          icon: "alert",
          title: "Segnali di Gioco Problematico",
          content: [
            "Spendere più soldi o tempo nel gioco di quanto ci si possa permettere",
            "Trovare difficile gestire o smettere di giocare",
            "Avere discussioni con familiari o amici su soldi e gioco d'azzardo",
            "Perdere interesse nelle attività o hobby abituali",
            "Pensare o parlare sempre di gioco d'azzardo",
            "Mentire sul gioco d'azzardo o nasconderlo agli altri"
          ]
        },
        {
          icon: "clock",
          title: "Consigli per il Gioco Responsabile",
          content: [
            "Stabilisci un budget prima di iniziare e rispettalo",
            "Imposta un limite di tempo per le tue sessioni di gioco",
            "Non inseguire mai le perdite",
            "Non giocare quando sei turbato, stressato o depresso",
            "Fai pause regolari durante le sessioni di gioco",
            "Non giocare sotto l'influenza di alcol o droghe"
          ]
        },
        {
          icon: "users",
          title: "Verifica dell'Età",
          content: [
            "Il gioco d'azzardo è solo per adulti di 18 anni o più (o l'età legale nella tua giurisdizione).",
            "Tutti i nostri operatori partner hanno rigorosi processi di verifica dell'età.",
            "Non ci rivolgiamo né accettiamo giocatori minorenni."
          ]
        }
      ],
      resources: {
        title: "Risorse di Aiuto e Supporto",
        items: [
          { name: "ALEA", url: "https://www.aaborsa.org" },
          { name: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" },
          { name: "Gioca Responsabile", url: "https://www.giocaresponsabile.it" }
        ]
      }
    },
    pt: {
      title: "Jogo Responsável",
      intro: "Na Revillion Partners, estamos comprometidos em promover práticas de jogo responsável. Acreditamos que o jogo deve ser uma forma agradável de entretenimento, não uma maneira de ganhar dinheiro ou escapar de problemas.",
      sections: [
        {
          icon: "shield",
          title: "Nosso Compromisso",
          content: [
            "Trabalhamos apenas com operadores de jogos licenciados e regulamentados.",
            "Garantimos que todos os nossos parceiros tenham políticas de jogo responsável.",
            "Promovemos o jogo como entretenimento, não como uma forma de ganhar dinheiro."
          ]
        },
        {
          icon: "alert",
          title: "Sinais de Jogo Problemático",
          content: [
            "Gastar mais dinheiro ou tempo apostando do que você pode pagar",
            "Ter dificuldade para gerenciar ou parar de jogar",
            "Ter discussões com família ou amigos sobre dinheiro e jogo",
            "Perder interesse em atividades ou hobbies habituais",
            "Sempre pensar ou falar sobre jogo",
            "Mentir sobre o jogo ou escondê-lo dos outros"
          ]
        },
        {
          icon: "clock",
          title: "Dicas para Jogo Responsável",
          content: [
            "Defina um orçamento antes de começar e cumpra-o",
            "Defina um limite de tempo para suas sessões de jogo",
            "Nunca tente recuperar suas perdas",
            "Não jogue quando estiver chateado, estressado ou deprimido",
            "Faça pausas regulares durante as sessões de jogo",
            "Não jogue sob a influência de álcool ou drogas"
          ]
        },
        {
          icon: "users",
          title: "Verificação de Idade",
          content: [
            "O jogo é apenas para adultos com 18 anos ou mais (ou a idade legal em sua jurisdição).",
            "Todos os nossos operadores parceiros têm processos rigorosos de verificação de idade.",
            "Não visamos nem aceitamos jogadores menores de idade."
          ]
        }
      ],
      resources: {
        title: "Recursos de Ajuda e Suporte",
        items: [
          { name: "Jogadores Anônimos", url: "https://www.jogadoresanonimos.org.br" },
          { name: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" }
        ]
      }
    },
    es: {
      title: "Juego Responsable",
      intro: "En Revillion Partners, estamos comprometidos con la promoción de prácticas de juego responsable. Creemos que el juego debe ser una forma agradable de entretenimiento, no una manera de ganar dinero o escapar de los problemas.",
      sections: [
        {
          icon: "shield",
          title: "Nuestro Compromiso",
          content: [
            "Solo nos asociamos con operadores de juego autorizados y regulados.",
            "Nos aseguramos de que todos nuestros socios tengan políticas de juego responsable.",
            "Promovemos el juego como entretenimiento, no como una forma de ganar dinero."
          ]
        },
        {
          icon: "alert",
          title: "Señales de Juego Problemático",
          content: [
            "Gastar más dinero o tiempo en el juego de lo que puedes permitirte",
            "Encontrar difícil gestionar o dejar de jugar",
            "Tener discusiones con familiares o amigos sobre dinero y juego",
            "Perder interés en actividades o pasatiempos habituales",
            "Siempre pensar o hablar sobre el juego",
            "Mentir sobre el juego u ocultarlo a los demás"
          ]
        },
        {
          icon: "clock",
          title: "Consejos para el Juego Responsable",
          content: [
            "Establece un presupuesto antes de empezar y cúmplelo",
            "Establece un límite de tiempo para tus sesiones de juego",
            "Nunca persigas tus pérdidas",
            "No juegues cuando estés alterado, estresado o deprimido",
            "Toma descansos regulares durante las sesiones de juego",
            "No juegues bajo la influencia del alcohol o las drogas"
          ]
        },
        {
          icon: "users",
          title: "Verificación de Edad",
          content: [
            "El juego es solo para adultos de 18 años o más (o la edad legal en tu jurisdicción).",
            "Todos nuestros operadores asociados tienen estrictos procesos de verificación de edad.",
            "No nos dirigimos ni aceptamos jugadores menores de edad."
          ]
        }
      ],
      resources: {
        title: "Recursos de Ayuda y Apoyo",
        items: [
          { name: "Jugadores Anónimos", url: "https://www.jugadoresanonimos.org" },
          { name: "Gamblers Anonymous", url: "https://www.gamblersanonymous.org" },
          { name: "FEJAR", url: "https://www.fejar.org" }
        ]
      }
    }
  };

  const currentContent = content[lang as keyof typeof content] || content.en;

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'shield': return <Shield className="w-6 h-6 text-primary" />;
      case 'alert': return <AlertTriangle className="w-6 h-6 text-primary" />;
      case 'clock': return <Clock className="w-6 h-6 text-primary" />;
      case 'users': return <Users className="w-6 h-6 text-primary" />;
      default: return null;
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": currentContent.title,
    "description": currentContent.intro,
    "url": `https://revillion-partners.com/${lang}/responsible-gaming`,
    "inLanguage": lang,
    "publisher": {
      "@type": "Organization",
      "name": "Revillion Partners",
      "url": "https://revillion-partners.com"
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>{currentContent.title} | Revillion Partners</title>
        <meta name="description" content={currentContent.intro} />
        <link rel="canonical" href={`https://revillion-partners.com/${lang}/responsible-gaming`} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/responsible-gaming" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/responsible-gaming" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/responsible-gaming" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/responsible-gaming" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/responsible-gaming" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/responsible-gaming" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta property="og:description" content={currentContent.intro} />
        <meta property="og:url" content={`https://revillion-partners.com/${lang}/responsible-gaming`} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta name="twitter:description" content={currentContent.intro} />
        <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <section className="bg-[#0a0a0a] text-white pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 text-white">
              18+
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentContent.title}</h1>
            <p className="text-lg text-gray-400">{currentContent.intro}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {currentContent.sections.map((section, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {section.icon && (
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(section.icon)}
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                      <ul className="space-y-2 text-muted-foreground">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-semibold mb-4">{currentContent.resources.title}</h2>
                    <ul className="space-y-3">
                      {currentContent.resources.items.map((resource, index) => (
                        <li key={index}>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-medium"
                          >
                            {resource.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResponsibleGaming;
