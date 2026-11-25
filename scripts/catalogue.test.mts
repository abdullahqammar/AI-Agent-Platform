import assert from "node:assert/strict";
import test from "node:test";
import { compareCatalogue, inspectCatalogue, parseCatalogue } from "../src/lib/assistant/catalogue.ts";

test("catalogue import preserves structured rows and tolerates Windows newlines", () => {
  assert.deepEqual(parseCatalogue("A1\t Oak Table \tSeats six\r\nB1\tChair\tBlue\r\n")?.map(p => p.name), ["Oak Table","Chair"]);
});

test("invalid or repeated SKUs reject the entire import", () => {
  for (const value of ["", "SKU\tOnly two", "A\tB\tC\na\tD\tE", "A\t \tC", "A\tB\tC\tD", "A\tB\tC\0", "x".repeat(120001)]) {
    assert.equal(parseCatalogue(value), null);
  }
});

test("review identifies a malformed trailing column and the offending duplicate row", () => {
  assert.match(inspectCatalogue("S1\tName\tDescription\t").error ?? "", /Row 1 needs three/);
  assert.match(inspectCatalogue("S1\tA\tB\ns1\tC\tD").error ?? "", /Row 2 repeats the SKU from row 1/);
});

test("refresh compares by SKU regardless of row order and records prior field values", () => {
  const before = parseCatalogue("A\tDesk\tOak\nB\tChair\tBlue")!;
  assert.deepEqual(compareCatalogue(before, [...before].reverse()), {added: [], changed: [], removed: []});
  const next = parseCatalogue("C\tShelf\tTall\na\tDesk\tWalnut")!;
  assert.deepEqual(compareCatalogue(before, next), {
    added: [next[0]], changed: [{before: before[0], after: next[1]}], removed: [before[1]],
  });
});
