# Spec Bifrost v0.3 组件增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 20 B-end requirement-expression components to Spec Bifrost v0.3 with validation, preview rendering, examples, export guidance, docs, and tests.

**Architecture:** Keep `spec-bifrost.json` page-driven and semi-structured. Extend the shared component type list and add a small `relations` field for graph-like components, then render every new component with native HTML/CSS in the existing renderer without adding runtime dependencies.

**Tech Stack:** TypeScript, ES modules, NodeNext, Node built-in test runner, `tsx`, native HTML/CSS/JS renderer, Claude/Codex plugin manifests and skills.

---

## Source Spec

Design document:

```txt
docs/superpowers/specs/2026-06-05-spec-bifrost-v0.3-components-design.md
```

## File Structure

Modify these files:

- `plugins/spec-bifrost/src/core/types.ts`: Add `RelationSpec`, `ComponentSpec.relations`, and the 20 new `ComponentType` values.
- `plugins/spec-bifrost/src/core/constants.ts`: Add the 20 new component type constants.
- `plugins/spec-bifrost/src/core/validate.ts`: Validate `relations` shape and relation endpoint references.
- `plugins/spec-bifrost/src/renderer/renderHtml.ts`: Add semantic renderers and CSS for the 20 new components.
- `plugins/spec-bifrost/tests/core/validate.test.ts`: Cover new component acceptance and relation errors.
- `plugins/spec-bifrost/tests/renderer/render-html.test.ts`: Cover new renderer output classes and representative content.
- `plugins/spec-bifrost/tests/examples/procurement-example.test.ts`: Require the example to cover all v0.3 components and export facts.
- `plugins/spec-bifrost/tests/config/codex-plugin.test.ts`: Ensure plugin metadata and skill text mention the expanded component set.
- `plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json`: Enrich the existing procurement example with all 20 new components.
- `plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md`: Preserve new component facts in the frontend export sample.
- `plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md`: Preserve new component facts in the backend export sample.
- `plugins/spec-bifrost/examples/procurement-system/README.md`: Update example coverage.
- `plugins/spec-bifrost/skills/spec/schema.md`: Document the new component types and `relations`.
- `plugins/spec-bifrost/skills/export/SKILL.md`: Update export requirements for frontend/backend documents.
- `plugins/spec-bifrost/skills/spec/export.md`: Update shared export boundary text.
- `README.md`: Chinese public README component coverage.
- `README.en.md`: English public README component coverage.
- `plugins/spec-bifrost/README.md`: Plugin README component coverage.
- `plugins/spec-bifrost/CHANGELOG.md`: Add v0.3 entry after implementation.
- `docs/assets/spec-bifrost-preview.png`: Update screenshot after visible preview changes.

Do not create new runtime dependency files. Do not modify `plugins/spec-bifrost/dist` manually; rebuild it through `npm run build` or `npm run check`.

## Shared Constants

Use this component list in tests, docs, and implementation:

```ts
const V03_COMPONENT_TYPES = [
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
] as const;
```

---

### Task 1: Core Types And Relation Validation

**Files:**

- Modify: `plugins/spec-bifrost/tests/core/validate.test.ts`
- Modify: `plugins/spec-bifrost/src/core/types.ts`
- Modify: `plugins/spec-bifrost/src/core/constants.ts`
- Modify: `plugins/spec-bifrost/src/core/validate.ts`

- [ ] **Step 1: Write failing validation tests**

In `plugins/spec-bifrost/tests/core/validate.test.ts`, change the existing unsupported component test so it no longer uses `chart`, because `chart` becomes supported:

```ts
test("unsupported component type fails with facts only", () => {
  const spec = validSpec();
  const component = spec.pages[0]!.sections[0]!.components[0]! as unknown as Record<string, unknown>;
  component["type"] = "unsupportedWidget";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "schema_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections[0].components[0].type");
  assert.match(result.errors[0]?.message ?? "", /Unsupported component type/);
  assert.equal("suggestion" in (result.errors[0] as object), false);
});
```

Add this test after `requirement expressiveness components pass validation`:

```ts
test("v0.3 requirement components and relations pass validation", () => {
  const componentTypes = [
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
  ];
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;

  componentTypes.forEach((componentType, index) => {
    components.push({
      id: `${componentType}Demo`,
      type: componentType,
      title: `${componentType} 示例`,
      columns: [{ id: `${componentType}Name`, label: "名称", type: "text" }],
      items: [
        { id: `${componentType}-a`, title: "节点 A", value: "12" },
        { id: `${componentType}-b`, title: "节点 B", value: "8" }
      ],
      relations: index % 2 === 0 ? [{ sourceId: `${componentType}-a`, targetId: `${componentType}-b`, label: "流转" }] : undefined
    });
  });

  const result = validateSpec(spec);

  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});
```

Add this relation shape test:

```ts
test("component relations must be valid objects with string endpoints", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  components.push({
    id: "workflow",
    type: "workflowDiagram",
    items: [{ id: "draft", title: "草稿" }, { id: "submitted", title: "已提交" }],
    relations: [null, { sourceId: "", targetId: 100, label: false, type: 12, notes: [false] }]
  });

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[1].relations[0]",
      "pages[0].sections[0].components[1].relations[1].sourceId",
      "pages[0].sections[0].components[1].relations[1].targetId",
      "pages[0].sections[0].components[1].relations[1].label",
      "pages[0].sections[0].components[1].relations[1].type",
      "pages[0].sections[0].components[1].relations[1].notes"
    ]
  );
});
```

Add this relation reference test:

```ts
test("component relations must reference item ids from the same component", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  components.push({
    id: "workflow",
    type: "workflowDiagram",
    items: [{ id: "draft", title: "草稿" }, { id: "submitted", title: "已提交" }],
    relations: [
      { sourceId: "draft", targetId: "missingTarget", label: "提交" },
      { sourceId: "missingSource", targetId: "submitted", label: "退回" }
    ]
  });

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[1].relations[0].targetId",
      "pages[0].sections[0].components[1].relations[1].sourceId"
    ]
  );
  assert.equal(result.errors[0]?.type, "reference_error");
});
```

Also update the malformed component arrays test to set `relations` and expect the new path:

```ts
components[0]!["relations"] = "not-an-array";
```

Expected paths in that test become:

```ts
[
  "pages[0].sections[0].components[0].fields",
  "pages[0].sections[0].components[0].columns",
  "pages[0].sections[0].components[0].actions",
  "pages[0].sections[0].components[0].items",
  "pages[0].sections[0].components[0].relations"
]
```

- [ ] **Step 2: Run core tests and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/core/validate.test.ts
```

Expected: fail because `chart` and the other v0.3 components are unsupported, and `relations` is not validated.

- [ ] **Step 3: Extend core types**

In `plugins/spec-bifrost/src/core/types.ts`, update `ComponentSpec`:

```ts
export interface ComponentSpec {
  id: string;
  type: ComponentType;
  title?: string;
  fields?: FieldSpec[];
  columns?: FieldSpec[];
  actions?: ActionSpec[];
  items?: unknown[];
  relations?: RelationSpec[];
  emptyState?: EmptyStateSpec;
  notes?: Notes;
}
```

Add this interface after `EmptyStateSpec`:

```ts
export interface RelationSpec {
  sourceId: string;
  targetId: string;
  label?: string;
  type?: string;
  notes?: Notes;
}
```

Append the v0.3 types to `ComponentType`:

```ts
  | "editableTable"
  | "treeTable"
  | "comparisonTable"
  | "kanbanBoard"
  | "workflowDiagram"
  | "wizard"
  | "progressTracker"
  | "resultPanel"
  | "chart"
  | "calendar"
  | "gantt"
  | "permissionMatrix"
  | "ruleList"
  | "checklist"
  | "auditLog"
  | "attachmentList"
  | "commentThread"
  | "orgChart"
  | "collapsePanel"
  | "relationGraph";
