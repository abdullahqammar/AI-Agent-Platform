import assert from "node:assert/strict";
import test from "node:test";
import { parseCatalogue } from "../src/lib/assistant/catalogue.ts";

test("catalogue import preserves structured rows and tolerates Windows newlines", () => {
  assert.deepEqual(parseCatalogue("A1\t Oak Table \tSeats six\r\nB1\tChair\tBlue\r\n")?.map(p => p.name), ["Oak Table","Chair"]);
});

test("invalid or repeated SKUs reject the entire import", () => {
  for (const value of ["", "SKU\tOnly two", "A\tB\tC\na\tD\tE", "A\t \tC", "A\tB\tC\tD", "x".repeat(120001)]) {
    assert.equal(parseCatalogue(value), null);
  }
});
