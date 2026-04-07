import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useUpdateSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, BarChart3, Megaphone, Search, Eye, CheckCircle2, ExternalLink } from 'lucide-react';

// ─── Field definitions (always shown, values loaded from DB) ─────────────────

interface FieldDef {
  key: string;
  label: string;
  description: string;
  placeholder: string;
  docUrl?: string;
}

interface CategoryDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  fields: FieldDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Google Analytics 4, Google Tag Manager, Hotjar',
    fields: [
      {
        key: 'ga4_measurement_id',
        label: 'GA4 Measurement ID',
        description: 'Google Analytics 4 tracking ID. Se GTM è impostato, GA4 diretto viene ignorato.',
        placeholder: 'G-FKENPNYCSP',
        docUrl: 'https://support.google.com/analytics/answer/9539598',
      },
      {
        key: 'gtm_container_id',
        label: 'GTM Container ID',
        description: 'Google Tag Manager. Se impostato, ha priorità su GA4 diretto.',
        placeholder: 'GTM-XXXXXXX',
        docUrl: 'https://support.google.com/tagmanager/answer/6103696',
      },
      {
        key: 'hotjar_site_id',
        label: 'Hotjar Site ID',
        description: 'Heatmaps e session recordings. Solo numeri.',
        placeholder: '3456789',
        docUrl: 'https://help.hotjar.com/hc/en-us/articles/115009340207',
      },
    ],
  },
  {
    key: 'meta_ads',
    label: 'Meta Ads',
    icon: <Megaphone className="w-4 h-4" />,
    description: 'Facebook/Instagram Pixel per il conversion tracking',
    fields: [
      {
        key: 'meta_pixel_id',
        label: 'Meta Pixel ID',
        description: 'Pixel ID del tuo account Facebook Business. Solo numeri.',
        placeholder: '1234567890123456',
        docUrl: 'https://www.facebook.com/business/help/952192354843755',
      },
    ],
  },
  {
    key: 'seo',
    label: 'SEO Verification',
    icon: <Search className="w-4 h-4" />,
    description: 'Google Search Console, Bing Webmaster Tools',
    fields: [
      {
        key: 'google_site_verification',
        label: 'Google Search Console',
        description: 'Codice di verifica del sito su Google Search Console.',
        placeholder: 'abc123xyz...',
        docUrl: 'https://search.google.com/search-console',
      },
      {
        key: 'bing_site_verification',
        label: 'Bing Webmaster Tools',
        description: 'Codice di verifica del sito su Bing Webmaster Tools.',
        placeholder: 'ABC123...',
        docUrl: 'https://www.bing.com/webmasters',
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dirty, setDirty] = useState(false);

  // Load values from DB (best-effort — show inputs even if table doesn't exist yet)
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('key, value');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row) => { map[row.key] = row.value; });
          setForm(map);
        }
      } catch {
        // Table may not exist yet — show empty inputs
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      setDirty(false);
      toast({ title: '✅ Impostazioni salvate', description: 'Le modifiche saranno attive al prossimo caricamento.' });
    } catch {
      toast({ title: 'Errore', description: 'Salvataggio fallito. Assicurati che la tabella site_settings esista in Supabase.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <AdminLayout>
        <div className="space-y-6 max-w-3xl">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Impostazioni Sito</h1>
              <p className="text-muted-foreground mt-1">
                Gestisci tracking e integrazioni — nessuna modifica al codice necessaria.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={!dirty || updateSettings.isPending}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updateSettings.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {dirty ? 'Salva modifiche' : 'Salvato'}
            </Button>
          </div>

          {/* CAPI notice */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex gap-3">
            <Eye className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-400 mb-1">Meta CAPI Access Token</p>
              <p className="text-muted-foreground">
                Il token server-side CAPI è un segreto e non può essere salvato qui. Impostalo via Supabase CLI:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  supabase secrets set META_CAPI_ACCESS_TOKEN=EAAxxxxx
                </code>
              </p>
            </div>
          </div>

          {/* Settings groups */}
          {CATEGORIES.map((cat) => (
            <Card key={cat.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-orange-500">{cat.icon}</span>
                  {cat.label}
                </CardTitle>
                <CardDescription>{cat.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {cat.fields.map((field) => {
                  const currentValue = form[field.key] ?? '';
                  const isFilled = currentValue.trim().length > 0;

                  return (
                    <div key={field.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={field.key} className="font-semibold">
                          {field.label}
                        </Label>
                        {isFilled ? (
                          <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attivo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Non configurato
                          </Badge>
                        )}
                        {field.docUrl && (
                          <a
                            href={field.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            Dove trovarlo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <Input
                        id={field.key}
                        value={currentValue}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={`es. ${field.placeholder}`}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          {/* Save footer */}
          {dirty && (
            <div className="sticky bottom-4">
              <div className="bg-background border border-orange-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
                <p className="text-sm text-muted-foreground">Hai modifiche non salvate.</p>
                <Button
                  onClick={handleSave}
                  disabled={updateSettings.isPending}
                  className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salva modifiche
                </Button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