```

- [ ] **Step 4: Extend supported component constants**

In `plugins/spec-bifrost/src/core/constants.ts`, append these values to `SUPPORTED_COMPONENT_TYPES`:

```ts
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
```

- [ ] **Step 5: Validate relation shape**

In `plugins/spec-bifrost/src/core/validate.ts`, call relation validation inside `validateComponent` after `items`:

```ts
  validateOptionalArray(component.relations, `${path}.relations`, "relations", errors, componentContext)?.forEach((relation, relationIndex) =>
    validateRelation(relation, `${path}.relations[${relationIndex}]`, errors, componentContext)
  );
```

Add this function near `validateAction`:

```ts
function validateRelation(relation: unknown, path: string, errors: SpecDiagnostic[], componentContext: string | undefined): void {
  if (!isRecord(relation)) {
    errors.push(error("schema_error", path, "relation must be an object.", relation, componentContext));
    return;
  }
  requireString(relation["sourceId"], `${path}.sourceId`, errors, componentContext);
  requireString(relation["targetId"], `${path}.targetId`, errors, componentContext);
  validateOptionalString(relation["label"], `${path}.label`, errors, componentContext);
  validateOptionalString(relation["type"], `${path}.type`, errors, componentContext);
  validateNotes(relation["notes"], `${path}.notes`, errors, componentContext);
}
```

- [ ] **Step 6: Validate relation references**

Inside `validateReferences`, after action reference validation for each component, call:

```ts
        validateRelationReferences(component["relations"], `${componentPath}.relations`, component["items"], errors, componentContext);
```

Add these helper functions near `validateConditionReferences`:

```ts
function validateRelationReferences(
  relations: unknown,
  path: string,
  items: unknown,
  errors: SpecDiagnostic[],
  context?: string
): void {
  if (!Array.isArray(relations)) return;
  const itemIds = collectItemIds(items);
  relations.forEach((relation, relationIndex) => {
    if (!isRecord(relation)) return;
    const sourceId = relation["sourceId"];
    const targetId = relation["targetId"];
    if (typeof sourceId === "string" && sourceId.length > 0 && !itemIds.has(sourceId)) {
      errors.push(error("reference_error", `${path}[${relationIndex}].sourceId`, `sourceId "${sourceId}" does not match any item id in the component.`, sourceId, context));
    }
    if (typeof targetId === "string" && targetId.length > 0 && !itemIds.has(targetId)) {
      errors.push(error("reference_error", `${path}[${relationIndex}].targetId`, `targetId "${targetId}" does not match any item id in the component.`, targetId, context));
    }
  });
}

function collectItemIds(items: unknown): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(items)) return ids;
  collectItemIdsRecursive(items, ids);
  return ids;
}

function collectItemIdsRecursive(items: unknown[], ids: Set<string>): void {
  items.filter(isRecord).forEach((item) => {
    if (typeof item["id"] === "string" && item["id"].length > 0) ids.add(item["id"]);
    if (Array.isArray(item["children"])) collectItemIdsRecursive(item["children"], ids);
  });
}
```

- [ ] **Step 7: Run core tests and typecheck**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/core/validate.test.ts
npm run typecheck
```

Expected: both pass.

- [ ] **Step 8: Commit core schema work**

```bash
git add plugins/spec-bifrost/src/core/types.ts plugins/spec-bifrost/src/core/constants.ts plugins/spec-bifrost/src/core/validate.ts plugins/spec-bifrost/tests/core/validate.test.ts
git commit -m "feat(core): 支持 v0.3 需求组件校验"
```

---

### Task 2: Renderer Data And Table Components

**Files:**

- Modify: `plugins/spec-bifrost/tests/renderer/render-html.test.ts`
- Modify: `plugins/spec-bifrost/src/renderer/renderHtml.ts`

Components: `editableTable`, `treeTable`, `comparisonTable`.

- [ ] **Step 1: Write failing renderer test**

Add this test to `plugins/spec-bifrost/tests/renderer/render-html.test.ts`:

```ts
test("renderPrototypeHtml renders v0.3 data table components", () => {
  const spec = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试系统", actors: ["申请人"] },
    pages: [
      {
        id: "detail",
        title: "采购详情",
        purpose: "查看明细和对比",
        route: "/detail",
        type: "detail",
        sections: [
          {
            id: "tables",
            components: [
              {
                id: "lineItems",
                type: "editableTable",
                title: "采购明细",
                columns: [
                  { id: "itemName", label: "物品名称", type: "text" },
                  { id: "quantity", label: "数量", type: "number" },
                  { id: "amount", label: "金额", type: "currency" }
                ],
                items: [{ itemName: "显示器", quantity: 2, amount: "¥3,200.00" }],
                actions: [{ id: "addLine", type: "showMessage", label: "新增明细", message: "已新增明细行" }]
              },
              {
                id: "categoryBudget",
                type: "treeTable",
                title: "类目预算",
                columns: [
                  { id: "name", label: "名称", type: "text" },
                  { id: "budget", label: "预算", type: "currency" }
                ],
                items: [{ name: "办公用品", budget: "¥20,000.00", children: [{ name: "显示器", budget: "¥8,000.00" }] }]
              },
              {
                id: "supplierComparison",
                type: "comparisonTable",
                title: "供应商对比",
                columns: [
                  { id: "metric", label: "对比项", type: "text" },
                  { id: "supplierA", label: "供应商 A", type: "text" },
                  { id: "supplierB", label: "供应商 B", type: "text" }
                ],
                items: [{ metric: "报价", supplierA: "¥12,800.00", supplierB: "¥13,500.00", recommended: "supplierA" }]
              }
            ]
          }
        ]
      }
    ]
  } as SpecBifrostDocument;

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /class="editable-table-shell"/);
  assert.match(html, /新增明细/);
  assert.match(html, /class="tree-table-shell"/);
  assert.match(html, /tree-cell/);
  assert.match(html, /办公用品/);
  assert.match(html, /class="comparison-table-shell"/);
  assert.match(html, /供应商 A/);
  assert.doesNotMatch(html, /暂无内容配置/);
});
```

- [ ] **Step 2: Run renderer test and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: fail because the new class names do not exist.

- [ ] **Step 3: Add switch cases**

In `renderComponent`, add:

```ts
    case "editableTable":
      return renderEditableTable(component, context);
    case "treeTable":
      return renderTreeTable(component, context);
    case "comparisonTable":
      return renderComparisonTable(component, context);
```

- [ ] **Step 4: Add table renderers**

Add these functions near `renderTable`:

