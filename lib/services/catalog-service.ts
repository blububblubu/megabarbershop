import { cache } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Barber, GalleryItem, Service } from '@/types';

export const getActiveServices = cache(async (): Promise<Service[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as Service[];
  } catch {
    return [];
  }
});

export const getActiveBarbers = cache(async (): Promise<Barber[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as Barber[];
  } catch {
    return [];
  }
});

export const getGalleries = cache(async (): Promise<GalleryItem[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('galleries')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as GalleryItem[];
  } catch {
    return [];
  }
});
