import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateSpec } from "../../src/core/validate.ts";

test("procurement example covers MVP schema capabilities", async () => {
  const raw = await readFile("plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json", "utf8");
  const spec = JSON.parse(raw) as {
    optionSets: Array<{ id: string }>;
    pages: Array<{
      nav?: { visible: boolean };
      sections: Array<{
        components: Array<{
          type: string;
          fields?: Array<{ type: string; visibleWhen?: unknown; requiredWhen?: unknown }>;
          columns?: Array<{ type: string; visibleWhen?: unknown; requiredWhen?: unknown }>;
          actions?: Array<{ actionWhen?: unknown; targetPageId?: string }>;
        }>;
      }>;
    }>;
  };

  const validation = validateSpec(spec);
  assert.equal(validation.ok, true);
  assert.equal(spec.pages.length, 5);
  assert.ok(spec.pages.filter((page) => page.nav?.visible).length >= 4);
  assert.deepEqual(
    spec.optionSets.map((optionSet) => optionSet.id).sort(),
    ["approvalStatus", "purchaseType", "supplierLevel"].sort()
  );

  const components = spec.pages.flatMap((page) => page.sections.flatMap((section) => section.components));
  const fieldTypes = new Set(components.flatMap((component) => [...(component.fields ?? []), ...(component.columns ?? [])].map((field) => field.type)));
  for (const fieldType of ["text", "textarea", "number", "currency", "date", "select", "radio", "file", "department", "user", "status", "tag"]) {
    assert.equal(fieldTypes.has(fieldType), true, `missing field type ${fieldType}`);
  }

  assert.equal(components.some((component) => component.type === "table"), true);
  assert.equal(components.some((component) => component.type === "steps"), true);
  assert.equal(components.some((component) => [...(component.fields ?? []), ...(component.columns ?? [])].some((field) => field.visibleWhen)), true);
  assert.equal(components.some((component) => [...(component.fields ?? []), ...(component.columns ?? [])].some((field) => field.requiredWhen)), true);
  assert.equal(components.some((component) => component.actions?.some((action) => action.actionWhen && action.targetPageId)), true);
});
