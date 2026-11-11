import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  DEFAULT_OPERATING_HOURS,
  DEFAULT_SETTINGS,
  parseSettingsRows,
  type ParsedBusinessSettings,
} from '@/lib/utils/settings';

export {
  DEFAULT_OPERATING_HOURS,
  DEFAULT_SETTINGS,
  parseSettingsRows,
  type ParsedBusinessSettings,
};

export const getBusinessSettings = cache(
  async (): Promise<ParsedBusinessSettings> => {
    if (!isSupabaseConfigured()) {
      return DEFAULT_SETTINGS;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('settings').select('key, value');
      if (error || !data || data.length === 0) {
        return DEFAULT_SETTINGS;
      }
      return parseSettingsRows(data);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
);
