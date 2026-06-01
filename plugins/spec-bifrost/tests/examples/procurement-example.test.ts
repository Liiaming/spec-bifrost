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
          fields?: Array<{ type: string; visibleWhen?: unknown; enabledWhen?: unknown; requiredWhen?: unknown }>;
          columns?: Array<{ type: string; visibleWhen?: unknown; enabledWhen?: unknown; requiredWhen?: unknown }>;
          actions?: Array<{ type: string; actionWhen?: unknown; targetPageId?: string }>;
          items?: unknown[];
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
  assert.equal(components.some((component) => [...(component.fields ?? []), ...(component.columns ?? [])].some((field) => field.enabledWhen)), true);
  assert.equal(components.some((component) => [...(component.fields ?? []), ...(component.columns ?? [])].some((field) => field.requiredWhen)), true);
  assert.equal(components.some((component) => component.actions?.some((action) => action.actionWhen && action.targetPageId)), true);
  assert.equal(components.some((component) => component.actions?.some((action) => action.type === "showMessage")), true);
  assert.equal(
    components.some((component) => [...(component.fields ?? []), ...(component.actions ?? [])].some((item) => hasGroupedCondition(item))),
    true
  );
  assert.equal(components.some((component) => component.type === "cardList" && (component.items?.length ?? 0) >= 2), true);
});

function hasGroupedCondition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as { visibleWhen?: unknown; enabledWhen?: unknown; requiredWhen?: unknown; actionWhen?: unknown };
  return [record.visibleWhen, record.enabledWhen, record.requiredWhen, record.actionWhen].some((condition) => {
    return Boolean(condition && typeof condition === "object" && (Array.isArray((condition as { all?: unknown }).all) || Array.isArray((condition as { any?: unknown }).any)));
  });
}
