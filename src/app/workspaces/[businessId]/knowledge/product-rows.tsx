"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { compareCatalogue, inspectCatalogue, type Product } from "@/lib/assistant/catalogue";

export function ProductRows({ previous }: { previous?: Product[] }) {
  const [input, setInput] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const { pending } = useFormStatus();
  const result = input ? inspectCatalogue(input) : undefined;
  const diff = result?.products && compareCatalogue(previous ?? [], result.products);
  const hasChanges = diff && (diff.added.length + diff.changed.length + diff.removed.length > 0);
  return <>
    <label>Product rows<textarea name="products" required rows={5} value={input}
      onChange={event => { setInput(event.target.value); setReviewed(false); }} aria-describedby="product-format product-feedback" /></label>
    <p id="product-format">Paste up to 250 spreadsheet rows with three columns in order: SKU, product name and description. Omit the header.</p>
    <p id="product-feedback" aria-live="polite">{result?.error ?? (diff
      ? previous ? `${diff.added.length} added · ${diff.changed.length} changed · ${diff.removed.length} removed`
      : `${diff.added.length} ${diff.added.length === 1 ? "product" : "products"} ready to import.` : "")}</p>
    {diff && hasChanges && <div className="catalogue-preview">
      <ul aria-label="Product changes">
        {diff.added.map(item => <li key={item.sku}><strong>{item.sku} · {item.name}</strong><p>{item.description}</p></li>)}
        {diff.changed.map(({ before, after }) => <li key={after.sku}><strong>{after.sku} · Updated</strong>
          <p>Previous: {before.name} · {before.description}</p><p>Replacement: {after.name} · {after.description}</p></li>)}
        {diff.removed.map(item => <li key={item.sku}><strong>{item.sku} · Removed</strong><p>{item.name} · {item.description}</p></li>)}
      </ul>
      {previous && <label><input name="reviewed" value="yes" type="checkbox" required checked={reviewed} onChange={e => setReviewed(e.target.checked)} /> Apply these changes to all assistants with catalogue access</label>}
    </div>}
    <button disabled={!hasChanges || pending || (!!previous && !reviewed)}>{previous ? "Apply refresh" : "Import products"}</button>
  </>;
}
