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
          actions?: Array<{ id: string; type: string; actionWhen?: unknown; targetPageId?: string }>;
          items?: unknown[];
          relations?: Array<{ sourceId: string; targetId: string }>;
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
  for (const componentType of ["metricList", "tabs", "drawer", "modal", "timeline", "treeList"]) {
    assert.equal(components.some((component) => component.type === componentType), true, `missing component type ${componentType}`);
  }
  for (const componentType of [
    "editableTable",
    "treeTable",
    "comparisonTable",
    "kanbanBoard",
    "workflowDiagram",
    "wizard",
    "progressTracker",
    "resultPanel",
    "chart",
    "calendar",
    "gantt",
    "permissionMatrix",
    "ruleList",
    "checklist",
    "auditLog",
    "attachmentList",
    "commentThread",
    "orgChart",
    "collapsePanel",
    "relationGraph"
  ]) {
    assert.equal(components.some((component) => component.type === componentType), true, `missing component type ${componentType}`);
  }
  assert.equal(components.some((component) => component.relations && component.relations.length > 0), true);
  assert.equal(components.some((component) => component.actions?.some((action) => /batch/i.test(action.id) || /批量/.test(action.id))), true);
});

test("procurement example includes frontend and backend export samples", async () => {
  const samplePaths = [
    "plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md",
    "plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md"
  ] as const;

  for (const samplePath of samplePaths) {
    const text = await readFile(samplePath, "utf8");
    assert.match(text, /采购申请管理系统/);
    assert.match(text, /申请单列表/);
    assert.match(text, /创建申请/);
    assert.match(text, /审批详情/);
    assert.match(text, /供应商/);
    assert.match(text, /批量/);
    assert.match(text, /时间线/);
    assert.match(text, /树形|品类层级/);
    assert.match(text, /不要包含接口定义、数据库设计、技术架构、代码结构或任务拆分/);
  }

  const frontendText = await readFile(samplePaths[0], "utf8");
  assert.match(frontendText, /页面清单/);
  assert.match(frontendText, /页面流程/);
  assert.match(frontendText, /字段与交互规则/);
  assert.match(frontendText, /操作反馈/);
  assert.match(frontendText, /分组视图/);
  assert.match(frontendText, /抽屉/);
  assert.match(frontendText, /弹窗/);

  const backendText = await readFile(samplePaths[1], "utf8");
  assert.match(backendText, /业务对象与字段口径/);
  assert.match(backendText, /业务规则/);
  assert.match(backendText, /流程结果/);
  assert.match(backendText, /例外与备注/);
  assert.match(backendText, /驳回确认/);
  assert.match(backendText, /附件抽屉/);
});

function hasGroupedCondition(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as { visibleWhen?: unknown; enabledWhen?: unknown; requiredWhen?: unknown; actionWhen?: unknown };
  return [record.visibleWhen, record.enabledWhen, record.requiredWhen, record.actionWhen].some((condition) => {
    return Boolean(condition && typeof condition === "object" && (Array.isArray((condition as { all?: unknown }).all) || Array.isArray((condition as { any?: unknown }).any)));
  });
}
