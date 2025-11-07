import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Upload } from "lucide-react";

interface AIImageGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageGenerated: (imageUrl: string, altText: string) => void;
  articleTitle?: string;
  articleCategory?: string;
}

export function AIImageGeneratorDialog({
  open,
  onOpenChange,
  onImageGenerated,
  articleTitle = "",
  articleCategory = "news"
}: AIImageGeneratorDialogProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [altText, setAltText] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAutoPrompt = () => {
    if (!articleTitle) {
      toast({
        title: "Titolo mancante",
        description: "Inserisci prima il titolo dell'articolo per generare un prompt automatico.",
        variant: "destructive"
      });
      return;
    }

    // Prompt placeholder che verrà sostituito dall'edge function
    setPrompt(`[AUTO] ${articleTitle} - ${articleCategory}`);
    
    toast({
      title: "Prompt automatico preparato",
      description: "Il prompt fotografico verrà generato automaticamente dall'AI."
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vuoto",
        description: "Inserisci una descrizione dell'immagine da generare.",
        variant: "destructive"
      });
      return;
    }

    if (prompt.trim().length < 10) {
      toast({
        title: "Prompt troppo breve",
        description: "Inserisci una descrizione più dettagliata (almeno 10 caratteri).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setGeneratedImage(null);

    try {
      // Controlla se è un auto-prompt
      const isAutoPrompt = prompt.startsWith('[AUTO]');
      
      const requestBody = isAutoPrompt 
        ? {
            prompt: '', // Edge function lo ignorerà
            autoPrompt: {
              title: articleTitle,
              category: articleCategory
            }
          }
        : {
            prompt: prompt.trim()
          };

      const { data, error } = await supabase.functions.invoke('generate-blog-image', {
        body: requestBody
      });

      if (error) throw error;

      if (!data?.imageBase64) {
        throw new Error('Nessuna immagine generata');
      }

      setGeneratedImage(data.imageBase64);
      toast({
        title: "✨ Immagine generata!",
        description: "L'immagine è stata creata con successo. Puoi rigenerarla o usarla."
      });

    } catch (error: any) {
      console.error('Error generating image:', error);
      
      let errorMessage = 'Errore durante la generazione dell\'immagine';
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit raggiunto. Riprova tra qualche minuto.';
      } else if (error.message?.includes('Crediti')) {
        errorMessage = 'Crediti AI esauriti. Contatta l\'amministratore.';
      }

      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseImage = async () => {
    if (!generatedImage) return;

    setUploading(true);

    try {
      // Converti base64 in Blob
      const base64Response = await fetch(generatedImage);
      const blob = await base64Response.blob();

      // Genera nome file basato su slug + timestamp per SEO
      const slug = articleTitle ? articleTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') : 'blog-image';
      const fileName = `${slug}-featured-${Date.now()}.png`;
      const filePath = `${fileName}`;

      // Genera alt text intelligente se non fornito
      const finalAltText = altText || (articleTitle ? `${articleTitle} - ${articleCategory}` : 'Blog image');

      // Upload a Supabase Storage con metadata SEO
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: false,
          metadata: {
            alt: finalAltText,
            title: articleTitle || '',
            category: articleCategory || '',
            generated_at: new Date().toISOString()
          }
        });

      if (uploadError) throw uploadError;

      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Impossibile ottenere URL pubblico');
      }

      // Callback con URL e alt text
      onImageGenerated(urlData.publicUrl, finalAltText);
      
      toast({
        title: "✅ Immagine caricata!",
        description: "L'immagine è stata salvata con metadati SEO ottimizzati."
      });

      // Reset e chiudi
      setPrompt("");
      setAltText("");
      setGeneratedImage(null);
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Errore upload",
        description: error.message || 'Impossibile caricare l\'immagine',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setAltText("");
    setGeneratedImage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            🎨 Genera Immagine con AI
          </DialogTitle>
          <DialogDescription>
            Crea un'immagine in evidenza professionale per il tuo articolo usando l'intelligenza artificiale.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descrizione Immagine</Label>
            <Textarea
              id="prompt"
              placeholder="Descrivi l'immagine che vuoi generare (es: 'Un'immagine moderna di un casinò online con carte da gioco e chips...')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px]"
              disabled={loading || uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="altText">Alt Text (SEO)</Label>
            <Input
              id="altText"
              placeholder="Descrizione alternativa per SEO (opzionale, verrà generata dal titolo)"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={loading || uploading}
            />
            <p className="text-xs text-muted-foreground">
              Se lasciato vuoto, verrà generato automaticamente da titolo + categoria
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAutoPrompt}
            disabled={loading || uploading || !articleTitle}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            ✨ Suggerisci da Titolo
          </Button>

          {generatedImage && (
            <div className="space-y-2">
              <Label>Preview Immagine Generata</Label>
              <div className="border rounded-lg overflow-hidden bg-muted">
                <img 
                  src={generatedImage} 
                  alt="Generated preview" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading || uploading}
          >
            Annulla
          </Button>

          {!generatedImage ? (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || uploading || !prompt.trim()}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Generando..." : "Genera Immagine"}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerate}
                disabled={loading || uploading}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Rigenera
              </Button>
              <Button
                type="button"
                onClick={handleUseImage}
                disabled={uploading}
                className="gap-2"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Upload className="h-4 w-4" />
                {uploading ? "Caricamento..." : "Usa Questa Immagine"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
