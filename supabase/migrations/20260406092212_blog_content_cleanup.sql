-- Blog content cleanup: remove off-topic and duplicate articles,
-- re-queue November 2025 articles for regeneration with new silo/FAQ system

-- ============================================================
-- 1. DELETE off-topic articles (player-focused, not affiliate)
-- ============================================================
DELETE FROM blog_posts WHERE id IN (
  'b8584f1a-bda7-45b3-a272-c880fc7a48ba', -- "Aumentare il LTV del Casino: fidelizzazione giocatori"
  '45554f6d-cb47-4ea8-80fe-deb4e23216a6'  -- "Marchi di Casino Premium: Cosa li Distingue"
);

-- ============================================================
-- 2. DELETE duplicate tracking articles (keep conversion-tracking)
-- ============================================================
DELETE FROM blog_posts WHERE id IN (
  '988f8ea4-9ff5-4d92-858b-a5acdbc017bf', -- "Why Track Affiliate Campaigns for Maximum Revenue"
  '224bf968-df3d-4efb-9ce1-26ac581917e9'  -- "Why Track Casino Traffic: Maximizing Affiliate Revenue"
);
-- Kept: b5ac8ccd "Conversion Tracking: Maximizing Affiliate Casino Revenue"

-- ============================================================
-- 3. DELETE November 2025 articles (re-queued for regeneration
--    with new silo architecture, FAQ schema, and Revillion CTA)
-- ============================================================
DELETE FROM blog_posts WHERE id IN (
  'e4652b88-4c55-4096-8d0f-6baec6fb3008',
  '735a01d0-4ea4-4581-adb1-d1abdfe0c322',
  '16978aaf-d7e8-48e2-a6ce-4d255190c919',
  '5b99427b-35dc-4cc5-8240-7bf9465ee12f',
  '5c8d081e-6bdd-4c1c-987b-fa3fda6cb031',
  '9f190aac-8515-4857-b750-ca0619b15217',
  'd047e4d7-3b34-4c9f-9a4d-b725b316b71b',
  'd3f1f11d-4edf-47b8-93d7-f8b3fcf5a444',
  '9142ff4b-1a0b-4e7b-8914-7c57b78260d2',
  '330c5517-b6bf-4e95-956d-418b43bed672',
  '4a3358f4-470e-4df9-98bf-a7898c502419',
  '20a32ded-81fb-4e58-b26a-185344b4b08e',
  '217c7df4-c6c3-4550-a60f-33acccd7fec6',
  '499092dc-b543-4f65-b71c-a2fd588479d5'
);

-- ============================================================
-- 4. Re-queue with updated titles for the new generator
--    Priority 8 = high, staggered 1h apart
-- ============================================================
INSERT INTO blog_queue (title, status, priority, scheduled_for) VALUES
  ('SEO per Affiliati Casino Online: Rankare su Google nel 2026',                    'pending', 8, NOW() + INTERVAL '1 hour'),
  ('Come Promuovere un Casino Online: Strategie Vincenti per Affiliati iGaming',     'pending', 8, NOW() + INTERVAL '2 hours'),
  ('Nicchie Casino Online piu Redditizie nel 2026: Guida per Affiliati',             'pending', 8, NOW() + INTERVAL '3 hours'),
  ('Le Migliori Sorgenti di Traffico per Affiliati iGaming nel 2026',                'pending', 8, NOW() + INTERVAL '4 hours'),
  ('Mercati iGaming ad Alto ROI nel 2026: Dove Guadagnare di Piu come Affiliato',   'pending', 8, NOW() + INTERVAL '5 hours'),
  ('Come Creare Landing Page e Banner che Convertono per Affiliati Casino',          'pending', 8, NOW() + INTERVAL '6 hours'),
  ('KPI e Metriche Fondamentali per Affiliati iGaming: Guida Completa',             'pending', 8, NOW() + INTERVAL '7 hours'),
  ('AI, VR e Blockchain nellIGaming: Opportunita per Affiliati nel 2026',           'pending', 8, NOW() + INTERVAL '8 hours'),
  ('Come Costruire un Brand Personale come Affiliato iGaming di Successo',           'pending', 8, NOW() + INTERVAL '9 hours'),
  ('Scalare il Business di Affiliazione iGaming: Strategie e Automazioni 2026',     'pending', 8, NOW() + INTERVAL '10 hours'),
  ('Local SEO per Affiliati iGaming: Dominare i Mercati Internazionali',             'pending', 8, NOW() + INTERVAL '11 hours'),
  ('Analisi Dati per Affiliati Casino: Come Ottimizzare le Conversioni CPA',        'pending', 8, NOW() + INTERVAL '12 hours'),
  ('I 10 Errori che Distruggono il Business di un Affiliato iGaming',               'pending', 8, NOW() + INTERVAL '13 hours'),
  ('Come Iniziare Affiliazione Casino Online da Zero: Guida Completa 2026',         'pending', 8, NOW() + INTERVAL '14 hours');
