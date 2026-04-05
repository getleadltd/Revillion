import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();

  const content: Record<string, { title: string; lastUpdated: string; sections: { title: string; content: string[] }[] }> = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          title: "1. Information We Collect",
          content: [
            "We collect information you provide directly to us, such as when you create an account, fill out a form, or contact us.",
            "This may include your name, email address, phone number, company name, and any other information you choose to provide."
          ]
        },
        {
          title: "2. How We Use Your Information",
          content: [
            "We use the information we collect to provide, maintain, and improve our services.",
            "To communicate with you about products, services, and promotional offers.",
            "To respond to your comments, questions, and customer service requests."
          ]
        },
        {
          title: "3. Information Sharing",
          content: [
            "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.",
            "We may share information with trusted third parties who assist us in operating our website and conducting our business."
          ]
        },
        {
          title: "4. Data Security",
          content: [
            "We implement appropriate security measures to protect your personal information.",
            "However, no method of transmission over the Internet is 100% secure."
          ]
        },
        {
          title: "5. Cookies",
          content: [
            "We use cookies and similar tracking technologies to track activity on our website.",
            "You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent."
          ]
        },
        {
          title: "6. Your Rights",
          content: [
            "You have the right to access, update, or delete your personal information.",
            "You may also opt out of receiving promotional communications from us."
          ]
        },
        {
          title: "7. Contact Us",
          content: [
            "If you have any questions about this Privacy Policy, please contact us at info@revillion.com"
          ]
        }
      ]
    },
    de: {
      title: "Datenschutzrichtlinie",
      lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
      sections: [
        {
          title: "1. Informationen, die wir sammeln",
          content: [
            "Wir sammeln Informationen, die Sie uns direkt zur Verfügung stellen, z.B. wenn Sie ein Konto erstellen, ein Formular ausfüllen oder uns kontaktieren.",
            "Dies kann Ihren Namen, Ihre E-Mail-Adresse, Telefonnummer, Firmennamen und alle anderen Informationen umfassen, die Sie angeben möchten."
          ]
        },
        {
          title: "2. Wie wir Ihre Informationen verwenden",
          content: [
            "Wir verwenden die gesammelten Informationen, um unsere Dienste bereitzustellen, zu pflegen und zu verbessern.",
            "Um mit Ihnen über Produkte, Dienstleistungen und Werbeangebote zu kommunizieren.",
            "Um auf Ihre Kommentare, Fragen und Kundendienstanfragen zu antworten."
          ]
        },
        {
          title: "3. Informationsaustausch",
          content: [
            "Wir verkaufen, handeln oder übertragen Ihre persönlichen Daten nicht ohne Ihre Zustimmung an Dritte.",
            "Wir können Informationen mit vertrauenswürdigen Dritten teilen, die uns beim Betrieb unserer Website unterstützen."
          ]
        },
        {
          title: "4. Datensicherheit",
          content: [
            "Wir implementieren angemessene Sicherheitsmaßnahmen zum Schutz Ihrer persönlichen Daten.",
            "Jedoch ist keine Übertragungsmethode über das Internet 100% sicher."
          ]
        },
        {
          title: "5. Cookies",
          content: [
            "Wir verwenden Cookies und ähnliche Tracking-Technologien, um die Aktivität auf unserer Website zu verfolgen.",
            "Sie können Ihren Browser anweisen, alle Cookies abzulehnen oder anzuzeigen, wenn ein Cookie gesendet wird."
          ]
        },
        {
          title: "6. Ihre Rechte",
          content: [
            "Sie haben das Recht, auf Ihre persönlichen Daten zuzugreifen, diese zu aktualisieren oder zu löschen.",
            "Sie können auch den Erhalt von Werbemitteilungen von uns ablehnen."
          ]
        },
        {
          title: "7. Kontaktieren Sie uns",
          content: [
            "Wenn Sie Fragen zu dieser Datenschutzrichtlinie haben, kontaktieren Sie uns bitte unter info@revillion.com"
          ]
        }
      ]
    },
    it: {
      title: "Informativa sulla Privacy",
      lastUpdated: "Ultimo aggiornamento: Dicembre 2024",
      sections: [
        {
          title: "1. Informazioni che raccogliamo",
          content: [
            "Raccogliamo le informazioni che ci fornisci direttamente, ad esempio quando crei un account, compili un modulo o ci contatti.",
            "Questo può includere il tuo nome, indirizzo email, numero di telefono, nome dell'azienda e qualsiasi altra informazione che scegli di fornire."
          ]
        },
        {
          title: "2. Come utilizziamo le tue informazioni",
          content: [
            "Utilizziamo le informazioni raccolte per fornire, mantenere e migliorare i nostri servizi.",
            "Per comunicare con te riguardo prodotti, servizi e offerte promozionali.",
            "Per rispondere ai tuoi commenti, domande e richieste di assistenza clienti."
          ]
        },
        {
          title: "3. Condivisione delle informazioni",
          content: [
            "Non vendiamo, scambiamo o trasferiamo le tue informazioni personali a terzi senza il tuo consenso.",
            "Potremmo condividere informazioni con terze parti fidate che ci assistono nel gestire il nostro sito web."
          ]
        },
        {
          title: "4. Sicurezza dei dati",
          content: [
            "Implementiamo misure di sicurezza appropriate per proteggere le tue informazioni personali.",
            "Tuttavia, nessun metodo di trasmissione su Internet è sicuro al 100%."
          ]
        },
        {
          title: "5. Cookie",
          content: [
            "Utilizziamo cookie e tecnologie di tracciamento simili per monitorare l'attività sul nostro sito web.",
            "Puoi impostare il tuo browser per rifiutare tutti i cookie o per indicare quando un cookie viene inviato."
          ]
        },
        {
          title: "6. I tuoi diritti",
          content: [
            "Hai il diritto di accedere, aggiornare o eliminare le tue informazioni personali.",
            "Puoi anche scegliere di non ricevere comunicazioni promozionali da noi."
          ]
        },
        {
          title: "7. Contattaci",
          content: [
            "Se hai domande su questa Informativa sulla Privacy, contattaci a info@revillion.com"
          ]
        }
      ]
    },
    pt: {
      title: "Política de Privacidade",
      lastUpdated: "Última atualização: Dezembro 2024",
      sections: [
        {
          title: "1. Informações que coletamos",
          content: [
            "Coletamos informações que você nos fornece diretamente, como quando cria uma conta, preenche um formulário ou nos contata.",
            "Isso pode incluir seu nome, endereço de e-mail, número de telefone, nome da empresa e qualquer outra informação que você escolher fornecer."
          ]
        },
        {
          title: "2. Como usamos suas informações",
          content: [
            "Usamos as informações coletadas para fornecer, manter e melhorar nossos serviços.",
            "Para comunicar com você sobre produtos, serviços e ofertas promocionais.",
            "Para responder aos seus comentários, perguntas e solicitações de atendimento ao cliente."
          ]
        },
        {
          title: "3. Compartilhamento de informações",
          content: [
            "Não vendemos, trocamos ou transferimos suas informações pessoais a terceiros sem seu consentimento.",
            "Podemos compartilhar informações com terceiros confiáveis que nos ajudam a operar nosso site."
          ]
        },
        {
          title: "4. Segurança dos dados",
          content: [
            "Implementamos medidas de segurança apropriadas para proteger suas informações pessoais.",
            "No entanto, nenhum método de transmissão pela Internet é 100% seguro."
          ]
        },
        {
          title: "5. Cookies",
          content: [
            "Usamos cookies e tecnologias de rastreamento semelhantes para monitorar a atividade em nosso site.",
            "Você pode configurar seu navegador para recusar todos os cookies ou para indicar quando um cookie está sendo enviado."
          ]
        },
        {
          title: "6. Seus direitos",
          content: [
            "Você tem o direito de acessar, atualizar ou excluir suas informações pessoais.",
            "Você também pode optar por não receber comunicações promocionais de nós."
          ]
        },
        {
          title: "7. Entre em contato",
          content: [
            "Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco em info@revillion.com"
          ]
        }
      ]
    },
    es: {
      title: "Política de Privacidad",
      lastUpdated: "Última actualización: Diciembre 2024",
      sections: [
        {
          title: "1. Información que recopilamos",
          content: [
            "Recopilamos la información que nos proporcionas directamente, como cuando creas una cuenta, completas un formulario o nos contactas.",
            "Esto puede incluir tu nombre, dirección de correo electrónico, número de teléfono, nombre de la empresa y cualquier otra información que elijas proporcionar."
          ]
        },
        {
          title: "2. Cómo usamos tu información",
          content: [
            "Usamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios.",
            "Para comunicarnos contigo sobre productos, servicios y ofertas promocionales.",
            "Para responder a tus comentarios, preguntas y solicitudes de servicio al cliente."
          ]
        },
        {
          title: "3. Compartir información",
          content: [
            "No vendemos, intercambiamos ni transferimos tu información personal a terceros sin tu consentimiento.",
            "Podemos compartir información con terceros de confianza que nos ayudan a operar nuestro sitio web."
          ]
        },
        {
          title: "4. Seguridad de datos",
          content: [
            "Implementamos medidas de seguridad apropiadas para proteger tu información personal.",
            "Sin embargo, ningún método de transmisión por Internet es 100% seguro."
          ]
        },
        {
          title: "5. Cookies",
          content: [
            "Usamos cookies y tecnologías de seguimiento similares para rastrear la actividad en nuestro sitio web.",
            "Puedes configurar tu navegador para rechazar todas las cookies o para indicar cuándo se envía una cookie."
          ]
        },
        {
          title: "6. Tus derechos",
          content: [
            "Tienes derecho a acceder, actualizar o eliminar tu información personal.",
            "También puedes optar por no recibir comunicaciones promocionales de nuestra parte."
          ]
        },
        {
          title: "7. Contáctanos",
          content: [
            "Si tienes preguntas sobre esta Política de Privacidad, contáctanos en info@revillion.com"
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
    "url": `https://revillion-partners.com/${lang}/privacy-policy`,
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
        <meta name="description" content={`${currentContent.title} - Learn how Revillion Partners collects, uses, and protects your personal information.`} />
        <link rel="canonical" href={`https://revillion-partners.com/${lang}/privacy-policy`} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/privacy-policy" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/privacy-policy" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/privacy-policy" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/privacy-policy" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/privacy-policy" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/privacy-policy" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta property="og:description" content={`${currentContent.title} - Learn how Revillion Partners collects, uses, and protects your personal information.`} />
        <meta property="og:url" content={`https://revillion-partners.com/${lang}/privacy-policy`} />
        <meta property="og:image" content="https://revillion-partners.com/og-image.png" />
        <meta property="og:site_name" content="Revillion" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@revillion" />
        <meta name="twitter:title" content={`${currentContent.title} | Revillion Partners`} />
        <meta name="twitter:description" content={`${currentContent.title} - Learn how Revillion Partners collects, uses, and protects your personal information.`} />
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

export default PrivacyPolicy;
