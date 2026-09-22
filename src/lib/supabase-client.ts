// Cliente Supabase para uso no browser. Usa a chave publicável (anon),
// segura para expor — o acesso aos dados deve ser controlado via Row Level Security.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
