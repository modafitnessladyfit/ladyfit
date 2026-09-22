// Cliente Supabase com a chave secreta — bypassa Row Level Security.
// USO EXCLUSIVO em server functions (createServerFn) ou rotas de servidor.
// Nunca importar este arquivo de código que roda no browser.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];

if (typeof window !== "undefined") {
  throw new Error("supabase-server.ts não pode ser importado no browser.");
}

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error(
    "Supabase: defina VITE_SUPABASE_URL e SUPABASE_SECRET_KEY no arquivo .env",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
