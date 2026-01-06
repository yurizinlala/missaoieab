import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only create client if variables exist
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// Types for DB
export type Database = {
    public: {
        Tables: {
            app_state: {
                Row: {
                    id: number;
                    data: any; // JSONB
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    data: any;
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    data?: any;
                    updated_at?: string;
                };
            };
        };
    };
};
