
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anvdmcqszhmipbnxltsg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudmRtY3FzemhtaXBibnhsdHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTc2MTYsImV4cCI6MjA3NzQ5MzYxNn0.nlvH4jRWwimBi54PaHVA0BF4t0z_H_Z5y2IHw4s74-s';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);