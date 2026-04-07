

## Problema

Il file `types.ts` auto-generato non include le tabelle `agent_tasks` e `site_settings`, anche se esistono nel database. Questo causa tutti gli errori di build (circa 25 errori TypeScript) in `AutoPilot.tsx`, `AgentsDashboard.tsx` e `useSiteSettings.ts`.

Non si tratta di deployare qualcosa di nuovo nel DB: le tabelle ci sono gia. Il problema e che i tipi TypeScript non sono sincronizzati.

## Piano

### 1. Forzare la rigenerazione dei tipi

Il file `src/integrations/supabase/types.ts` viene generato automaticamente da Lovable Cloud. Per forzare la sincronizzazione, eseguiro una migrazione no-op (un commento SQL) che triggera la rigenerazione dei tipi includendo `agent_tasks` e `site_settings`.

### 2. Fix RichTextEditor (errore separato)

L'errore su `RichTextEditor.tsx` linea 79 (`Type 'false' has no properties in common with type 'SetContentOptions'`) e un bug separato. Correggo il parametro passato a `setContent`.

## Risultato atteso

- Zero errori di build
- `types.ts` aggiornato con tutte le 9 tabelle del DB
- AutoPilot, AgentsDashboard e useSiteSettings funzionano correttamente