```ts
function renderEditableTable(component: ComponentSpec, context: RenderContext): string {
  const columns = component.columns ?? component.fields ?? [];
  return `
    <div class="editable-table-shell">
      <div class="table-toolbar">
        <div class="table-title-stack">
          ${renderComponentTitle(component)}
          <span class="table-summary">可编辑明细 · ${columns.length} 个字段 · ${normalizeRecords(component.items).length || 1} 条示例数据</span>
        </div>
        ${component.actions?.length ? `<div class="table-actions">${component.actions.map((action) => renderActionButton(action, "primary")).join("")}</div>` : ""}
      </div>
      <table class="data-table editable-table">
        <thead><tr><th>行</th>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
        <tbody>${renderEditableTableRows(component, columns, context)}</tbody>
      </table>
      ${columns.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无明细字段" }) : ""}
    </div>
  `;
}

function renderEditableTableRows(component: ComponentSpec, columns: FieldSpec[], context: RenderContext): string {
  if (columns.length === 0) return "";
  const rows = normalizeRecords(component.items);
  const records = rows.length > 0 ? rows : [sampleRecord(columns, 0, context)];
  return records
    .slice(0, 4)
    .map(
      (record, index) => `
        <tr>
          <td class="row-index">${index + 1}</td>
          ${columns.map((column) => `<td><span class="editable-cell">${renderTableCell(record[column.id], column, context)}</span></td>`).join("")}
        </tr>
      `
    )
    .join("");
}

function renderTreeTable(component: ComponentSpec, context: RenderContext): string {
  const columns = component.columns ?? component.fields ?? [];
  const records = normalizeRecords(component.items);
  return `
    <div class="tree-table-shell">
      ${renderComponentTitle(component)}
      <table class="data-table tree-table">
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
        <tbody>${records.length > 0 && columns.length > 0 ? renderTreeTableRows(records, columns, context) : ""}</tbody>
      </table>
      ${records.length === 0 || columns.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无层级表格数据" }) : ""}
    </div>
  `;
}

function renderTreeTableRows(records: Array<Record<string, unknown>>, columns: FieldSpec[], context: RenderContext, depth = 0): string {
  return records
    .map((record) => {
      const children = normalizeRecords(Array.isArray(record.children) ? record.children : undefined);
      return `
        <tr>
          ${columns
            .map((column, index) => `<td class="${index === 0 ? "tree-cell" : ""}" style="${index === 0 ? `--tree-depth:${depth}` : ""}">${renderTableCell(record[column.id], column, context)}</td>`)
            .join("")}
        </tr>
        ${children.length > 0 ? renderTreeTableRows(children, columns, context, depth + 1) : ""}
      `;
    })
    .join("");
}

function renderComparisonTable(component: ComponentSpec, context: RenderContext): string {
  const columns = component.columns ?? [];
  const records = normalizeRecords(component.items);
  return `
    <div class="comparison-table-shell">
      ${renderComponentTitle(component)}
      <table class="data-table comparison-table">
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead>
        <tbody>${records.map((record) => `<tr>${columns.map((column) => `<td>${renderTableCell(record[column.id], column, context)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      ${records.length === 0 || columns.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无对比数据" }) : ""}
    </div>
  `;
}
```

- [ ] **Step 5: Add CSS for data table components**

Inside `styles()`, near existing table styles, add:

```css
.editable-table-shell, .tree-table-shell, .comparison-table-shell {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.editable-cell {
  display: inline-flex;
  min-width: 92px;
  min-height: 30px;
  align-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  padding: 4px 8px;
  background: #ffffff;
}
.row-index {
  width: 54px;
  color: var(--muted);
  font-size: 12px;
}
.tree-cell {
  padding-left: calc(14px + var(--tree-depth, 0) * 22px) !important;
  font-weight: 650;
}
.tree-cell::before {
  content: "";
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-left: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
}
.comparison-table th:not(:first-child), .comparison-table td:not(:first-child) {
  text-align: center;
}
```

- [ ] **Step 6: Run renderer test**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit data/table renderer work**

```bash
git add plugins/spec-bifrost/src/renderer/renderHtml.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
git commit -m "feat(renderer): 渲染 v0.3 表格类组件"
```

---

### Task 3: Renderer Flow And State Components

**Files:**

- Modify: `plugins/spec-bifrost/tests/renderer/render-html.test.ts`
- Modify: `plugins/spec-bifrost/src/renderer/renderHtml.ts`

Components: `kanbanBoard`, `workflowDiagram`, `wizard`, `progressTracker`, `resultPanel`.

- [ ] **Step 1: Write failing renderer test**

Add this test:

```ts
test("renderPrototypeHtml renders v0.3 flow and state components", () => {
  const spec = {
    schemaVersion: "1.0",
    project: { name: "采购流程", description: "测试系统", actors: ["审批人"] },
    pages: [
      {
        id: "flow",
        title: "流程工作台",
        purpose: "查看流程状态",
        route: "/flow",
        type: "approval",
        sections: [
          {
            id: "flowComponents",
            components: [
              {
                id: "approvalKanban",
                type: "kanbanBoard",
                title: "审批看板",
                items: [{ title: "待审批", children: [{ title: "REQ-001", description: "行政部采购" }] }]
              },
              {
                id: "approvalWorkflow",
                type: "workflowDiagram",
                title: "审批流",
                items: [{ id: "draft", title: "草稿" }, { id: "submitted", title: "已提交" }],
                relations: [{ sourceId: "draft", targetId: "submitted", label: "提交" }]
              },
              {
                id: "createWizard",
                type: "wizard",
                title: "创建向导",
                items: [{ title: "填写基础信息", description: "申请标题和金额" }, { title: "确认附件", description: "上传合同" }]
              },
              {
                id: "deliveryProgress",
                type: "progressTracker",
                title: "交付进度",
                items: [{ label: "资料补齐", value: 60, description: "还缺合同扫描件" }]
              },
              {
                id: "submitResult",
                type: "resultPanel",
                title: "提交结果",
                emptyState: { title: "提交成功", description: "采购申请已进入审批流程" },
                actions: [{ id: "backList", type: "navigate", label: "返回列表", targetPageId: "flow" }]
              }
            ]
          }
        ]
      }
    ]
  } as SpecBifrostDocument;

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /class="kanban-board"/);
  assert.match(html, /REQ-001/);
  assert.match(html, /class="workflow-diagram"/);
  assert.match(html, /提交/);
  assert.match(html, /class="wizard-preview"/);
  assert.match(html, /填写基础信息/);
  assert.match(html, /class="progress-tracker"/);
  assert.match(html, /资料补齐/);
  assert.match(html, /class="result-panel"/);
  assert.match(html, /提交成功/);
});
```

- [ ] **Step 2: Run renderer test and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: fail because flow/state class names are not rendered.

- [ ] **Step 3: Add switch cases**

Add these cases:

```ts
    case "kanbanBoard":
      return renderKanbanBoard(component);
    case "workflowDiagram":
      return renderWorkflowDiagram(component);
    case "wizard":
      return renderWizard(component);
    case "progressTracker":
      return renderProgressTracker(component);
    case "resultPanel":
      return renderResultPanel(component);
```

- [ ] **Step 4: Add flow renderers**

Add these functions near `renderTimeline`:

```ts
function renderKanbanBoard(component: ComponentSpec): string {
  const columns = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="kanban-board">
      ${columns
        .map((column) => {
          const cards = normalizeRecords(Array.isArray(column.children) ? column.children : undefined);
          return `<section class="kanban-column"><h4>${escapeHtml(column.title ?? column.label ?? "状态")}</h4>${cards
            .map((card) => `<article class="kanban-card"><strong>${escapeHtml(card.title ?? card.label ?? "卡片")}</strong>${card.description ? `<p>${escapeHtml(card.description)}</p>` : ""}</article>`)
            .join("")}</section>`;
        })
        .join("")}
    </div>
    ${columns.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无看板数据" }) : ""}
  `;
}

function renderWorkflowDiagram(component: ComponentSpec): string {
  const nodes = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="workflow-diagram">
      <div class="workflow-nodes">${nodes.map((node, index) => `<div class="workflow-node"><span>${index + 1}</span><strong>${escapeHtml(node.title ?? node.label ?? node.id ?? "节点")}</strong>${node.description ? `<p>${escapeHtml(node.description)}</p>` : ""}</div>`).join("")}</div>
      ${renderRelationList(component)}
    </div>
    ${nodes.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无流程节点" }) : ""}
  `;
}

function renderWizard(component: ComponentSpec): string {
  const steps = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="wizard-preview">
      <ol>${steps.map((step, index) => `<li class="${index === 0 ? "active" : ""}"><span>${index + 1}</span><strong>${escapeHtml(step.title ?? step.label ?? `步骤 ${index + 1}`)}</strong>${step.description ? `<p>${escapeHtml(step.description)}</p>` : ""}</li>`).join("")}</ol>
    </div>
    ${steps.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无向导步骤" }) : ""}
  `;
}

function renderProgressTracker(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="progress-tracker">
      ${records.map((record) => `<div class="progress-row"><div><strong>${escapeHtml(record.label ?? record.title ?? "进度")}</strong>${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</div>${renderProgressBar(record.value)}</div>`).join("")}
    </div>
    ${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无进度数据" }) : ""}
  `;
}

function renderResultPanel(component: ComponentSpec): string {
  return `
    <div class="result-panel">
      ${renderComponentTitle(component)}
      ${renderEmptyState(component.emptyState ?? { title: "处理完成" })}
      ${renderActionBar(component.actions)}
    </div>
  `;
}
```

Add these helpers near `renderNotesBlock`:

```ts
function renderRelationList(component: ComponentSpec): string {
  if (!component.relations || component.relations.length === 0) return "";
  return `<ol class="relation-list">${component.relations.map((relation) => `<li><span>${escapeHtml(relation.sourceId)}</span><strong>${escapeHtml(relation.label ?? relation.type ?? "关联")}</strong><span>${escapeHtml(relation.targetId)}</span>${renderNotes(relation.notes)}</li>`).join("")}</ol>`;
}

function renderProgressBar(value: unknown): string {
  const numericValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `<div class="progress-bar" aria-label="完成度 ${numericValue}%"><span style="width:${numericValue}%"></span><em>${numericValue}%</em></div>`;
}
```

- [ ] **Step 5: Add CSS for flow components**

Add:

```css
.kanban-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.kanban-column { border: 1px solid var(--line); border-radius: 8px; background: var(--panel); padding: 12px; box-shadow: var(--shadow); }
.kanban-column h4 { margin: 0 0 10px; color: #334155; font-size: 13px; }
.kanban-card { border: 1px solid var(--line); border-radius: 8px; background: var(--panel-soft); padding: 10px; margin-bottom: 8px; }
.kanban-card p { margin: 4px 0 0; font-size: 12px; }
.workflow-diagram, .wizard-preview, .progress-tracker, .result-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.workflow-nodes { display: flex; flex-wrap: wrap; gap: 10px; }
.workflow-node { min-width: 150px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel-soft); padding: 10px; }
.workflow-node span, .wizard-preview li > span { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-weight: 650; }
.relation-list { margin: 12px 0 0; padding-left: 20px; color: var(--muted); }
.relation-list li { margin-top: 6px; }
.relation-list strong { margin: 0 8px; color: #334155; }
.wizard-preview ol { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.wizard-preview li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; border: 1px solid var(--line); border-radius: 8px; padding: 10px; }
.wizard-preview li.active { border-color: rgba(37, 99, 235, 0.32); background: var(--accent-tint); }
.progress-row { display: grid; grid-template-columns: minmax(160px, 1fr) minmax(180px, 320px); gap: 14px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); }
.progress-row:last-child { border-bottom: 0; }
.progress-bar { position: relative; height: 10px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.progress-bar span { display: block; height: 100%; border-radius: inherit; background: var(--accent); }
.progress-bar em { position: absolute; right: 0; top: -22px; color: var(--muted); font-size: 12px; font-style: normal; }
.result-panel { border-color: rgba(4, 120, 87, 0.22); background: var(--success-soft); }
```

- [ ] **Step 6: Run renderer test**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit flow/state renderer work**

```bash
git add plugins/spec-bifrost/src/renderer/renderHtml.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
git commit -m "feat(renderer): 渲染 v0.3 流程状态组件"
```

---

### Task 4: Renderer Plan And Visualization Components

**Files:**

- Modify: `plugins/spec-bifrost/tests/renderer/render-html.test.ts`
- Modify: `plugins/spec-bifrost/src/renderer/renderHtml.ts`

Components: `chart`, `calendar`, `gantt`.

- [ ] **Step 1: Write failing renderer test**

Add:

```ts
test("renderPrototypeHtml renders v0.3 planning and visualization components", () => {
  const spec = {
    schemaVersion: "1.0",
    project: { name: "采购计划", description: "测试系统", actors: ["采购专员"] },
    pages: [
      {
        id: "plan",
        title: "计划看板",
        purpose: "查看预算和交付计划",
        route: "/plan",
        type: "reference",
        sections: [
          {
            id: "visual",
            components: [
              {
                id: "budgetChart",
                type: "chart",
                title: "预算占用",
                items: [{ label: "办公用品", value: 68 }, { label: "IT 设备", value: 32 }]
              },
              {
                id: "deliveryCalendar",
                type: "calendar",
                title: "交付日历",
                items: [{ date: "2026-06-12", title: "供应商交付", status: "待确认" }]
              },
              {
                id: "deliveryGantt",
                type: "gantt",
                title: "交付排期",
                items: [{ id: "contract", title: "合同确认", startDate: "2026-06-01", endDate: "2026-06-05" }, { id: "delivery", title: "设备交付", startDate: "2026-06-06", endDate: "2026-06-12" }],
                relations: [{ sourceId: "contract", targetId: "delivery", label: "完成后开始" }]
              }
            ]
          }
        ]
      }
    ]
  } as SpecBifrostDocument;

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /class="chart-preview"/);
  assert.match(html, /办公用品/);
  assert.match(html, /class="calendar-preview"/);
  assert.match(html, /2026-06-12/);
  assert.match(html, /class="gantt-preview"/);
  assert.match(html, /合同确认/);
});
```

- [ ] **Step 2: Run renderer test and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: fail because visualization classes are absent.

- [ ] **Step 3: Add switch cases**

Add:

```ts
    case "chart":
      return renderChart(component);
    case "calendar":
      return renderCalendar(component);
    case "gantt":
      return renderGantt(component);
```

- [ ] **Step 4: Add visualization renderers**

Add:

```ts
function renderChart(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  const maxValue = Math.max(1, ...records.map((record) => (typeof record.value === "number" ? record.value : Number(record.value) || 0)));
  return `
    ${renderComponentTitle(component)}
    <div class="chart-preview">
      ${records.map((record) => {
        const value = typeof record.value === "number" ? record.value : Number(record.value) || 0;
        return `<div class="chart-row"><span>${escapeHtml(record.label ?? record.title ?? "分类")}</span><div><i style="width:${Math.round((value / maxValue) * 100)}%"></i></div><strong>${escapeHtml(record.value ?? "-")}</strong></div>`;
      }).join("")}
    </div>
    ${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无图表数据" }) : ""}
  `;
}

function renderCalendar(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="calendar-preview">
      ${records.map((record) => `<article><time>${escapeHtml(record.date ?? record.startDate ?? "")}</time><strong>${escapeHtml(record.title ?? record.label ?? "日程")}</strong>${record.status ? `<span class="status-tag">${escapeHtml(record.status)}</span>` : ""}${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</article>`).join("")}
    </div>
    ${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无日程" }) : ""}
  `;
}

function renderGantt(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `
    ${renderComponentTitle(component)}
    <div class="gantt-preview">
      ${records.map((record, index) => `<div class="gantt-row"><span>${escapeHtml(record.title ?? record.label ?? `任务 ${index + 1}`)}</span><div><i style="margin-left:${Math.min(index * 8, 40)}%;width:${Math.max(22, 48 - index * 4)}%"></i></div><time>${escapeHtml(record.startDate ?? "")} - ${escapeHtml(record.endDate ?? "")}</time></div>`).join("")}
      ${renderRelationList(component)}
    </div>
    ${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无排期任务" }) : ""}
  `;
}
```

- [ ] **Step 5: Add CSS for visualization components**

Add:

```css
.chart-preview, .calendar-preview, .gantt-preview {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.chart-row { display: grid; grid-template-columns: 120px 1fr 72px; gap: 12px; align-items: center; padding: 8px 0; }
.chart-row div { height: 12px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.chart-row i { display: block; height: 100%; border-radius: inherit; background: var(--accent); }
.chart-row strong { text-align: right; font-variant-numeric: tabular-nums; }
.calendar-preview { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.calendar-preview article { border: 1px solid var(--line); border-radius: 8px; background: var(--panel-soft); padding: 10px; }
.calendar-preview time { display: block; color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.gantt-row { display: grid; grid-template-columns: 150px 1fr 180px; gap: 12px; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--line); }
.gantt-row:last-child { border-bottom: 0; }
.gantt-row div { height: 18px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
.gantt-row i { display: block; height: 100%; border-radius: inherit; background: rgba(37, 99, 235, 0.76); }
.gantt-row time { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 6: Run renderer test**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit visualization renderer work**

```bash
git add plugins/spec-bifrost/src/renderer/renderHtml.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
git commit -m "feat(renderer): 渲染 v0.3 计划可视化组件"
```

---

### Task 5: Renderer Governance Collaboration And Structure Components

**Files:**

- Modify: `plugins/spec-bifrost/tests/renderer/render-html.test.ts`
- Modify: `plugins/spec-bifrost/src/renderer/renderHtml.ts`

Components: `permissionMatrix`, `ruleList`, `checklist`, `auditLog`, `attachmentList`, `commentThread`, `orgChart`, `collapsePanel`, `relationGraph`.

- [ ] **Step 1: Write failing renderer test**

Add a compact test using one page and all nine components:

```ts
test("renderPrototypeHtml renders v0.3 governance collaboration and structure components", () => {
  const spec = {
    schemaVersion: "1.0",
    project: { name: "采购治理", description: "测试系统", actors: ["管理员"] },
    pages: [
      {
        id: "governance",
        title: "治理工作台",
        purpose: "查看权限、规则和协作记录",
        route: "/governance",
        type: "reference",
        sections: [
          {
            id: "components",
            components: [
              { id: "permissions", type: "permissionMatrix", title: "权限矩阵", columns: [{ id: "role", label: "角色", type: "text" }, { id: "approve", label: "审批", type: "status" }], items: [{ role: "部门负责人", approve: "允许" }] },
              { id: "rules", type: "ruleList", title: "业务规则", items: [{ title: "金额超过 50000 元必须进入大额审批" }] },
              { id: "materials", type: "checklist", title: "资料清单", items: [{ title: "合同扫描件", required: true, status: "必填" }] },
              { id: "logs", type: "auditLog", title: "审计日志", columns: [{ id: "time", label: "时间", type: "text" }, { id: "event", label: "事件", type: "text" }], items: [{ time: "2026-06-01 10:00", event: "提交审批" }] },
              { id: "attachments", type: "attachmentList", title: "附件列表", items: [{ title: "合同.pdf", status: "已上传", description: "供应商合同" }] },
              { id: "comments", type: "commentThread", title: "审批意见", items: [{ author: "张三", time: "2026-06-01 11:00", content: "预算归属已确认" }] },
              { id: "org", type: "orgChart", title: "审批组织", items: [{ id: "dept", title: "部门负责人", children: [{ id: "finance", title: "财务审批" }] }] },
              { id: "panels", type: "collapsePanel", title: "折叠信息", items: [{ title: "财务信息", description: "预算、科目和付款方式" }] },
              { id: "relations", type: "relationGraph", title: "关联单据", items: [{ id: "request", title: "采购申请" }, { id: "contract", title: "合同" }], relations: [{ sourceId: "request", targetId: "contract", label: "生成" }] }
            ]
          }
        ]
      }
    ]
  } as SpecBifrostDocument;

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /class="permission-matrix-shell"/);
  assert.match(html, /部门负责人/);
  assert.match(html, /class="rule-list-preview"/);
  assert.match(html, /50000/);
  assert.match(html, /class="checklist-preview"/);
  assert.match(html, /合同扫描件/);
  assert.match(html, /class="audit-log-shell"/);
  assert.match(html, /提交审批/);
  assert.match(html, /class="attachment-list-preview"/);
  assert.match(html, /合同\.pdf/);
  assert.match(html, /class="comment-thread-preview"/);
  assert.match(html, /预算归属已确认/);
  assert.match(html, /class="org-chart-preview"/);
  assert.match(html, /财务审批/);
  assert.match(html, /class="collapse-panel-preview"/);
  assert.match(html, /财务信息/);
  assert.match(html, /class="relation-graph-preview"/);
  assert.match(html, /生成/);
});
```

- [ ] **Step 2: Run renderer test and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: fail because governance/collaboration class names are absent.

- [ ] **Step 3: Add switch cases**

Add:

```ts
    case "permissionMatrix":
      return renderPermissionMatrix(component, context);
    case "ruleList":
      return renderRuleList(component);
    case "checklist":
      return renderChecklist(component);
    case "auditLog":
      return renderAuditLog(component, context);
    case "attachmentList":
      return renderAttachmentList(component);
    case "commentThread":
      return renderCommentThread(component);
    case "orgChart":
      return renderOrgChart(component);
    case "collapsePanel":
      return renderCollapsePanel(component);
    case "relationGraph":
      return renderRelationGraph(component);
```

- [ ] **Step 4: Add governance renderers**

Add these functions near `renderTreeList` and `renderCardList`:

```ts
function renderPermissionMatrix(component: ComponentSpec, context: RenderContext): string {
  return `<div class="permission-matrix-shell">${renderComponentTitle(component)}${renderTableBodyOnly(component, context, "暂无权限矩阵")}</div>`;
}

function renderAuditLog(component: ComponentSpec, context: RenderContext): string {
  return `<div class="audit-log-shell">${renderComponentTitle(component)}${renderTableBodyOnly(component, context, "暂无审计记录")}</div>`;
}

function renderTableBodyOnly(component: ComponentSpec, context: RenderContext, emptyTitle: string): string {
  const columns = component.columns ?? component.fields ?? [];
  const records = normalizeRecords(component.items);
  if (columns.length === 0 || records.length === 0) return renderEmptyState(component.emptyState ?? { title: emptyTitle });
  return `<table class="data-table"><thead><tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr></thead><tbody>${records.map((record) => `<tr>${columns.map((column) => `<td>${renderTableCell(record[column.id], column, context)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function renderRuleList(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<ol class="rule-list-preview">${records.map((record, index) => `<li><span>规则 ${index + 1}</span><strong>${escapeHtml(record.title ?? record.label ?? "规则")}</strong>${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</li>`).join("")}</ol>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无规则" }) : ""}`;
}

function renderChecklist(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<ul class="checklist-preview">${records.map((record) => `<li><span aria-hidden="true"></span><div><strong>${escapeHtml(record.title ?? record.label ?? "检查项")}</strong>${record.status ? `<em>${escapeHtml(record.status)}</em>` : ""}${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</div></li>`).join("")}</ul>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无检查项" }) : ""}`;
}

function renderAttachmentList(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<div class="attachment-list-preview">${records.map((record) => `<article><strong>${escapeHtml(record.title ?? record.name ?? "附件")}</strong>${record.status ? `<span class="status-tag">${escapeHtml(record.status)}</span>` : ""}${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</article>`).join("")}</div>${renderActionBar(component.actions)}${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无附件" }) : ""}`;
}

function renderCommentThread(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<ol class="comment-thread-preview">${records.map((record) => `<li><header><strong>${escapeHtml(record.author ?? record.user ?? "评论人")}</strong><time>${escapeHtml(record.time ?? "")}</time></header><p>${escapeHtml(record.content ?? record.description ?? record.title ?? "评论内容")}</p></li>`).join("")}</ol>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无评论" }) : ""}`;
}

function renderOrgChart(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<div class="org-chart-preview">${renderTreeNodes(records, true)}${renderRelationList(component)}</div>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无组织结构" }) : ""}`;
}

function renderCollapsePanel(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<div class="collapse-panel-preview">${records.map((record, index) => `<details ${index === 0 ? "open" : ""}><summary>${escapeHtml(record.title ?? record.label ?? "信息组")}</summary>${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}</details>`).join("")}</div>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无折叠内容" }) : ""}`;
}

function renderRelationGraph(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  return `${renderComponentTitle(component)}<div class="relation-graph-preview"><div class="relation-nodes">${records.map((record) => `<span>${escapeHtml(record.title ?? record.label ?? record.id ?? "节点")}</span>`).join("")}</div>${renderRelationList(component)}</div>${records.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无关系节点" }) : ""}`;
}
```

- [ ] **Step 5: Add CSS for governance components**

Add:

```css
.permission-matrix-shell, .audit-log-shell, .rule-list-preview, .checklist-preview, .attachment-list-preview, .comment-thread-preview, .org-chart-preview, .collapse-panel-preview, .relation-graph-preview {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.permission-matrix-shell, .audit-log-shell { overflow-x: auto; }
.rule-list-preview, .checklist-preview, .comment-thread-preview {
  margin: 0;
  padding: 12px 14px;
}
.rule-list-preview li, .checklist-preview li, .comment-thread-preview li {
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.rule-list-preview li:last-child, .checklist-preview li:last-child, .comment-thread-preview li:last-child { border-bottom: 0; }
.rule-list-preview span { display: block; color: var(--muted); font-size: 12px; }
.checklist-preview { list-style: none; }
.checklist-preview li { display: grid; grid-template-columns: 24px 1fr; gap: 10px; }
.checklist-preview li > span { width: 18px; height: 18px; border: 1px solid var(--line-strong); border-radius: 4px; margin-top: 2px; }
.checklist-preview em { margin-left: 8px; color: var(--muted); font-size: 12px; font-style: normal; }
.attachment-list-preview { display: grid; gap: 10px; padding: 12px; }
.attachment-list-preview article { border: 1px solid var(--line); border-radius: 8px; background: var(--panel-soft); padding: 10px; }
.comment-thread-preview header { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 12px; }
.org-chart-preview, .collapse-panel-preview, .relation-graph-preview { padding: 12px; }
.collapse-panel-preview details { border: 1px solid var(--line); border-radius: 8px; padding: 10px; margin-bottom: 8px; background: var(--panel-soft); }
.collapse-panel-preview summary { cursor: default; font-weight: 650; }
.relation-nodes { display: flex; flex-wrap: wrap; gap: 8px; }
.relation-nodes span { border: 1px solid var(--line); border-radius: 999px; padding: 5px 10px; background: var(--panel-soft); }
```

- [ ] **Step 6: Run renderer tests and full check**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/renderer/render-html.test.ts
npm run check
```

Expected: both pass.

- [ ] **Step 7: Commit governance renderer work**

```bash
git add plugins/spec-bifrost/src/renderer/renderHtml.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
git commit -m "feat(renderer): 渲染 v0.3 治理协作组件"
```

---

### Task 6: Enrich Procurement Example

**Files:**

- Modify: `plugins/spec-bifrost/tests/examples/procurement-example.test.ts`
- Modify: `plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json`
- Modify: `plugins/spec-bifrost/examples/procurement-system/README.md`

- [ ] **Step 1: Write failing example coverage test**

In `plugins/spec-bifrost/tests/examples/procurement-example.test.ts`, add this list near the existing `metricList` coverage loop:

```ts
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
```

Extend the parsed component shape:

```ts
          relations?: Array<{ sourceId: string; targetId: string }>;
```

Add this assertion:

```ts
  assert.equal(components.some((component) => component.relations && component.relations.length > 0), true);
```

- [ ] **Step 2: Run example test and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/examples/procurement-example.test.ts
```

Expected: fail with missing v0.3 component types.

- [ ] **Step 3: Add example pages and components**

Modify `plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json` without creating a second example directory. Keep existing pages and add these business sections:

```txt
申请单列表页:
- kanbanBoard: 按草稿、审批中、待采购、已完成分组展示申请卡片。
- chart: 展示本月预算占用和申请状态分布。

创建申请页:
- wizard: 基础信息、采购明细、附件确认、提交审批。
- editableTable: 采购明细行，字段包含物品名称、数量、单价、预算科目、供应商。
- checklist: 提交前资料清单。
- resultPanel: 提交成功后的业务反馈。

审批详情页:
- workflowDiagram: 草稿、提交、部门审批、财务审批、采购执行、完成、驳回。
- commentThread: 审批意见和协作讨论。
- attachmentList: 合同、报价单、验收单。
- auditLog: 关键操作记录。
- collapsePanel: 财务信息、审批备注、附件说明。
- relationGraph: 采购申请、预算科目、供应商、合同、验收单。

供应商参考页:
- comparisonTable: 供应商报价、等级、交付周期、历史评分对比。
- calendar: 交付关键日期。
- gantt: 合同确认、备货、物流、验收任务条。
- progressTracker: 供应商资料、合同、交付、验收进度。

采购分类与权限页:
- treeTable: 采购类目预算层级。
- permissionMatrix: 角色与页面、操作、字段权限。
- ruleList: 金额阈值、审批条件、附件必传、批量审批限制。
- orgChart: 申请人、部门负责人、财务、采购专员审批层级。
```

Use `relations` only where the component has `items` with stable `id` values:

```json
"relations": [
  { "sourceId": "draft", "targetId": "submitted", "label": "提交" },
  { "sourceId": "submitted", "targetId": "departmentApproval", "label": "部门审批" }
]
```

- [ ] **Step 4: Update example README**

In `plugins/spec-bifrost/examples/procurement-system/README.md`, update the coverage bullet so it includes:

```md
- v0.3 组件：可编辑明细表、层级表格、供应商对比、看板、工作流、向导、进度、结果反馈、图表、日历、甘特、权限矩阵、规则清单、检查清单、审计日志、附件列表、评论串、组织结构、折叠面板和关系图。
```

- [ ] **Step 5: Run validation and example tests**

Run:

```bash
npm run build
npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system
node --import tsx --test plugins/spec-bifrost/tests/examples/procurement-example.test.ts
```

Expected: all pass.

- [ ] **Step 6: Commit example work**

```bash
git add plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json plugins/spec-bifrost/examples/procurement-system/README.md plugins/spec-bifrost/tests/examples/procurement-example.test.ts
git commit -m "feat(examples): 丰富采购系统 v0.3 组件覆盖"
```

---

### Task 7: Export Samples And Skill Guidance

**Files:**

- Modify: `plugins/spec-bifrost/tests/examples/procurement-example.test.ts`
- Modify: `plugins/spec-bifrost/tests/config/codex-plugin.test.ts`
- Modify: `plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md`
- Modify: `plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md`
- Modify: `plugins/spec-bifrost/skills/spec/schema.md`
- Modify: `plugins/spec-bifrost/skills/export/SKILL.md`
- Modify: `plugins/spec-bifrost/skills/spec/export.md`

- [ ] **Step 1: Write failing export sample assertions**

In `plugins/spec-bifrost/tests/examples/procurement-example.test.ts`, add these sample assertions:

```ts
    assert.match(text, /可编辑明细|明细行/);
    assert.match(text, /权限矩阵/);
    assert.match(text, /业务规则|规则清单/);
    assert.match(text, /审计日志|操作记录/);
    assert.match(text, /评论|审批意见/);
    assert.match(text, /关系图|关联单据/);
```

For `frontendText`, add:

```ts
  assert.match(frontendText, /看板/);
  assert.match(frontendText, /向导/);
  assert.match(frontendText, /日历/);
  assert.match(frontendText, /甘特/);
```

For `backendText`, add:

```ts
  assert.match(backendText, /权限口径/);
  assert.match(backendText, /留痕/);
  assert.match(backendText, /明细项口径/);
```

- [ ] **Step 2: Write failing skill metadata assertions**

In `plugins/spec-bifrost/tests/config/codex-plugin.test.ts`, extend existing skill text checks with:

```ts
  assert.match(text, /editableTable|可编辑明细/);
  assert.match(text, /permissionMatrix|权限矩阵/);
  assert.match(text, /workflowDiagram|工作流/);
  assert.match(text, /relationGraph|关系图/);
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/examples/procurement-example.test.ts plugins/spec-bifrost/tests/config/codex-plugin.test.ts
```

Expected: fail because export samples and skill text do not contain v0.3 terms.

- [ ] **Step 4: Update schema skill**

In `plugins/spec-bifrost/skills/spec/schema.md`, add the 20 component types to the supported component list. Replace the old unsupported sentence that listed `chart` and `calendar` with:

```md
Do not use unsupported components such as transfer, tour, carousel, rate, colorPicker, qrCode, watermark, mapView, or imageGallery in v0.3.
```

Add a `Relations` section:

```md
## Relations

Components may include `relations` when they need to express node-to-node business relationships.

Supported relation fields:

- `sourceId`: item id in the same component
- `targetId`: item id in the same component
- optional `label`: business-facing relationship label
- optional `type`: business-facing relationship type
- optional `notes`: array of requirement notes

Use `relations` for `workflowDiagram`, `relationGraph`, `orgChart`, and `gantt`. Do not use `relations` for technical architecture, database relations, API dependencies, or implementation planning.
```

- [ ] **Step 5: Update export skill**

In `plugins/spec-bifrost/skills/export/SKILL.md`, update frontend guidance to include:

```md
- 页面级说明：summarize sections, components, tables, editable tables, tree tables, comparison tables, cards, steps, tabs, modals, drawers, metricList, charts, calendars, gantt plans, kanban boards, workflows, wizards, permission matrices, rules, checklists, audit logs, attachment lists, comment threads, relation graphs, empty states, and notes by page.
```

Update backend guidance to include:

```md
- 业务规则与治理：preserve ruleList, permissionMatrix, auditLog, workflowDiagram, relationGraph, attachmentList, and commentThread facts when they affect business meaning, permissions, traceability, or exception handling.
```

In `plugins/spec-bifrost/skills/spec/export.md`, add the same boundaries in shorter form:

```md
- Preserve v0.3 component facts such as editable tables, workflows, rules, permissions, attachments, comments, audit logs, charts, calendars, gantt plans, and relationship graphs.
- Do not transform these facts into APIs, database schemas, code modules, component library choices, or task breakdowns.
```

- [ ] **Step 6: Update export samples**

Update frontend sample sections so they explicitly describe:

```txt
- 采购明细可编辑表格：列、行操作、校验反馈和明细汇总。
- 审批看板、创建向导、结果反馈、日历和甘特排期。
- 权限矩阵、规则清单、附件列表、评论串、审计日志、关系图。
```

Update backend sample sections so they explicitly describe:

```txt
- 明细项口径：物品、数量、单价、预算科目、供应商和汇总金额。
- 流程结果：工作流节点、退回路径、提交结果和例外处理。
- 治理口径：权限矩阵、规则清单、审计留痕、附件约束和评论记录。
- 关系口径：采购申请、预算、供应商、合同和验收单之间的业务关联。
```

Keep the existing forbidden-content sentence:

```txt
不要包含接口定义、数据库设计、技术架构、代码结构或任务拆分
```

- [ ] **Step 7: Run export and skill tests**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/examples/procurement-example.test.ts plugins/spec-bifrost/tests/config/codex-plugin.test.ts
```

Expected: pass.

- [ ] **Step 8: Commit export and skill updates**

```bash
git add plugins/spec-bifrost/tests/examples/procurement-example.test.ts plugins/spec-bifrost/tests/config/codex-plugin.test.ts plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/frontend-requirements.md plugins/spec-bifrost/examples/procurement-system/docs/spec-bifrost/backend-requirements.md plugins/spec-bifrost/skills/spec/schema.md plugins/spec-bifrost/skills/export/SKILL.md plugins/spec-bifrost/skills/spec/export.md
git commit -m "docs(skills): 同步 v0.3 组件导出约束"
```

---

### Task 8: Public Documentation And Preview Screenshot

**Files:**

- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `plugins/spec-bifrost/README.md`
- Modify: `plugins/spec-bifrost/CHANGELOG.md`
- Modify: `docs/assets/spec-bifrost-preview.png`

- [ ] **Step 1: Update README component claims**

In all three README files, update the capability bullet that lists complex components so it includes:

```md
- 支持可编辑明细表、层级表格、对比表、看板、工作流、向导、图表、日历、甘特、权限矩阵、规则清单、检查清单、审计日志、附件列表、评论串、组织结构和关系图等更复杂的 B 端需求表达。
```

For `README.en.md`, use:

```md
- Supports richer B-end requirement components such as editable tables, tree tables, comparison tables, kanban boards, workflows, wizards, charts, calendars, gantt plans, permission matrices, rule lists, checklists, audit logs, attachment lists, comment threads, org charts, and relation graphs.
```

Update the example coverage paragraph in all three README files so it mentions:

```txt
editable tables, tree tables, comparison tables, kanban, workflow, wizard, chart, calendar, gantt, permission matrix, rules, checklist, audit log, attachments, comments, org chart, collapse panels, and relation graph
```

- [ ] **Step 2: Add changelog entry**

At the top of `plugins/spec-bifrost/CHANGELOG.md`, add an unreleased v0.3 entry:

```md
## 0.3.0

- 新增 20 个 B 端需求表达组件，覆盖可编辑明细表、层级表格、对比表、看板、工作流、向导、图表、日历、甘特、权限矩阵、规则清单、检查清单、审计日志、附件列表、评论串、组织结构、折叠面板和关系图。
- 新增 `relations` 关系字段，用于工作流、关系图、组织结构和甘特依赖等节点关系表达。
- 丰富采购申请管理系统示例，使其覆盖更完整的申请、审批、预算、供应商、交付、权限和留痕场景。
- 同步更新中英文 README、插件 README、schema skill、export skill、导出样例和预览截图。
- Added 20 B-end requirement-expression components covering editable tables, tree tables, comparison tables, kanban boards, workflows, wizards, charts, calendars, gantt plans, permission matrices, rule lists, checklists, audit logs, attachment lists, comment threads, org charts, collapse panels, and relation graphs.
- Added a `relations` field for node relationships used by workflows, relation graphs, org charts, and gantt dependencies.
- Expanded the procurement request management example across application, approval, budget, supplier, delivery, permission, and traceability scenarios.
- Updated Chinese/English README files, plugin README, schema skill, export skill, export samples, and the preview screenshot.
```

- [ ] **Step 3: Run README sync tests**

Run:

```bash
node --import tsx --test plugins/spec-bifrost/tests/config/codex-plugin.test.ts plugins/spec-bifrost/tests/examples/procurement-example.test.ts
```

Expected: pass.

- [ ] **Step 4: Generate updated preview screenshot**

Build and start preview:

```bash
npm run build
npm run spec-bifrost -- preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737
```

Use the in-app Browser or Chrome automation to open:

```txt
http://127.0.0.1:3737
```

Capture a desktop screenshot to:

```txt
docs/assets/spec-bifrost-preview.png
```

Check these visual facts:

```txt
- No horizontal page overflow at 1440px width.
- Sidebar is usable.
- New components are not rendered as "暂无内容配置".
- Tables, chart, calendar, gantt, relation graph, and comments have visible content.
- UI still reads as restrained B-end workspace.
```

Stop preview:

```bash
pkill -f "dist/cli/index.js preview"
lsof -nP -iTCP:3737 -sTCP:LISTEN
```

Expected: `lsof` prints no listener.

- [ ] **Step 5: Commit public docs and screenshot**

```bash
git add README.md README.en.md plugins/spec-bifrost/README.md plugins/spec-bifrost/CHANGELOG.md docs/assets/spec-bifrost-preview.png
git commit -m "docs: 展示 v0.3 组件表达能力"
```

---

### Task 9: Final Verification And Release Prep

**Files:**

- Modify through build output only: `plugins/spec-bifrost/dist/**`
- No manual source edits unless verification exposes a bug.

- [ ] **Step 1: Run full check**

Run:

```bash
npm run check
```

Expected:

```txt
tests pass
```

The exact test count will increase from 55 after v0.3 tests are added.

- [ ] **Step 2: Validate example**

Run:

```bash
npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system
```

Expected:

```txt
Spec Bifrost validation passed
```

- [ ] **Step 3: Validate Claude plugin packaging**

Run when Claude CLI is available:

```bash
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

Expected: both validations pass.

- [ ] **Step 4: Inspect git state**

Run:

```bash
git status --short
```

Expected: only generated `plugins/spec-bifrost/dist` files may remain unstaged if `npm run check` rebuilt them. Stage source, docs, examples, tests, screenshot, and dist together for the final implementation commit if there are generated dist changes not covered by earlier commits.

- [ ] **Step 5: Commit generated build output if needed**

If `plugins/spec-bifrost/dist` changed after `npm run check`, commit it:

```bash
git add plugins/spec-bifrost/dist
git commit -m "chore(build): 更新 v0.3 插件构建产物"
```

- [ ] **Step 6: Prepare release version**

After the user confirms the v0.3 implementation is accepted, update versions through the normal release process:

```bash
npm version 0.3.0 --no-git-tag-version
```

Then update these manifest versions to `0.3.0`:

```txt
plugins/spec-bifrost/.claude-plugin/plugin.json
plugins/spec-bifrost/.codex-plugin/plugin.json
```

Run:

```bash
npm run check
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

Commit:

```bash
git add package.json package-lock.json plugins/spec-bifrost/.claude-plugin/plugin.json plugins/spec-bifrost/.codex-plugin/plugin.json plugins/spec-bifrost/CHANGELOG.md plugins/spec-bifrost/dist
git commit -m "chore(release): 准备 spec-bifrost v0.3.0"
```

Tag and publish only after the user explicitly asks to publish:

```bash
git tag spec-bifrost--v0.3.0
git push origin main
git push origin spec-bifrost--v0.3.0
gh release create spec-bifrost--v0.3.0 --title "spec-bifrost v0.3.0" --notes "Spec Bifrost v0.3.0 expands B-end requirement expression with 20 new components and relation support."
```

## Self-Review

Spec coverage:

- All 20 P0/P1 components have schema, renderer, example, export, docs, and test tasks.
- `relations` has type, shape validation, reference validation, renderer usage, and docs tasks.
- Existing product boundary is preserved: no production code generation, no APIs, no database design, no architecture export.
- Current example remains the only example directory.
- README synchronization and version consistency rules are represented in docs and release tasks.

Placeholder scan:

- This plan contains no empty gaps.
- Each code-changing task includes target files, exact test commands, expected outcomes, and commit commands.

Type consistency:

- The plan consistently uses `relations?: RelationSpec[]`.
- The plan consistently uses `sourceId`, `targetId`, `label`, `type`, and `notes` for relations.
- The plan consistently uses `chartKind` only in prose and does not add it as a required schema field.
