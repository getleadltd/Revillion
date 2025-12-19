import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Mail, Clock, Users, Building2, HeadphonesIcon } from 'lucide-react';
import { useState } from 'react';

// Temporary type until Supabase types are regenerated
type ContactMessageInsert = {
  name: string;
  email: string;
  phone?: string | null;
  contact_type: string;
  company_name?: string | null;
  subject: string;
  message: string;
};

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255),
  phone: z.string()
    .trim()
    .max(30)
    .optional(),
  contactType: z.enum(['affiliate', 'partner', 'general']),
  companyName: z.string()
    .trim()
    .max(150)
    .optional(),
  subject: z.string()
    .trim()
    .min(5, "Subject too short")
    .max(200),
  message: z.string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message too long")
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t } = useTranslation();
  const { lang = 'en' } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const insertData: ContactMessageInsert = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        contact_type: data.contactType,
        company_name: data.companyName || null,
        subject: data.subject,
        message: data.message
      };

      const { error } = await supabase.from('contact_messages').insert([insertData]);

      if (error) throw error;

      toast({
        title: t('contact.form.success'),
        variant: 'default'
      });
      reset();
      setSelectedType('');
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: t('contact.form.error'),
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>{t('contact.title')} {t('contact.titleHighlight')} | Revillion Partners</title>
        <meta name="description" content={t('contact.subtitle')} />
        <link rel="canonical" href={`https://revillion-partners.com/${lang}/contact`} />
        <link rel="alternate" hrefLang="en" href="https://revillion-partners.com/en/contact" />
        <link rel="alternate" hrefLang="de" href="https://revillion-partners.com/de/contact" />
        <link rel="alternate" hrefLang="it" href="https://revillion-partners.com/it/contact" />
        <link rel="alternate" hrefLang="pt" href="https://revillion-partners.com/pt/contact" />
        <link rel="alternate" hrefLang="es" href="https://revillion-partners.com/es/contact" />
        <link rel="alternate" hrefLang="x-default" href="https://revillion-partners.com/en/contact" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-primary/10 text-primary">
              {t('contact.badge')}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t('contact.title')} <span className="text-primary">{t('contact.titleHighlight')}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.form.submit')}</CardTitle>
                <CardDescription>{t('contact.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">{t('contact.form.name')}</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder={t('contact.form.namePlaceholder')}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">{t('contact.form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder={t('contact.form.emailPlaceholder')}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">{t('contact.form.phone')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder={t('contact.form.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactType">{t('contact.form.contactType')}</Label>
                    <Select
                      onValueChange={(value) => {
                        setSelectedType(value);
                        setValue('contactType', value as 'affiliate' | 'partner' | 'general');
                      }}
                      value={selectedType}
                    >
                      <SelectTrigger className={errors.contactType ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('contact.form.contactType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="affiliate">{t('contact.form.contactTypeOptions.affiliate')}</SelectItem>
                        <SelectItem value="partner">{t('contact.form.contactTypeOptions.partner')}</SelectItem>
                        <SelectItem value="general">{t('contact.form.contactTypeOptions.general')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.contactType && (
                      <p className="text-sm text-destructive mt-1">{errors.contactType.message}</p>
                    )}
                  </div>

                  {selectedType === 'partner' && (
                    <div>
                      <Label htmlFor="companyName">{t('contact.form.company')}</Label>
                      <Input
                        id="companyName"
                        {...register('companyName')}
                        placeholder={t('contact.form.companyPlaceholder')}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                    <Input
                      id="subject"
                      {...register('subject')}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      className={errors.subject ? 'border-destructive' : ''}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="message">{t('contact.form.message')}</Label>
                    <Textarea
                      id="message"
                      {...register('message')}
                      placeholder={t('contact.form.messagePlaceholder')}
                      rows={5}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t('contact.form.submitting') : t('contact.form.submit')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contact.info.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.info.affiliate.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('contact.info.affiliate.description')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.info.partner.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('contact.info.partner.description')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HeadphonesIcon className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('contact.info.support.title')}</h3>
                      <p className="text-sm text-muted-foreground">{t('contact.info.support.description')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('contact.contactDetails.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{t('contact.contactDetails.email')}</p>
                    <a href="mailto:info@revillion.com" className="text-sm text-primary hover:underline">
                      {t('contact.contactDetails.emailValue')}
                    </a>
                  </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{t('contact.contactDetails.response')}</p>
                      <p className="text-sm text-muted-foreground">{t('contact.contactDetails.responseValue')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
