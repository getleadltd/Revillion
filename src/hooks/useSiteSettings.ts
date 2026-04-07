import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  category: string;
  updated_at: string;
}

export type SettingsMap = Record<string, string>;

/** Fetch all settings as a key→value map */
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async (): Promise<SiteSetting[]> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('category')
        .order('key');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

/** Returns settings as a simple key→value map */
export const useSettingsMap = (): SettingsMap => {
  const { data } = useSiteSettings();
  if (!data) return {};
  return Object.fromEntries(data.map(s => [s.key, s.value]));
};

/** Update a single setting value */
export const useUpdateSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};

/** Bulk update multiple settings at once */
export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: SettingsMap) => {
      const entries = Object.entries(updates);
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });
};
