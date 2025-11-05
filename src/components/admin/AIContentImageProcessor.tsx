import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImagePlus } from "lucide-react";

interface AIContentImageProcessorProps {
  content: string;
  onContentUpdate: (newContent: string) => void;
  articleTitle: string;
  articleSlug: string;
}

export function AIContentImageProcessor({
  content,
  onContentUpdate,
  articleTitle,
  articleSlug
}: AIContentImageProcessorProps) {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const processContentImages = async () => {
    // Trova tutti gli shortcode [AI-IMAGE: descrizione]
    const shortcodeRegex = /\[AI-IMAGE:\s*([^\]]+)\]/g;
    const matches = Array.from(content.matchAll(shortcodeRegex));

    if (matches.length === 0) {
      toast({
        title: "Nessun shortcode trovato",
        description: "Aggiungi [AI-IMAGE: descrizione] nel contenuto dove vuoi inserire immagini.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      let updatedContent = content;
      let successCount = 0;

      // Processa ogni shortcode
      for (const match of matches) {
        const fullMatch = match[0];
        const imagePrompt = match[1].trim();

        try {
          // Genera immagine via edge function
          const { data, error } = await supabase.functions.invoke('generate-blog-image', {
            body: { prompt: imagePrompt }
          });

          if (error) throw error;
          if (!data?.imageBase64) throw new Error('Nessuna immagine generata');

          // Converti base64 in Blob
          const base64Response = await fetch(data.imageBase64);
          const blob = await base64Response.blob();

          // Genera filename SEO-friendly
          const timestamp = Date.now();
          const fileName = `${articleSlug}-content-${timestamp}.png`;

          // Upload a Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: false,
              metadata: {
                alt: imagePrompt,
                title: articleTitle,
                type: 'content-image',
                generated_at: new Date().toISOString()
              }
            });

          if (uploadError) throw uploadError;

          // Ottieni URL pubblico
          const { data: urlData } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);

          if (!urlData?.publicUrl) throw new Error('Impossibile ottenere URL pubblico');

          // Sostituisci shortcode con figure HTML ottimizzata
          const figureHTML = `
<figure class="my-8">
  <img 
    src="${urlData.publicUrl}" 
    alt="${imagePrompt}" 
    title="${imagePrompt}"
    loading="lazy"
    width="1200"
    height="675"
    class="w-full h-auto rounded-lg"
  />
  <figcaption class="text-sm text-muted-foreground text-center mt-2">${imagePrompt}</figcaption>
</figure>`;

          updatedContent = updatedContent.replace(fullMatch, figureHTML);
          successCount++;

        } catch (imgError: any) {
          console.error('Error processing image:', imgError);
          // Continua con le altre immagini anche se una fallisce
        }
      }

      if (successCount > 0) {
        onContentUpdate(updatedContent);
        toast({
          title: "✨ Immagini generate!",
          description: `${successCount} di ${matches.length} immagini generate e inserite nel contenuto.`
        });
      } else {
        throw new Error('Nessuna immagine è stata generata con successo');
      }

    } catch (error: any) {
      console.error('Error processing content images:', error);
      toast({
        title: "Errore",
        description: error.message || 'Errore durante la generazione delle immagini',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Conta quanti shortcode ci sono nel contenuto
  const shortcodeCount = (content.match(/\[AI-IMAGE:/g) || []).length;

  if (shortcodeCount === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            🖼️ {shortcodeCount} shortcode immagine{shortcodeCount > 1 ? 'i' : ''} trovato{shortcodeCount > 1 ? 'i' : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Formato: [AI-IMAGE: descrizione immagine]
          </p>
        </div>
        <Button
          type="button"
          onClick={processContentImages}
          disabled={processing}
          className="gap-2"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" />}
          <ImagePlus className="h-4 w-4" />
          {processing ? "Generando..." : "Genera Immagini"}
        </Button>
      </div>
    </div>
  );
}