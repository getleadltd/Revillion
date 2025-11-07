import { generateSlug } from './blog';
import { supabase } from '@/integrations/supabase/client';

export interface TranslatedSlugs {
  slug_en?: string;
  slug_de?: string;
  slug_it?: string;
  slug_pt?: string;
  slug_es?: string;
}

/**
 * Generate translated slugs from titles
 */
export const generateTranslatedSlugs = (post: {
  title_en?: string | null;
  title_de?: string | null;
  title_it?: string | null;
  title_pt?: string | null;
  title_es?: string | null;
}): TranslatedSlugs => {
  const slugs: TranslatedSlugs = {};

  if (post.title_en) slugs.slug_en = generateSlug(post.title_en);
  if (post.title_de) slugs.slug_de = generateSlug(post.title_de);
  if (post.title_it) slugs.slug_it = generateSlug(post.title_it);
  if (post.title_pt) slugs.slug_pt = generateSlug(post.title_pt);
  if (post.title_es) slugs.slug_es = generateSlug(post.title_es);

  return slugs;
};

/**
 * Migrate all existing posts to generate missing translated slugs
 */
export const migrateAllPostSlugs = async () => {
  try {
    // Fetch all posts
    const { data: posts, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title_en, title_de, title_it, title_pt, title_es, slug, slug_en, slug_de, slug_it, slug_pt, slug_es');

    if (fetchError) throw fetchError;
    if (!posts) return { success: false, message: 'No posts found' };

    let updated = 0;
    let skipped = 0;

    // Update each post with generated slugs
    for (const post of posts) {
      const generatedSlugs = generateTranslatedSlugs(post);
      
      // Only update if there are new slugs to add
      const hasNewSlugs = Object.values(generatedSlugs).some(slug => slug);
      
      if (!hasNewSlugs) {
        skipped++;
        continue;
      }

      // Merge with existing slugs (don't overwrite if already set)
      const updatedSlugs = {
        slug_en: post.slug_en || generatedSlugs.slug_en,
        slug_de: post.slug_de || generatedSlugs.slug_de,
        slug_it: post.slug_it || generatedSlugs.slug_it || post.slug, // Fallback to main slug
        slug_pt: post.slug_pt || generatedSlugs.slug_pt,
        slug_es: post.slug_es || generatedSlugs.slug_es,
      };

      const { error: updateError } = await supabase
        .from('blog_posts')
        .update(updatedSlugs)
        .eq('id', post.id);

      if (updateError) {
        console.error(`Error updating post ${post.id}:`, updateError);
        continue;
      }

      updated++;
    }

    return {
      success: true,
      message: `Migration completed: ${updated} posts updated, ${skipped} skipped`,
      updated,
      skipped,
      total: posts.length,
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};
