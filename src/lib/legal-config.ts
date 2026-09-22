// Dados reais do operador — usados para preencher os tokens dos textos
// jurídicos em src/content/legal. Nunca inventar valores aqui: um campo
// vazio/undefined faz o respectivo bloco condicional {{#token}}...{{/token}}
// desaparecer do texto renderizado.
export const legalConfig = {
  store_name: "Ladyfit",
  operator_name: "Ladyfit Portugal",
  operator_address: "Braga, Portugal",
  operator_tax_id: undefined as string | undefined,
  contact_email: "modafitnessladyfit@gmail.com",
  privacy_contact_email: "modafitnessladyfit@gmail.com",
  whatsapp_number: "+351 912 930 411",
  site_url: "ladyfitmodafitness.com",
  instagram_url: "https://www.instagram.com/modafitness_ladyfit/",
  adr_entity_name: undefined as string | undefined,
  adr_entity_url: undefined as string | undefined,
  adr_entity_address: undefined as string | undefined,
  adr_entity_phone: undefined as string | undefined,
  complaints_book_url: undefined as string | undefined,
};

export type LegalConfig = typeof legalConfig;
