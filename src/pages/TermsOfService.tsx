import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const TermsOfService = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();

  const content: Record<string, { title: string; lastUpdated: string; sections: { title: string; content: string[] }[] }> = {
    en: {
      title: "Terms of Service",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          title: "1. Acceptance of Terms",
          content: [
            "By accessing and using Revillion Partners services, you agree to be bound by these Terms of Service.",
            "If you do not agree to these terms, please do not use our services."
          ]
        },
        {
          title: "2. Affiliate Program",
          content: [
            "Revillion Partners operates an affiliate marketing program for iGaming products and services.",
            "Affiliates must be at least 18 years of age and comply with all applicable laws and regulations.",
            "We reserve the right to approve or reject any affiliate application at our sole discretion."
          ]
        },
        {
          title: "3. Commissions and Payments",
          content: [
            "Commission rates and payment terms are specified in your individual affiliate agreement.",
            "Payments are made monthly, subject to minimum payout thresholds.",
            "We reserve the right to withhold payments in cases of suspected fraud or violation of terms."
          ]
        },
        {
          title: "4. Prohibited Activities",
          content: [
            "Affiliates must not engage in spam, misleading advertising, or any illegal marketing practices.",
            "Use of incentivized traffic without prior approval is strictly prohibited.",
            "Any form of self-referral or fraudulent activity will result in immediate termination."
          ]
        },
        {
          title: "5. Intellectual Property",
          content: [
            "All trademarks, logos, and marketing materials remain the property of Revillion Partners.",
            "Affiliates are granted a limited license to use approved materials for promotional purposes only."
          ]
        },
        {
          title: "6. Limitation of Liability",
          content: [
            "Revillion Partners shall not be liable for any indirect, incidental, or consequential damages.",
            "Our total liability shall not exceed the amount of commissions earned in the preceding 12 months."
          ]
        },
        {
          title: "7. Termination",
          content: [
            "Either party may terminate the affiliate relationship with 30 days written notice.",
            "We may terminate immediately in case of breach of these terms."
          ]
        },
        {
          title: "8. Modifications",
          content: [
            "We reserve the right to modify these terms at any time.",
            "Continued use of our services after modifications constitutes acceptance of the new terms."
          ]
        }
      ]
    },
    de: {
      title: "Nutzungsbedingungen",
      lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
      sections: [
        {
          title: "1. Annahme der Bedingungen",
          content: [
            "Durch den Zugriff auf und die Nutzung der Revillion Partners-Dienste erklären Sie sich mit diesen Nutzungsbedingungen einverstanden.",
            "Wenn Sie diesen Bedingungen nicht zustimmen, nutzen Sie bitte unsere Dienste nicht."
          ]
        },
        {
          title: "2. Partnerprogramm",
          content: [
            "Revillion Partners betreibt ein Affiliate-Marketing-Programm für iGaming-Produkte und -Dienste.",
            "Affiliates müssen mindestens 18 Jahre alt sein und alle geltenden Gesetze einhalten.",
            "Wir behalten uns das Recht vor, jeden Affiliate-Antrag nach eigenem Ermessen zu genehmigen oder abzulehnen."
          ]
        },
        {
          title: "3. Provisionen und Zahlungen",
          content: [
            "Provisionssätze und Zahlungsbedingungen sind in Ihrer individuellen Affiliate-Vereinbarung festgelegt.",
            "Zahlungen erfolgen monatlich, vorbehaltlich der Mindestaus zahlungsschwellen.",
            "Wir behalten uns das Recht vor, Zahlungen bei Verdacht auf Betrug zurückzuhalten."
          ]
        },
        {
          title: "4. Verbotene Aktivitäten",
          content: [
            "Affiliates dürfen kein Spam, irreführende Werbung oder illegale Marketingpraktiken betreiben.",
            "Die Verwendung von incentiviertem Traffic ohne vorherige Genehmigung ist streng verboten.",
            "Jede Form von Selbstverweisung oder betrügerischer Aktivität führt zur sofortigen Kündigung."
          ]
        },
        {
          title: "5. Geistiges Eigentum",
          content: [
            "Alle Marken, Logos und Marketingmaterialien bleiben Eigentum von Revillion Partners.",
            "Affiliates erhalten eine begrenzte Lizenz zur Verwendung genehmigter Materialien nur für Werbezwecke."
          ]
        },
        {
          title: "6. Haftungsbeschränkung",
          content: [
            "Revillion Partners haftet nicht für indirekte, zufällige oder Folgeschäden.",
            "Unsere Gesamthaftung übersteigt nicht die in den letzten 12 Monaten verdienten Provisionen."
          ]
        },
        {
          title: "7. Kündigung",
          content: [
            "Jede Partei kann die Affiliate-Beziehung mit einer Frist von 30 Tagen schriftlich kündigen.",
            "Bei Verstoß gegen diese Bedingungen können wir sofort kündigen."
          ]
        },
        {
          title: "8. Änderungen",
          content: [
            "Wir behalten uns das Recht vor, diese Bedingungen jederzeit zu ändern.",
            "Die fortgesetzte Nutzung unserer Dienste nach Änderungen gilt als Annahme der neuen Bedingungen."
          ]
        }
      ]
    },
    it: {
      title: "Termini di Servizio",
      lastUpdated: "Ultimo aggiornamento: Dicembre 2024",
      sections: [
        {
          title: "1. Accettazione dei Termini",
          content: [
            "Accedendo e utilizzando i servizi di Revillion Partners, accetti di essere vincolato da questi Termini di Servizio.",
            "Se non accetti questi termini, ti preghiamo di non utilizzare i nostri servizi."
          ]
        },
        {
          title: "2. Programma di Affiliazione",
          content: [
            "Revillion Partners gestisce un programma di marketing di affiliazione per prodotti e servizi iGaming.",
            "Gli affiliati devono avere almeno 18 anni e rispettare tutte le leggi e i regolamenti applicabili.",
            "Ci riserviamo il diritto di approvare o rifiutare qualsiasi domanda di affiliazione a nostra esclusiva discrezione."
          ]
        },
        {
          title: "3. Commissioni e Pagamenti",
          content: [
            "Le tariffe delle commissioni e i termini di pagamento sono specificati nel tuo accordo di affiliazione individuale.",
            "I pagamenti vengono effettuati mensilmente, soggetti a soglie minime di pagamento.",
            "Ci riserviamo il diritto di trattenere i pagamenti in caso di sospetta frode o violazione dei termini."
          ]
        },
        {
          title: "4. Attività Proibite",
          content: [
            "Gli affiliati non devono impegnarsi in spam, pubblicità ingannevole o pratiche di marketing illegali.",
            "L'uso di traffico incentivato senza previa approvazione è severamente vietato.",
            "Qualsiasi forma di auto-referral o attività fraudolenta comporterà la cessazione immediata."
          ]
        },
        {
          title: "5. Proprietà Intellettuale",
          content: [
            "Tutti i marchi, loghi e materiali di marketing rimangono di proprietà di Revillion Partners.",
            "Agli affiliati viene concessa una licenza limitata per utilizzare i materiali approvati solo a fini promozionali."
          ]
        },
        {
          title: "6. Limitazione di Responsabilità",
          content: [
            "Revillion Partners non sarà responsabile per danni indiretti, incidentali o consequenziali.",
            "La nostra responsabilità totale non supererà l'importo delle commissioni guadagnate nei 12 mesi precedenti."
          ]
        },
        {
          title: "7. Risoluzione",
          content: [
            "Ciascuna parte può risolvere il rapporto di affiliazione con 30 giorni di preavviso scritto.",
            "Possiamo risolvere immediatamente in caso di violazione di questi termini."
          ]
        },
        {
          title: "8. Modifiche",
          content: [
            "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.",
            "L'uso continuato dei nostri servizi dopo le modifiche costituisce accettazione dei nuovi termini."
          ]
        }
      ]
    },
    pt: {
      title: "Termos de Serviço",
      lastUpdated: "Última atualização: Dezembro 2024",
      sections: [
        {
          title: "1. Aceitação dos Termos",
          content: [
            "Ao acessar e usar os serviços da Revillion Partners, você concorda em estar vinculado a estes Termos de Serviço.",
            "Se você não concordar com estes termos, por favor, não use nossos serviços."
          ]
        },
        {
          title: "2. Programa de Afiliados",
          content: [
            "A Revillion Partners opera um programa de marketing de afiliados para produtos e serviços de iGaming.",
            "Os afiliados devem ter pelo menos 18 anos de idade e cumprir todas as leis e regulamentos aplicáveis.",
            "Reservamos o direito de aprovar ou rejeitar qualquer solicitação de afiliado a nosso exclusivo critério."
          ]
        },
        {
          title: "3. Comissões e Pagamentos",
          content: [
            "As taxas de comissão e os termos de pagamento são especificados em seu contrato de afiliado individual.",
            "Os pagamentos são feitos mensalmente, sujeitos a limites mínimos de pagamento.",
            "Reservamos o direito de reter pagamentos em casos de suspeita de fraude ou violação dos termos."
          ]
        },
        {
          title: "4. Atividades Proibidas",
          content: [
            "Os afiliados não devem se envolver em spam, publicidade enganosa ou quaisquer práticas de marketing ilegais.",
            "O uso de tráfego incentivado sem aprovação prévia é estritamente proibido.",
            "Qualquer forma de auto-referência ou atividade fraudulenta resultará em rescisão imediata."
          ]
        },
        {
          title: "5. Propriedade Intelectual",
          content: [
            "Todas as marcas registradas, logotipos e materiais de marketing permanecem propriedade da Revillion Partners.",
            "Os afiliados recebem uma licença limitada para usar materiais aprovados apenas para fins promocionais."
          ]
        },
        {
          title: "6. Limitação de Responsabilidade",
          content: [
            "A Revillion Partners não será responsável por quaisquer danos indiretos, incidentais ou consequenciais.",
            "Nossa responsabilidade total não excederá o valor das comissões ganhas nos 12 meses anteriores."
          ]
        },
        {
          title: "7. Rescisão",
          content: [
            "Qualquer uma das partes pode rescindir o relacionamento de afiliado com 30 dias de aviso prévio por escrito.",
            "Podemos rescindir imediatamente em caso de violação destes termos."
          ]
        },
        {
          title: "8. Modificações",
          content: [
            "Reservamos o direito de modificar estes termos a qualquer momento.",
            "O uso continuado de nossos serviços após modificações constitui aceitação dos novos termos."
          ]
        }
      ]
    },
    es: {
      title: "Términos de Servicio",
      lastUpdated: "Última actualización: Diciembre 2024",
      sections: [
        {
          title: "1. Aceptación de los Términos",
          content: [
            "Al acceder y utilizar los servicios de Revillion Partners, aceptas estar sujeto a estos Términos de Servicio.",
            "Si no estás de acuerdo con estos términos, por favor no utilices nuestros servicios."
          ]
        },
        {
          title: "2. Programa de Afiliados",
          content: [
            "Revillion Partners opera un programa de marketing de afiliados para productos y servicios de iGaming.",
            "Los afiliados deben tener al menos 18 años de edad y cumplir con todas las leyes y regulaciones aplicables.",
            "Nos reservamos el derecho de aprobar o rechazar cualquier solicitud de afiliado a nuestro exclusivo criterio."
          ]
        },
        {
          title: "3. Comisiones y Pagos",
          content: [
            "Las tasas de comisión y los términos de pago se especifican en tu acuerdo de afiliado individual.",
            "Los pagos se realizan mensualmente, sujetos a umbrales mínimos de pago.",
            "Nos reservamos el derecho de retener pagos en casos de sospecha de fraude o violación de términos."
          ]
        },
        {
          title: "4. Actividades Prohibidas",
          content: [
            "Los afiliados no deben participar en spam, publicidad engañosa o prácticas de marketing ilegales.",
            "El uso de tráfico incentivado sin aprobación previa está estrictamente prohibido.",
            "Cualquier forma de auto-referencia o actividad fraudulenta resultará en terminación inmediata."
          ]
        },
        {
          title: "5. Propiedad Intelectual",
          content: [
            "Todas las marcas registradas, logotipos y materiales de marketing siguen siendo propiedad de Revillion Partners.",
            "Los afiliados reciben una licencia limitada para usar materiales aprobados solo con fines promocionales."
          ]
        },
        {
          title: "6. Limitación de Responsabilidad",
          content: [
            "Revillion Partners no será responsable de ningún daño indirecto, incidental o consecuente.",
            "Nuestra responsabilidad total no excederá el monto de las comisiones ganadas en los 12 meses anteriores."
          ]
        },
        {
          title: "7. Terminación",
          content: [
            "Cualquiera de las partes puede terminar la relación de afiliado con 30 días de aviso por escrito.",
            "Podemos terminar inmediatamente en caso de incumplimiento de estos términos."
          ]
        },
        {
          title: "8. Modificaciones",
          content: [
            "Nos reservamos el derecho de modificar estos términos en cualquier momento.",
            "El uso continuado de nuestros servicios después de las modificaciones constituye la aceptación de los nuevos términos."
          ]
        }
      ]
    }
  };

  const currentContent = content[lang as keyof typeof content] || content.en;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": currentContent.title,
    "description": `${currentContent.title} for Revillion Partners iGaming affiliate program`,
    "url": `https://revillion-partners.com/${lang}/terms-of-service`,
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
        <meta name="description" content={`${currentContent.title} - Read the terms and conditions for using Revillion Partners affiliate services.`} />
        <link rel="canonical" href={`https://revillion-partners.com/${lang}/terms-of-service`} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/terms-of-service" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/terms-of-service" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/terms-of-service" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/terms-of-service" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/terms-of-service" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/terms-of-service" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta property="og:description" content={`${currentContent.title} - Read the terms and conditions for using Revillion Partners affiliate services.`} />
        <meta property="og:url" content={`https://revillion-partners.com/${lang}/terms-of-service`} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta name="twitter:description" content={`${currentContent.title} - Read the terms and conditions for using Revillion Partners affiliate services.`} />
        <meta name="twitter:image" content="https://revillion-partners.com/og-image.png" />

        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <section className="bg-[#0a0a0a] text-white pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{currentContent.title}</h1>
            <p className="text-gray-400">{currentContent.lastUpdated}</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card>
            <CardContent className="p-8 space-y-8">
              {currentContent.sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                  <div className="space-y-2 text-muted-foreground">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default TermsOfService;
