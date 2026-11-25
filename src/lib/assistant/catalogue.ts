export type Product = { sku: string; name: string; description: string };
export type CatalogueMatch = Product & { source: string; imported: string };

export function inspectCatalogue(input: string): { products: Product[]; error?: never } | { error: string; products?: never } {
  if (input.length > 120000) return { error: "Use 120,000 characters or fewer." };
  const lines = input.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");
  if (lines.length > 250) return { error: "Import up to 250 products at once." };
  const seen = new Map<string, number>();
  const products: Product[] = [];
  for (const [index, line] of lines.entries()) {
    const cells = line.split("\t").map(cell => cell.trim());
    const row = index + 1;
    if (cells.length !== 3) return { error: `Row ${row} needs three tab-separated columns: SKU, name and description.` };
    const [sku, name, description] = cells;
    if (!sku || !name || !description) return { error: `Row ${row} has an empty field.` };
    if (sku.length > 80 || name.length > 200 || description.length > 1000) {
      return { error: `Row ${row} exceeds a field limit (SKU 80, name 200, description 1,000 characters).` };
    }
    if (line.includes("\0")) return { error: `Row ${row} contains an unsupported null character.` };
    const key = sku.toLowerCase();
    if (seen.has(key)) return { error: `Row ${row} repeats the SKU from row ${seen.get(key)}.` };
    seen.set(key, row);
    products.push({ sku, name, description });
  }
  return { products };
}

export function parseCatalogue(input: string) {
  return inspectCatalogue(input).products ?? null;
}

export function compareCatalogue(previous: Product[], next: Product[]) {
  const old = new Map(previous.map(item => [item.sku.toLowerCase(), item]));
  const added: Product[] = [];
  const changed: { before: Product; after: Product }[] = [];
  for (const item of next) {
    const key = item.sku.toLowerCase();
    const before = old.get(key);
    if (!before) added.push(item);
    else if (before.sku !== item.sku || before.name !== item.name || before.description !== item.description) changed.push({ before, after: item });
    old.delete(key);
  }
  return { added, changed, removed: [...old.values()] };
}
