import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useSiteSettings, useUpdateSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, BarChart3, Megaphone, Search, Eye, CheckCircle2, ExternalLink } from 'lucide-react';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { key: string; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Google Analytics 4, Google Tag Manager, Hotjar',
  },
  {
    key: 'meta_ads',
    label: 'Meta Ads',
    icon: <Megaphone className="w-4 h-4" />,
    description: 'Facebook/Instagram Pixel for conversion tracking',
  },
  {
    key: 'seo',
    label: 'SEO Verification',
    icon: <Search className="w-4 h-4" />,
    description: 'Google Search Console, Bing Webmaster Tools',
  },
];

const CATEGORY_DOCS: Record<string, string> = {
  ga4_measurement_id:       'https://support.google.com/analytics/answer/9539598',
  gtm_container_id:         'https://support.google.com/tagmanager/answer/6103696',
  meta_pixel_id:            'https://www.facebook.com/business/help/952192354843755',
  hotjar_site_id:           'https://help.hotjar.com/hc/en-us/articles/115009340207',
  google_site_verification: 'https://search.google.com/search-console',
  bing_site_verification:   'https://www.bing.com/webmasters',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();

  // Local form state: key → value
  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  // Populate form when settings load
  useEffect(() => {
    if (!settings) return;
    const initial = Object.fromEntries(settings.map(s => [s.key, s.value]));
    setForm(initial);
    setDirty(false);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(form);
      setDirty(false);
      toast({ title: '✅ Settings saved', description: 'Changes will take effect on next page load.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  // Group settings by category
  const grouped = CATEGORIES.map(cat => ({
    ...cat,
    settings: (settings ?? []).filter(s => s.category === cat.key),
  }));

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
              <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage tracking codes and integrations — no code changes needed.
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
              {dirty ? 'Save changes' : 'Saved'}
            </Button>
          </div>

          {/* CAPI notice */}
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex gap-3">
            <Eye className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-orange-400 mb-1">Meta CAPI Access Token</p>
              <p className="text-muted-foreground">
                The CAPI server-side token is a secret and cannot be stored here for security reasons.
                Set it via Supabase CLI:{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                  supabase secrets set META_CAPI_ACCESS_TOKEN=EAAxxxxx
                </code>
              </p>
            </div>
          </div>

          {/* Settings groups */}
          {grouped.map(cat => (
            <Card key={cat.key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-orange-500">{cat.icon}</span>
                  {cat.label}
                </CardTitle>
                <CardDescription>{cat.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {cat.settings.length === 0 && (
                  <p className="text-sm text-muted-foreground">No settings in this category.</p>
                )}
                {cat.settings.map(setting => {
                  const currentValue = form[setting.key] ?? '';
                  const isFilled = currentValue.trim().length > 0;
                  const docUrl = CATEGORY_DOCS[setting.key];

                  return (
                    <div key={setting.key} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={setting.key} className="font-semibold">
                          {setting.label}
                        </Label>
                        {isFilled ? (
                          <Badge variant="outline" className="text-xs text-green-500 border-green-500/30 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            Not configured
                          </Badge>
                        )}
                        {docUrl && (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                          >
                            Where to find this <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <Input
                        id={setting.key}
                        value={currentValue}
                        onChange={e => handleChange(setting.key, e.target.value)}
                        placeholder={`e.g. ${getPlaceholder(setting.key)}`}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
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
                <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
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
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}

function getPlaceholder(key: string): string {
  const map: Record<string, string> = {
    ga4_measurement_id:       'G-FKENPNYCSP',
    gtm_container_id:         'GTM-XXXXXXX',
    meta_pixel_id:            '1234567890123456',
    hotjar_site_id:           '3456789',
    google_site_verification: 'abc123xyz...',
    bing_site_verification:   'ABC123...',
  };
  return map[key] || '...';
}
