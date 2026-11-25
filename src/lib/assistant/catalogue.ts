import { z } from "zod";

const product = z.tuple([z.string().trim().min(1).max(80), z.string().trim().min(1).max(200), z.string().trim().min(1).max(1000)]);

export function parseCatalogue(input: string) {
  if (input.length > 120000) return null;
  const lines = input.replace(/\r\n/g, "\n").trimEnd().split("\n");
  if (!lines.length || lines.length > 250) return null;
  const seen = new Set<string>();
  const products = [];
  for (const line of lines) {
    const row = product.safeParse(line.split("\t"));
    if (!row.success) return null;
    const [sku, name, description] = row.data;
    if (seen.has(sku.toLowerCase())) return null;
    seen.add(sku.toLowerCase());
    products.push({ sku, name, description });
  }
  return products;
}

export type CatalogueMatch = { sku: string; name: string; description: string; source: string; imported: string };
