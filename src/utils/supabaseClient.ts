// src\utils\supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_KEY;

// Create a single shared client configuration
const clientOptions = {
  auth: {
    persistSession: false, // Disable Supabase's built-in auth persistence since we're using Clerk
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: undefined, // Disable storage to prevent GoTrueClient from trying to manage auth state
  },
  global: {
    headers: {
      apikey: supabaseAnonKey,
    },
  },
};

// Create a single instance of the base Supabase client
const baseClient = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// React Hook (to be used inside components)
export const useSupabaseClient = (): SupabaseClient => {
  const { getToken } = useAuth();

  return useMemo(() => {
    // Create a new client with auth headers
    return createClient(supabaseUrl, supabaseAnonKey, {
      ...clientOptions,
      global: {
        ...clientOptions.global,
        fetch: async (url, options = {}) => {
          const token = await getToken({ template: "supabase" });
          const headers = new Headers(options?.headers);

          // Always set these headers
          headers.set("apikey", supabaseAnonKey);
          headers.set("Content-Type", "application/json");

          if (token) {
            headers.set("Authorization", `Bearer ${token}`);
          }

          return fetch(url, {
            ...options,
            headers,
          });
        },
      },
    });
  }, [getToken]);
};

// Export the base client for non-component usage
export const getSupabaseClient = async (): Promise<SupabaseClient> => {
  return baseClient;
};

// import { createClient, SupabaseClient } from "@supabase/supabase-js";

// const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL;
// const supabaseKey: string = import.meta.env.VITE_SUPABASE_KEY;

// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
