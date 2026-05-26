# Spec Bifrost MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a distributable Claude Code plugin MVP that validates `spec-bifrost.json`, previews a multi-page B-end prototype locally, and guides Claude to export frontend/backend Markdown requirement documents.

**Architecture:** The plugin is schema-contract first. A TypeScript core package owns spec types, constants, validation, diagnostics, and shared helpers; hooks, CLI commands, renderer, examples, and skills all depend on that core behavior. The renderer never writes JSON, hook/renderer diagnostics contain error facts only, and Claude remains the only actor that edits `spec-bifrost.json`.

**Tech Stack:** Node.js 20+, TypeScript, npm scripts, Node built-in `node:test`, Node built-in HTTP server, vanilla HTML/CSS/JS renderer, Claude Code plugin skills/hooks/bin.

---

## Scope Check

The approved design covers several modules, but they are not independent products: schema/core is the contract, and hook, CLI, renderer, examples, and skills all validate that same contract. This plan keeps one MVP plan and orders work so every task produces a testable slice.

The plan does not include production code generation, low-code runtime behavior, API mocking, database design, technical architecture export, real persistence, authentication, or high-fidelity UI.

## File Structure

Create this structure:

```txt
spec-bifrost/
  package.json
  tsconfig.json
  .gitignore
  .claude-plugin/
    marketplace.json
  plugins/
    spec-bifrost/
      .claude-plugin/
        plugin.json
      skills/
        spec/
          SKILL.md
          schema.md
          export.md
          examples.md
        preview/
          SKILL.md
        validate/
          SKILL.md
        export/
          SKILL.md
        refresh/
          SKILL.md
      hooks/
        hooks.json
      bin/
        spec-bifrost
      src/
        core/
          constants.ts
          diagnostics.ts
          readSpec.ts
          types.ts
          validate.ts
        cli/
          index.ts
        hooks/
          postToolUseValidate.ts
        renderer/
          clientScript.ts
          renderHtml.ts
          server.ts
          state.ts
      tests/
        core/
          validate.test.ts
        cli/
          validate-cli.test.ts
        hooks/
          post-tool-use.test.ts
        renderer/
          render-html.test.ts
          state.test.ts
      examples/
        procurement-system/
          spec-bifrost.json
          README.md
      README.md
      SECURITY.md
      CHANGELOG.md
```

Responsibilities:

- `src/core/*`: Owns data shapes, supported enum constants, JSON reading, validation, and diagnostic formatting.
- `src/cli/index.ts`: Provides `spec-bifrost validate`, `preview`, `refresh`, and `diagnostics` entry points.
- `src/hooks/postToolUseValidate.ts`: Implements the `PostToolUse` validation hook for `spec-bifrost.json`.
- `src/renderer/*`: Provides local preview server, last known good state, render diagnostics, and browser HTML.
- `skills/*`: Provides Claude-facing workflows. These are the user-facing `/spec-bifrost:*` commands.
- `examples/procurement-system/*`: Provides a complete but simple multi-page B-end system sample.

## Task 1: Scaffold Package And Plugin Metadata

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.claude-plugin/marketplace.json`
- Create: `plugins/spec-bifrost/.claude-plugin/plugin.json`
- Create: `plugins/spec-bifrost/CHANGELOG.md`
- Create: `plugins/spec-bifrost/bin/spec-bifrost`

- [ ] **Step 1: Create package manifest**

Create `package.json`:

```json
{
  "name": "spec-bifrost-workspace",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --import tsx --test \"plugins/spec-bifrost/tests/**/*.test.ts\"",
    "check": "npm run build && npm test",
    "spec-bifrost": "node plugins/spec-bifrost/dist/cli/index.js"
  },
  "devDependencies": {
    "@types/node": "^20.17.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "rootDir": "plugins/spec-bifrost/src",
    "outDir": "plugins/spec-bifrost/dist",
    "declaration": true
  },
  "include": ["plugins/spec-bifrost/src/**/*.ts"]
}
```

- [ ] **Step 3: Create git ignore**

Create `.gitignore`:

```gitignore
node_modules/
plugins/spec-bifrost/dist/
.DS_Store
```

- [ ] **Step 4: Create marketplace catalog**

Create `.claude-plugin/marketplace.json`:

```json
{
  "name": "spec-bifrost-marketplace",
  "owner": {
    "name": "Spec Bifrost"
  },
  "plugins": [
    {
      "name": "spec-bifrost",
      "source": "./plugins/spec-bifrost",
      "description": "Create, validate, preview, and export page-driven B-end requirement prototypes from local JSON."
    }
  ]
}
```

- [ ] **Step 5: Create plugin manifest**

Create `plugins/spec-bifrost/.claude-plugin/plugin.json`:

```json
{
  "name": "spec-bifrost",
  "version": "0.1.0",
  "description": "Create, validate, preview, and export page-driven B-end requirement prototypes from local JSON.",
  "author": {
    "name": "Spec Bifrost"
  },
  "license": "MIT",
  "keywords": ["requirements", "prototype", "json", "b-end", "product-management"]
}
```

- [ ] **Step 6: Create CLI wrapper**

Create `plugins/spec-bifrost/bin/spec-bifrost`:

```sh
#!/usr/bin/env sh
set -eu

ROOT="${CLAUDE_PLUGIN_ROOT:-$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)}"
exec node "$ROOT/dist/cli/index.js" "$@"
```

Run:

```bash
chmod +x plugins/spec-bifrost/bin/spec-bifrost
```

- [ ] **Step 7: Create changelog**

Create `plugins/spec-bifrost/CHANGELOG.md`:

```md
# Changelog

## 0.1.0

- Initial MVP plugin structure.
```

- [ ] **Step 8: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and `node_modules/` is installed locally.

- [ ] **Step 9: Verify scaffold**

Run:

```bash
npm run build
```

Expected: build fails because no TypeScript source files exist yet. The failure should mention that no inputs were found or that included source files are missing.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .claude-plugin plugins/spec-bifrost/.claude-plugin plugins/spec-bifrost/bin plugins/spec-bifrost/CHANGELOG.md
git commit -m "chore: scaffold spec bifrost plugin"
```

## Task 2: Implement Core Types, Constants, And Basic Validation

**Files:**
- Create: `plugins/spec-bifrost/src/core/types.ts`
- Create: `plugins/spec-bifrost/src/core/constants.ts`
- Create: `plugins/spec-bifrost/src/core/diagnostics.ts`
- Create: `plugins/spec-bifrost/src/core/validate.ts`
- Create: `plugins/spec-bifrost/tests/core/validate.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `plugins/spec-bifrost/tests/core/validate.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { validateSpec } from "../../src/core/validate.ts";
import type { SpecBifrostDocument } from "../../src/core/types.ts";

function validSpec(): SpecBifrostDocument {
  return {
    schemaVersion: "1.0",
    project: {
      name: "采购申请管理系统",
      description: "用于创建、审批和跟踪采购申请的内部 B 端系统",
      actors: ["申请人", "审批人"]
    },
    optionSets: [
      {
        id: "approvalStatus",
        label: "审批状态",
        options: [
          { value: "pending", label: "审批中" },
          { value: "approved", label: "已通过" }
        ]
      }
    ],
    pages: [
      {
        id: "purchase-list",
        title: "采购申请列表",
        purpose: "查看采购申请",
        route: "/purchases",
        type: "list",
        nav: { visible: true, label: "采购申请", group: "采购管理", order: 10 },
        sections: [
          {
            id: "main",
            title: "申请列表",
            components: [
              {
                id: "statusFilter",
                type: "filterBar",
                fields: [
                  {
                    id: "status",
                    label: "审批状态",
                    type: "select",
                    optionSetId: "approvalStatus"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };
}

test("valid page-driven spec passes", () => {
  const result = validateSpec(validSpec());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("unsupported component type fails with facts only", () => {
  const spec = validSpec();
  spec.pages[0]!.sections[0]!.components[0]!.type = "chart";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "schema_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections[0].components[0].type");
  assert.match(result.errors[0]?.message ?? "", /Unsupported component type/);
  assert.equal("suggestion" in (result.errors[0] as object), false);
});

test("notes are allowed on page section component field and action", () => {
  const spec = validSpec();
  spec.pages[0]!.notes = ["页面备注"];
  spec.pages[0]!.sections[0]!.notes = ["区域备注"];
  spec.pages[0]!.sections[0]!.components[0]!.notes = ["组件备注"];
  spec.pages[0]!.sections[0]!.components[0]!.fields![0]!.notes = ["字段备注"];
  spec.pages[0]!.sections[0]!.components[0]!.actions = [
    {
      id: "create",
      type: "navigate",
      label: "新建申请",
      targetPageId: "purchase-list",
      notes: ["按钮备注"]
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/core/validate.test.ts
```

Expected: FAIL because `src/core/validate.ts` and `src/core/types.ts` do not exist.

- [ ] **Step 3: Implement core types**

Create `plugins/spec-bifrost/src/core/types.ts`:

```ts
export type Notes = string[];

export interface SpecBifrostDocument {
  schemaVersion: "1.0";
  project: {
    name: string;
    description: string;
    actors: string[];
  };
  optionSets?: OptionSet[];
  pages: PageSpec[];
}

export interface OptionSet {
  id: string;
  label: string;
  options: OptionValue[];
}

export interface OptionValue {
  value: string;
  label: string;
}

export interface PageSpec {
  id: string;
  title: string;
  purpose: string;
  route: string;
  type: PageType;
  nav?: NavigationSpec;
  sections: SectionSpec[];
  notes?: Notes;
}

export interface NavigationSpec {
  visible: boolean;
  label: string;
  group?: string;
  order?: number;
}

export interface SectionSpec {
  id: string;
  title?: string;
  components: ComponentSpec[];
  notes?: Notes;
}

export interface ComponentSpec {
  id: string;
  type: ComponentType;
  title?: string;
  fields?: FieldSpec[];
  columns?: FieldSpec[];
  actions?: ActionSpec[];
  items?: unknown[];
  emptyState?: EmptyStateSpec;
  notes?: Notes;
}

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  meaning?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: OptionValue[];
  optionSetId?: string;
  validationRules?: string[];
  displayRules?: string[];
  visibleWhen?: ConditionSpec;
  enabledWhen?: ConditionSpec;
  requiredWhen?: ConditionSpec;
  notes?: Notes;
}

export interface ActionSpec {
  id: string;
  type: ActionType;
  label: string;
  targetPageId?: string;
  message?: string;
  actionWhen?: ConditionSpec;
  notes?: Notes;
}

export interface EmptyStateSpec {
  title: string;
  description?: string;
  notes?: Notes;
}

export interface ConditionSpec {
  fieldId?: string;
  operator?: ConditionOperator;
  value?: unknown;
  all?: ConditionSpec[];
  any?: ConditionSpec[];
}

export type PageType = "list" | "form" | "detail" | "approval" | "reference";
export type ComponentType =
  | "pageHeader"
  | "section"
  | "form"
  | "filterBar"
  | "table"
  | "descriptionList"
  | "cardList"
  | "steps"
  | "tabs"
  | "alert"
  | "emptyState"
  | "modal"
  | "drawer"
  | "actionBar"
  | "textBlock";
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "dateRange"
  | "time"
  | "select"
  | "multiSelect"
  | "radio"
  | "checkbox"
  | "switch"
  | "user"
  | "department"
  | "file"
  | "status"
  | "tag";
export type ActionType =
  | "navigate"
  | "openModal"
  | "closeModal"
  | "openDrawer"
  | "closeDrawer"
  | "setFieldValue"
  | "submitPrototype"
  | "resetFields"
  | "showMessage";
export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "empty"
  | "notEmpty"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "contains";
```

- [ ] **Step 4: Implement constants**

Create `plugins/spec-bifrost/src/core/constants.ts`:

```ts
import type { ActionType, ComponentType, ConditionOperator, FieldType, PageType } from "./types.js";

export const SPEC_FILE_NAME = "spec-bifrost.json";

export const SUPPORTED_PAGE_TYPES: readonly PageType[] = ["list", "form", "detail", "approval", "reference"];

export const SUPPORTED_COMPONENT_TYPES: readonly ComponentType[] = [
  "pageHeader",
  "section",
  "form",
  "filterBar",
  "table",
  "descriptionList",
  "cardList",
  "steps",
  "tabs",
  "alert",
  "emptyState",
  "modal",
  "drawer",
  "actionBar",
  "textBlock"
];

export const SUPPORTED_FIELD_TYPES: readonly FieldType[] = [
  "text",
  "textarea",
  "number",
  "currency",
  "date",
  "dateRange",
  "time",
  "select",
  "multiSelect",
  "radio",
  "checkbox",
  "switch",
  "user",
  "department",
  "file",
  "status",
  "tag"
];

export const SUPPORTED_ACTION_TYPES: readonly ActionType[] = [
  "navigate",
  "openModal",
  "closeModal",
  "openDrawer",
  "closeDrawer",
  "setFieldValue",
  "submitPrototype",
  "resetFields",
  "showMessage"
];

export const SUPPORTED_CONDITION_OPERATORS: readonly ConditionOperator[] = [
  "equals",
  "notEquals",
  "in",
  "notIn",
  "empty",
  "notEmpty",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "contains"
];
```

- [ ] **Step 5: Implement diagnostics**

Create `plugins/spec-bifrost/src/core/diagnostics.ts`:

```ts
export type DiagnosticType = "json_syntax_error" | "schema_error" | "reference_error" | "render_error";

export interface SpecDiagnostic {
  path: string;
  type: DiagnosticType;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  ok: boolean;
  errors: SpecDiagnostic[];
}

export function formatDiagnostics(title: string, errors: SpecDiagnostic[]): string {
  const lines = [`${title}.`, ""];
  for (const error of errors) {
    lines.push(`- path: ${error.path}`);
    lines.push(`  type: ${error.type}`);
    lines.push(`  message: ${error.message}`);
    if ("value" in error) {
      lines.push(`  value: ${JSON.stringify(error.value)}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
```

- [ ] **Step 6: Implement minimal validator**

Create `plugins/spec-bifrost/src/core/validate.ts` with the following public API and minimal helpers:

```ts
import {
  SUPPORTED_ACTION_TYPES,
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_CONDITION_OPERATORS,
  SUPPORTED_FIELD_TYPES,
  SUPPORTED_PAGE_TYPES
} from "./constants.js";
import type { ActionSpec, ComponentSpec, ConditionSpec, FieldSpec, PageSpec, SpecBifrostDocument } from "./types.js";
import type { SpecDiagnostic, ValidationResult } from "./diagnostics.js";

export function validateSpec(input: unknown): ValidationResult {
  const errors: SpecDiagnostic[] = [];
  if (!isRecord(input)) {
    return fail("schema_error", "", "Spec root must be an object.", input);
  }

  const spec = input as SpecBifrostDocument;
  if (spec.schemaVersion !== "1.0") {
    errors.push(error("schema_error", "schemaVersion", "schemaVersion must be \"1.0\".", spec.schemaVersion));
  }
  if (!isRecord(spec.project)) {
    errors.push(error("schema_error", "project", "project must be an object.", spec.project));
  } else {
    requireString(spec.project.name, "project.name", errors);
    requireString(spec.project.description, "project.description", errors);
    if (!Array.isArray(spec.project.actors)) {
      errors.push(error("schema_error", "project.actors", "project.actors must be an array.", spec.project.actors));
    }
  }
  if (spec.optionSets !== undefined && !Array.isArray(spec.optionSets)) {
    errors.push(error("schema_error", "optionSets", "optionSets must be an array.", spec.optionSets));
  }
  if (!Array.isArray(spec.pages)) {
    errors.push(error("schema_error", "pages", "pages must be an array.", spec.pages));
    return { ok: errors.length === 0, errors };
  }

  spec.pages.forEach((page, pageIndex) => validatePage(page, `pages[${pageIndex}]`, errors));
  return { ok: errors.length === 0, errors };
}

function validatePage(page: PageSpec, path: string, errors: SpecDiagnostic[]): void {
  requireString(page.id, `${path}.id`, errors);
  requireString(page.title, `${path}.title`, errors);
  requireString(page.purpose, `${path}.purpose`, errors);
  requireString(page.route, `${path}.route`, errors);
  if (!SUPPORTED_PAGE_TYPES.includes(page.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported page type "${String(page.type)}".`, page.type));
  }
  validateNotes(page.notes, `${path}.notes`, errors);
  if (!Array.isArray(page.sections)) {
    errors.push(error("schema_error", `${path}.sections`, "sections must be an array.", page.sections));
    return;
  }
  page.sections.forEach((section, sectionIndex) => {
    validateNotes(section.notes, `${path}.sections[${sectionIndex}].notes`, errors);
    if (!Array.isArray(section.components)) {
      errors.push(error("schema_error", `${path}.sections[${sectionIndex}].components`, "components must be an array.", section.components));
      return;
    }
    section.components.forEach((component, componentIndex) => {
      validateComponent(component, `${path}.sections[${sectionIndex}].components[${componentIndex}]`, errors);
    });
  });
}

function validateComponent(component: ComponentSpec, path: string, errors: SpecDiagnostic[]): void {
  requireString(component.id, `${path}.id`, errors);
  if (!SUPPORTED_COMPONENT_TYPES.includes(component.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported component type "${String(component.type)}".`, component.type));
  }
  validateNotes(component.notes, `${path}.notes`, errors);
  component.fields?.forEach((field, fieldIndex) => validateField(field, `${path}.fields[${fieldIndex}]`, errors));
  component.columns?.forEach((field, fieldIndex) => validateField(field, `${path}.columns[${fieldIndex}]`, errors));
  component.actions?.forEach((action, actionIndex) => validateAction(action, `${path}.actions[${actionIndex}]`, errors));
}

function validateField(field: FieldSpec, path: string, errors: SpecDiagnostic[]): void {
  requireString(field.id, `${path}.id`, errors);
  requireString(field.label, `${path}.label`, errors);
  if (!SUPPORTED_FIELD_TYPES.includes(field.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported field type "${String(field.type)}".`, field.type));
  }
  validateNotes(field.notes, `${path}.notes`, errors);
  validateCondition(field.visibleWhen, `${path}.visibleWhen`, errors);
  validateCondition(field.enabledWhen, `${path}.enabledWhen`, errors);
  validateCondition(field.requiredWhen, `${path}.requiredWhen`, errors);
}

function validateAction(action: ActionSpec, path: string, errors: SpecDiagnostic[]): void {
  requireString(action.id, `${path}.id`, errors);
  requireString(action.label, `${path}.label`, errors);
  if (!SUPPORTED_ACTION_TYPES.includes(action.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported action type "${String(action.type)}".`, action.type));
  }
  validateNotes(action.notes, `${path}.notes`, errors);
  validateCondition(action.actionWhen, `${path}.actionWhen`, errors);
}

function validateCondition(condition: ConditionSpec | undefined, path: string, errors: SpecDiagnostic[]): void {
  if (condition === undefined) return;
  if (!isRecord(condition)) {
    errors.push(error("schema_error", path, "condition must be an object.", condition));
    return;
  }
  if (condition.operator !== undefined && !SUPPORTED_CONDITION_OPERATORS.includes(condition.operator)) {
    errors.push(error("schema_error", `${path}.operator`, `Unsupported condition operator "${String(condition.operator)}".`, condition.operator));
  }
  condition.all?.forEach((child, index) => validateCondition(child, `${path}.all[${index}]`, errors));
  condition.any?.forEach((child, index) => validateCondition(child, `${path}.any[${index}]`, errors));
}

function validateNotes(notes: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (notes === undefined) return;
  if (!Array.isArray(notes) || notes.some((note) => typeof note !== "string")) {
    errors.push(error("schema_error", path, "notes must be an array of strings.", notes));
  }
}

function requireString(value: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (typeof value !== "string" || value.length === 0) {
    errors.push(error("schema_error", path, "value must be a non-empty string.", value));
  }
}

function fail(type: SpecDiagnostic["type"], path: string, message: string, value: unknown): ValidationResult {
  return { ok: false, errors: [error(type, path, message, value)] };
}

function error(type: SpecDiagnostic["type"], path: string, message: string, value: unknown): SpecDiagnostic {
  return { type, path, message, value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
```

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/core/validate.test.ts
```

Expected: PASS for all tests in `validate.test.ts`.

- [ ] **Step 8: Build**

Run:

```bash
npm run build
```

Expected: PASS and `plugins/spec-bifrost/dist/` is created.

- [ ] **Step 9: Commit**

```bash
git add plugins/spec-bifrost/src/core plugins/spec-bifrost/tests/core package.json package-lock.json tsconfig.json
git commit -m "feat: add spec validation core"
```

## Task 3: Add Reference Integrity And JSON Reading

**Files:**
- Modify: `plugins/spec-bifrost/src/core/validate.ts`
- Create: `plugins/spec-bifrost/src/core/readSpec.ts`
- Modify: `plugins/spec-bifrost/tests/core/validate.test.ts`

- [ ] **Step 1: Add failing reference tests**

Append to `plugins/spec-bifrost/tests/core/validate.test.ts`:

```ts
test("missing optionSetId fails as reference error", () => {
  const spec = validSpec();
  spec.pages[0]!.sections[0]!.components[0]!.fields![0]!.optionSetId = "missingStatus";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "reference_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections[0].components[0].fields[0].optionSetId");
  assert.equal(result.errors[0]?.value, "missingStatus");
});

test("missing action target page fails as reference error", () => {
  const spec = validSpec();
  spec.pages[0]!.sections[0]!.components[0]!.actions = [
    {
      id: "detail",
      type: "navigate",
      label: "查看详情",
      targetPageId: "purchase-detail"
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "reference_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections[0].components[0].actions[0].targetPageId");
});

test("invalid JSON returns syntax diagnostic", async () => {
  const { readSpecFile } = await import("../../src/core/readSpec.ts");
  const result = await readSpecFile(new URL("data:application/json,{bad-json}"));

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "json_syntax_error");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/core/validate.test.ts
```

Expected: FAIL because reference validation and `readSpecFile` do not exist.

- [ ] **Step 3: Add reference checks**

Modify `validateSpec` in `plugins/spec-bifrost/src/core/validate.ts` after schema traversal:

```ts
  validateReferences(spec, errors);
  return { ok: errors.length === 0, errors };
```

Add these helpers to the same file:

```ts
function validateReferences(spec: SpecBifrostDocument, errors: SpecDiagnostic[]): void {
  const pageIds = new Set(spec.pages.map((page) => page.id));
  const optionSetIds = new Set((spec.optionSets ?? []).map((optionSet) => optionSet.id));

  spec.pages.forEach((page, pageIndex) => {
    const fieldIds = new Set<string>();
    page.sections.forEach((section) => {
      section.components.forEach((component) => {
        component.fields?.forEach((field) => fieldIds.add(field.id));
        component.columns?.forEach((field) => fieldIds.add(field.id));
      });
    });

    page.sections.forEach((section, sectionIndex) => {
      section.components.forEach((component, componentIndex) => {
        const componentPath = `pages[${pageIndex}].sections[${sectionIndex}].components[${componentIndex}]`;
        component.fields?.forEach((field, fieldIndex) => {
          validateFieldReferences(field, `${componentPath}.fields[${fieldIndex}]`, optionSetIds, fieldIds, errors);
        });
        component.columns?.forEach((field, fieldIndex) => {
          validateFieldReferences(field, `${componentPath}.columns[${fieldIndex}]`, optionSetIds, fieldIds, errors);
        });
        component.actions?.forEach((action, actionIndex) => {
          const actionPath = `${componentPath}.actions[${actionIndex}]`;
          if (action.targetPageId !== undefined && !pageIds.has(action.targetPageId)) {
            errors.push(error("reference_error", `${actionPath}.targetPageId`, `targetPageId "${action.targetPageId}" does not match any page id.`, action.targetPageId));
          }
          validateConditionReferences(action.actionWhen, `${actionPath}.actionWhen`, fieldIds, errors);
        });
      });
    });
  });
}

function validateFieldReferences(
  field: FieldSpec,
  path: string,
  optionSetIds: Set<string>,
  fieldIds: Set<string>,
  errors: SpecDiagnostic[]
): void {
  if (field.optionSetId !== undefined && !optionSetIds.has(field.optionSetId)) {
    errors.push(error("reference_error", `${path}.optionSetId`, `optionSetId "${field.optionSetId}" does not exist.`, field.optionSetId));
  }
  validateConditionReferences(field.visibleWhen, `${path}.visibleWhen`, fieldIds, errors);
  validateConditionReferences(field.enabledWhen, `${path}.enabledWhen`, fieldIds, errors);
  validateConditionReferences(field.requiredWhen, `${path}.requiredWhen`, fieldIds, errors);
}

function validateConditionReferences(condition: ConditionSpec | undefined, path: string, fieldIds: Set<string>, errors: SpecDiagnostic[]): void {
  if (condition === undefined) return;
  if (condition.fieldId !== undefined && !fieldIds.has(condition.fieldId)) {
    errors.push(error("reference_error", `${path}.fieldId`, `fieldId "${condition.fieldId}" does not exist in the current page.`, condition.fieldId));
  }
  condition.all?.forEach((child, index) => validateConditionReferences(child, `${path}.all[${index}]`, fieldIds, errors));
  condition.any?.forEach((child, index) => validateConditionReferences(child, `${path}.any[${index}]`, fieldIds, errors));
}
```

- [ ] **Step 4: Add JSON reader**

Create `plugins/spec-bifrost/src/core/readSpec.ts`:

```ts
import { readFile } from "node:fs/promises";
import type { ValidationResult } from "./diagnostics.js";
import { validateSpec } from "./validate.js";

export async function readSpecFile(path: string | URL): Promise<ValidationResult> {
  try {
    const raw = await readText(path);
    const parsed = JSON.parse(raw) as unknown;
    return validateSpec(parsed);
  } catch (error) {
    return {
      ok: false,
      errors: [
        {
          path: "",
          type: "json_syntax_error",
          message: error instanceof Error ? error.message : "Unable to parse JSON.",
          value: String(path)
        }
      ]
    };
  }
}

async function readText(path: string | URL): Promise<string> {
  if (path instanceof URL && path.protocol === "data:") {
    return decodeURIComponent(path.pathname);
  }
  return readFile(path, "utf8");
}
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/core/validate.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add plugins/spec-bifrost/src/core plugins/spec-bifrost/tests/core
git commit -m "feat: validate spec references"
```

## Task 4: Implement Validate CLI And Diagnostic Output

**Files:**
- Create: `plugins/spec-bifrost/src/cli/index.ts`
- Create: `plugins/spec-bifrost/tests/cli/validate-cli.test.ts`
- Modify: `plugins/spec-bifrost/bin/spec-bifrost`

- [ ] **Step 1: Write failing CLI tests**

Create `plugins/spec-bifrost/tests/cli/validate-cli.test.ts`:

```ts
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("validate command passes for valid spec", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), JSON.stringify({
      schemaVersion: "1.0",
      project: { name: "采购申请", description: "测试", actors: ["申请人"] },
      pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
    }));

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "validate", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Spec Bifrost validation passed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("validate command fails with facts only", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-cli-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), "{bad-json}");

    const result = spawnSync("node", ["plugins/spec-bifrost/src/cli/index.ts", "validate", "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--import tsx" }
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Spec Bifrost validation failed/);
    assert.doesNotMatch(result.stderr, /suggestion/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/cli/validate-cli.test.ts
```

Expected: FAIL because CLI file does not exist.

- [ ] **Step 3: Implement CLI**

Create `plugins/spec-bifrost/src/cli/index.ts`:

```ts
#!/usr/bin/env node
import { resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import { formatDiagnostics } from "../core/diagnostics.js";
import { readSpecFile } from "../core/readSpec.js";

const args = process.argv.slice(2);
const command = args[0];

if (command === "validate") {
  const cwd = readFlag(args, "--cwd") ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const specPath = resolve(cwd, SPEC_FILE_NAME);
  const result = await readSpecFile(specPath);
  if (result.ok) {
    console.log("Spec Bifrost validation passed.");
    process.exit(0);
  }
  console.error(formatDiagnostics("Spec Bifrost validation failed", result.errors));
  process.exit(1);
}

if (command === "preview") {
  console.log("Spec Bifrost preview command is available after renderer server is built.");
  process.exit(0);
}

if (command === "refresh") {
  console.log("Spec Bifrost refresh command is available after renderer server is built.");
  process.exit(0);
}

if (command === "diagnostics") {
  console.log("Spec Bifrost diagnostics command is available after renderer server is built.");
  process.exit(0);
}

console.error("Usage: spec-bifrost <validate|preview|refresh|diagnostics> [--cwd <path>]");
process.exit(1);

function readFlag(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index === -1) return undefined;
  return values[index + 1];
}
```

- [ ] **Step 4: Run tests and build**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/cli/validate-cli.test.ts
npm run build
plugins/spec-bifrost/bin/spec-bifrost validate --cwd plugins/spec-bifrost/examples/procurement-system
```

Expected: first two commands PASS. The final command may fail if the example file does not exist yet; that is acceptable until Task 9.

- [ ] **Step 5: Commit**

```bash
git add plugins/spec-bifrost/src/cli plugins/spec-bifrost/tests/cli plugins/spec-bifrost/bin/spec-bifrost
git commit -m "feat: add spec validation cli"
```

## Task 5: Implement PostToolUse Validation Hook

**Files:**
- Create: `plugins/spec-bifrost/hooks/hooks.json`
- Create: `plugins/spec-bifrost/src/hooks/postToolUseValidate.ts`
- Create: `plugins/spec-bifrost/tests/hooks/post-tool-use.test.ts`

- [ ] **Step 1: Write failing hook tests**

Create `plugins/spec-bifrost/tests/hooks/post-tool-use.test.ts`:

```ts
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runPostToolUseValidation } from "../../src/hooks/postToolUseValidate.ts";

test("hook ignores non spec files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-hook-"));
  try {
    const result = await runPostToolUseValidation({
      cwd: dir,
      toolName: "Write",
      filePath: join(dir, "README.md")
    });
    assert.equal(result.decision, "approve");
    assert.equal(result.message, "");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("hook blocks invalid spec facts only", async () => {
  const dir = await mkdtemp(join(tmpdir(), "spec-bifrost-hook-"));
  try {
    await writeFile(join(dir, "spec-bifrost.json"), "{bad-json}");
    const result = await runPostToolUseValidation({
      cwd: dir,
      toolName: "Write",
      filePath: join(dir, "spec-bifrost.json")
    });
    assert.equal(result.decision, "block");
    assert.match(result.message, /Spec Bifrost validation failed/);
    assert.doesNotMatch(result.message, /suggestion/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/hooks/post-tool-use.test.ts
```

Expected: FAIL because hook module does not exist.

- [ ] **Step 3: Implement hook module**

Create `plugins/spec-bifrost/src/hooks/postToolUseValidate.ts`:

```ts
import { basename, resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import { formatDiagnostics } from "../core/diagnostics.js";
import { readSpecFile } from "../core/readSpec.js";

export interface HookInput {
  cwd: string;
  toolName: string;
  filePath?: string;
}

export interface HookResult {
  decision: "approve" | "block";
  message: string;
}

export async function runPostToolUseValidation(input: HookInput): Promise<HookResult> {
  if (!["Write", "Edit", "MultiEdit"].includes(input.toolName)) {
    return { decision: "approve", message: "" };
  }
  if (input.filePath === undefined || basename(input.filePath) !== SPEC_FILE_NAME) {
    return { decision: "approve", message: "" };
  }

  const specPath = resolve(input.cwd, SPEC_FILE_NAME);
  const result = await readSpecFile(specPath);
  if (result.ok) {
    return { decision: "approve", message: "" };
  }

  return {
    decision: "block",
    message: formatDiagnostics("Spec Bifrost validation failed", result.errors)
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  const parsed = raw.length > 0 ? JSON.parse(raw) : {};
  const result = await runPostToolUseValidation({
    cwd: parsed.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
    toolName: parsed.tool_name ?? parsed.toolName ?? "",
    filePath: parsed.tool_input?.file_path ?? parsed.filePath
  });
  if (result.decision === "block") {
    console.error(result.message);
    process.exit(2);
  }
  process.exit(0);
}
```

- [ ] **Step 4: Create hook config**

Create `plugins/spec-bifrost/hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/hooks/postToolUseValidate.js\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/hooks/post-tool-use.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add plugins/spec-bifrost/hooks plugins/spec-bifrost/src/hooks plugins/spec-bifrost/tests/hooks
git commit -m "feat: validate spec changes with hook"
```

## Task 6: Implement Renderer State And HTML Rendering

**Files:**
- Create: `plugins/spec-bifrost/src/renderer/state.ts`
- Create: `plugins/spec-bifrost/src/renderer/renderHtml.ts`
- Create: `plugins/spec-bifrost/src/renderer/clientScript.ts`
- Create: `plugins/spec-bifrost/tests/renderer/state.test.ts`
- Create: `plugins/spec-bifrost/tests/renderer/render-html.test.ts`

- [ ] **Step 1: Write failing renderer state tests**

Create `plugins/spec-bifrost/tests/renderer/state.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createPreviewState } from "../../src/renderer/state.ts";

test("preview state keeps last known good after render error", () => {
  const state = createPreviewState();
  const goodSpec = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试", actors: ["申请人"] },
    pages: [{ id: "list", title: "列表", purpose: "查看", route: "/list", type: "list", sections: [] }]
  };

  state.acceptGoodSpec(goodSpec);
  state.acceptRenderError({
    pageId: "detail",
    componentId: "timeline",
    type: "component_render_error",
    jsonPath: "pages[1].sections[0].components[0]",
    message: "timeline component cannot render without items or emptyState."
  });

  assert.equal(state.getLastKnownGood(), goodSpec);
  assert.equal(state.getDiagnostics()[0]?.type, "component_render_error");
});
```

- [ ] **Step 2: Write failing HTML rendering tests**

Create `plugins/spec-bifrost/tests/renderer/render-html.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { renderPrototypeHtml } from "../../src/renderer/renderHtml.ts";
import type { SpecBifrostDocument } from "../../src/core/types.ts";

test("renderPrototypeHtml renders navigation page and notes toggle text", () => {
  const spec: SpecBifrostDocument = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试系统", actors: ["申请人"] },
    pages: [
      {
        id: "list",
        title: "采购申请列表",
        purpose: "查看申请",
        route: "/list",
        type: "list",
        nav: { visible: true, label: "采购申请", order: 1 },
        notes: ["列表页用于日常跟踪"],
        sections: []
      }
    ]
  };

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /采购申请列表/);
  assert.match(html, /采购申请/);
  assert.match(html, /显示备注/);
  assert.match(html, /列表页用于日常跟踪/);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/renderer/state.test.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
```

Expected: FAIL because renderer modules do not exist.

- [ ] **Step 4: Implement renderer state**

Create `plugins/spec-bifrost/src/renderer/state.ts`:

```ts
export interface RenderDiagnostic {
  pageId?: string;
  componentId?: string;
  type: "component_render_error" | "data_format_error" | "reference_render_error";
  jsonPath: string;
  message: string;
}

export function createPreviewState() {
  let lastKnownGood: unknown | undefined;
  let diagnostics: RenderDiagnostic[] = [];

  return {
    acceptGoodSpec(spec: unknown): void {
      lastKnownGood = spec;
      diagnostics = [];
    },
    acceptRenderError(error: RenderDiagnostic): void {
      diagnostics = [error];
    },
    getLastKnownGood(): unknown | undefined {
      return lastKnownGood;
    },
    getDiagnostics(): RenderDiagnostic[] {
      return diagnostics;
    }
  };
}
```

- [ ] **Step 5: Implement HTML renderer**

Create `plugins/spec-bifrost/src/renderer/clientScript.ts`:

```ts
export function clientScript(): string {
  return `
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("[data-notes-toggle]")) {
    document.body.classList.toggle("show-notes");
  }
  const pageButton = target.closest("[data-page-id]");
  if (pageButton instanceof HTMLElement) {
    const pageId = pageButton.dataset.pageId;
    document.querySelectorAll("[data-page]").forEach((page) => {
      page.toggleAttribute("hidden", page.getAttribute("data-page") !== pageId);
    });
  }
});
`;
}
```

Create `plugins/spec-bifrost/src/renderer/renderHtml.ts`:

```ts
import type { SpecBifrostDocument } from "../core/types.js";
import type { RenderDiagnostic } from "./state.js";
import { clientScript } from "./clientScript.js";

export interface RenderPrototypeInput {
  spec: SpecBifrostDocument;
  diagnostics: RenderDiagnostic[];
}

export function renderPrototypeHtml(input: RenderPrototypeInput): string {
  const navPages = input.spec.pages.filter((page) => page.nav?.visible);
  const firstPageId = input.spec.pages[0]?.id ?? "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.spec.project.name)}</title>
  <style>${styles()}</style>
</head>
<body>
  <aside class="sidebar">
    <div class="brand">${escapeHtml(input.spec.project.name)}</div>
    ${navPages.map((page) => `<button data-page-id="${escapeHtml(page.id)}">${escapeHtml(page.nav?.label ?? page.title)}</button>`).join("")}
  </aside>
  <main>
    <div class="toolbar"><button data-notes-toggle>显示备注</button></div>
    ${input.diagnostics.length > 0 ? `<div class="warning">当前 JSON 存在错误，预览为上一版有效结果</div>` : ""}
    ${input.spec.pages.map((page, index) => `
      <section class="page" data-page="${escapeHtml(page.id)}" ${index === 0 || page.id === firstPageId ? "" : "hidden"}>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.purpose)}</p>
        ${renderNotes(page.notes)}
        ${page.sections.map((section) => `
          <section class="section">
            ${section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ""}
            ${renderNotes(section.notes)}
            ${section.components.map((component) => `
              <article class="component">
                <h3>${escapeHtml(component.title ?? component.id)}</h3>
                <span class="type">${escapeHtml(component.type)}</span>
                ${renderNotes(component.notes)}
              </article>
            `).join("")}
          </section>
        `).join("")}
      </section>
    `).join("")}
  </main>
  <script>${clientScript()}</script>
</body>
</html>`;
}

function renderNotes(notes: string[] | undefined): string {
  if (!notes || notes.length === 0) return "";
  return `<ul class="notes">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
}

function styles(): string {
  return `
body { margin: 0; font-family: ui-sans-serif, system-ui, sans-serif; background: #f6f7f9; color: #1f2937; display: flex; min-height: 100vh; }
.sidebar { width: 240px; padding: 16px; background: #111827; color: white; display: flex; flex-direction: column; gap: 8px; }
.brand { font-weight: 700; margin-bottom: 12px; }
.sidebar button { text-align: left; border: 0; border-radius: 6px; padding: 10px 12px; background: #1f2937; color: white; cursor: pointer; }
main { flex: 1; padding: 24px; }
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.warning { border: 1px solid #f59e0b; background: #fffbeb; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
.page, .section, .component { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.type { color: #6b7280; font-size: 12px; }
.notes { display: none; border-left: 3px solid #2563eb; background: #eff6ff; margin: 12px 0 0; padding: 8px 8px 8px 24px; }
.show-notes .notes { display: block; }
`;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
```

- [ ] **Step 6: Run tests and build**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/renderer/state.test.ts plugins/spec-bifrost/tests/renderer/render-html.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add plugins/spec-bifrost/src/renderer plugins/spec-bifrost/tests/renderer
git commit -m "feat: render prototype preview shell"
```

## Task 7: Implement Preview Server And CLI Preview/Refresh

**Files:**
- Create: `plugins/spec-bifrost/src/renderer/server.ts`
- Modify: `plugins/spec-bifrost/src/cli/index.ts`
- Modify: `plugins/spec-bifrost/tests/renderer/state.test.ts`

- [ ] **Step 1: Add failing server smoke test**

Append to `plugins/spec-bifrost/tests/renderer/state.test.ts`:

```ts
test("preview server can be imported", async () => {
  const module = await import("../../src/renderer/server.ts");
  assert.equal(typeof module.startPreviewServer, "function");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/renderer/state.test.ts
```

Expected: FAIL because `server.ts` does not exist.

- [ ] **Step 3: Implement preview server**

Create `plugins/spec-bifrost/src/renderer/server.ts`:

```ts
import { readFile, watch } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { SPEC_FILE_NAME } from "../core/constants.js";
import { validateSpec } from "../core/validate.js";
import type { SpecBifrostDocument } from "../core/types.js";
import { renderPrototypeHtml } from "./renderHtml.js";
import { createPreviewState } from "./state.js";

export interface PreviewServerOptions {
  cwd: string;
  port: number;
  host: string;
}

export async function startPreviewServer(options: PreviewServerOptions): Promise<{ url: string; close: () => Promise<void> }> {
  const state = createPreviewState();
  const specPath = resolve(options.cwd, SPEC_FILE_NAME);

  function load(): void {
    readFile(specPath, "utf8", (readError, raw) => {
      if (readError) {
        state.acceptRenderError({ type: "data_format_error", jsonPath: "", message: readError.message });
        return;
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        const result = validateSpec(parsed);
        if (!result.ok) {
          state.acceptRenderError({ type: "data_format_error", jsonPath: result.errors[0]?.path ?? "", message: result.errors[0]?.message ?? "Spec validation failed." });
          return;
        }
        state.acceptGoodSpec(parsed);
      } catch (error) {
        state.acceptRenderError({ type: "data_format_error", jsonPath: "", message: error instanceof Error ? error.message : "Unable to parse JSON." });
      }
    });
  }

  load();
  const watcher = watch(specPath, { persistent: false }, load);

  const server = createServer((request, response) => {
    if (request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    const spec = state.getLastKnownGood() as SpecBifrostDocument | undefined;
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    if (!spec) {
      response.end("<!doctype html><html><body><h1>Spec Bifrost</h1><p>当前没有可预览的有效 JSON。</p></body></html>");
      return;
    }
    response.end(renderPrototypeHtml({ spec, diagnostics: state.getDiagnostics() }));
  });

  await new Promise<void>((resolveStart) => server.listen(options.port, options.host, resolveStart));
  return {
    url: `http://${options.host}:${options.port}`,
    close: async () => {
      watcher.close();
      await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    }
  };
}
```

- [ ] **Step 4: Wire CLI preview**

Modify `plugins/spec-bifrost/src/cli/index.ts` so `preview` starts the server:

```ts
if (command === "preview") {
  const cwd = readFlag(args, "--cwd") ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const port = Number(readFlag(args, "--port") ?? "3737");
  const host = readFlag(args, "--host") ?? "127.0.0.1";
  const { startPreviewServer } = await import("../renderer/server.js");
  const server = await startPreviewServer({ cwd, port, host });
  console.log(`Spec Bifrost preview running at ${server.url}`);
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
}
```

Keep the existing `validate` branch unchanged. Ensure the `preview` branch returns or exits after registering the signal handler so the usage error does not print.

- [ ] **Step 5: Run tests and build**

Run:

```bash
npm test -- plugins/spec-bifrost/tests/renderer/state.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add plugins/spec-bifrost/src/renderer/server.ts plugins/spec-bifrost/src/cli/index.ts plugins/spec-bifrost/tests/renderer/state.test.ts
git commit -m "feat: serve local prototype preview"
```

## Task 8: Add Plugin Skills

**Files:**
- Create: `plugins/spec-bifrost/skills/spec/SKILL.md`
- Create: `plugins/spec-bifrost/skills/spec/schema.md`
- Create: `plugins/spec-bifrost/skills/spec/export.md`
- Create: `plugins/spec-bifrost/skills/spec/examples.md`
- Create: `plugins/spec-bifrost/skills/preview/SKILL.md`
- Create: `plugins/spec-bifrost/skills/validate/SKILL.md`
- Create: `plugins/spec-bifrost/skills/export/SKILL.md`
- Create: `plugins/spec-bifrost/skills/refresh/SKILL.md`

- [ ] **Step 1: Create main spec skill**

Create `plugins/spec-bifrost/skills/spec/SKILL.md`:

```md
---
name: spec
description: Create, modify, and repair the local spec-bifrost.json requirement prototype for a multi-page B-end system.
---

# Spec Bifrost Spec Skill

Use this skill when the user asks to create or modify a Spec Bifrost prototype, describes product requirements, asks to update pages, fields, rules, notes, interactions, or asks to repair hook or renderer errors.

## Core Rules

- The single source of truth is `${CLAUDE_PROJECT_DIR}/spec-bifrost.json`.
- The user should work through chat. Do not ask the product manager to hand-write JSON.
- Keep the JSON page-driven.
- Support a multi-page B-end system, not a single-page flow.
- Use `notes` for product facts that are not stable enough to structure. `notes` may appear on pages, sections, components, fields, actions, and buttons.
- Do not generate production code.
- Do not create API definitions, database design, technical architecture, task breakdowns, or implementation advice.
- Hook and renderer diagnostics contain error facts only. Use this skill and `schema.md` to decide how to repair JSON.

## Supporting References

- Read `schema.md` before creating or repairing JSON.
- Read `export.md` before exporting requirement documents.
- Read `examples.md` when you need a concrete procurement system pattern.
```

- [ ] **Step 2: Create schema reference**

Create `plugins/spec-bifrost/skills/spec/schema.md` by copying the approved schema rules from `docs/superpowers/specs/2026-05-25-spec-bifrost-mvp-design.md` sections 4 through 6. Include the supported component, field, action, condition, and notes lists exactly.

- [ ] **Step 3: Create export reference**

Create `plugins/spec-bifrost/skills/spec/export.md` with the approved frontend/backend export sections from the design document. Include the fixed output files:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

- [ ] **Step 4: Create examples reference**

Create `plugins/spec-bifrost/skills/spec/examples.md`:

```md
# Spec Bifrost Examples

The bundled example is `examples/procurement-system/spec-bifrost.json`.

The example is a complete but simple B-end procurement request management system. It contains:

- Purchase request list page.
- New/edit purchase request page.
- Purchase request detail page.
- Approval handling page.
- Supplier or category reference page.

Use it as a shape reference only. Do not copy business details into unrelated user projects unless the user asks for a procurement system.
```

- [ ] **Step 5: Create validate skill**

Create `plugins/spec-bifrost/skills/validate/SKILL.md`:

```md
---
name: validate
description: Manually validate spec-bifrost.json for JSON syntax, schema, and reference integrity.
---

# Spec Bifrost Validate

Run:

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"
```

If validation fails, read the error facts and repair `spec-bifrost.json` using `/spec-bifrost:spec`. Do not expect the validator to provide repair suggestions.
```

- [ ] **Step 6: Create preview skill**

Create `plugins/spec-bifrost/skills/preview/SKILL.md`:

```md
---
name: preview
description: Start the local Spec Bifrost preview service for spec-bifrost.json.
---

# Spec Bifrost Preview

Run:

```bash
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
```

Open `http://127.0.0.1:3737` in the browser after the service starts.

The preview service does not write `spec-bifrost.json`. It keeps last known good output and reports render error facts.
```

- [ ] **Step 7: Create export skill**

Create `plugins/spec-bifrost/skills/export/SKILL.md`:

```md
---
name: export
description: Export frontend and backend Markdown requirement documents from spec-bifrost.json.
---

# Spec Bifrost Export

1. Run `spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"`.
2. If validation passes, read `${CLAUDE_PROJECT_DIR}/spec-bifrost.json`.
3. Generate:
   - `docs/spec-bifrost/frontend-requirements.md`
   - `docs/spec-bifrost/backend-requirements.md`
4. Keep both files as requirement documents.
5. Do not include API definitions, database tables, technical architecture, code structure, task breakdowns, entity models, or implementation advice.
```

- [ ] **Step 8: Create refresh skill**

Create `plugins/spec-bifrost/skills/refresh/SKILL.md`:

```md
---
name: refresh
description: Refresh the Spec Bifrost preview after spec-bifrost.json changes.
---

# Spec Bifrost Refresh

Use this when the preview service is already running and the user wants a manual refresh.

Run:

```bash
spec-bifrost refresh --cwd "${CLAUDE_PROJECT_DIR}"
```

For the MVP, file watching already refreshes the preview. This command may print that automatic refresh is active.
```

- [ ] **Step 9: Verify skill text**

Run:

```bash
rg -n "suggestion|database table|API definition|implementation advice|待补|修复标记" plugins/spec-bifrost/skills
```

Expected: no matches for placeholder markers. Matches in prohibition text are acceptable if they only state forbidden output.

- [ ] **Step 10: Commit**

```bash
git add plugins/spec-bifrost/skills
git commit -m "docs: add spec bifrost plugin skills"
```

## Task 9: Add Procurement Example System

**Files:**
- Create: `plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json`
- Create: `plugins/spec-bifrost/examples/procurement-system/README.md`

- [ ] **Step 1: Create example JSON**

Create `plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json` with this minimum shape:

```json
{
  "schemaVersion": "1.0",
  "project": {
    "name": "采购申请管理系统",
    "description": "用于创建、审批和跟踪采购申请的内部 B 端系统",
    "actors": ["申请人", "审批人", "采购专员"]
  },
  "optionSets": [
    {
      "id": "purchaseType",
      "label": "采购类型",
      "options": [
        { "value": "office", "label": "办公用品" },
        { "value": "software", "label": "软件服务" },
        { "value": "fixed_asset", "label": "固定资产" }
      ]
    },
    {
      "id": "approvalStatus",
      "label": "审批状态",
      "options": [
        { "value": "draft", "label": "草稿" },
        { "value": "pending", "label": "审批中" },
        { "value": "approved", "label": "已通过" },
        { "value": "rejected", "label": "已驳回" }
      ]
    }
  ],
  "pages": [
    {
      "id": "purchase-list",
      "title": "采购申请列表",
      "purpose": "查看、筛选采购申请，并进入详情或新建申请",
      "route": "/purchases",
      "type": "list",
      "nav": { "visible": true, "label": "采购申请", "group": "采购管理", "order": 10 },
      "notes": ["列表默认展示最近 90 天申请。"],
      "sections": [
        {
          "id": "filters",
          "title": "筛选条件",
          "notes": ["筛选条件用于帮助申请人和审批人快速定位申请。"],
          "components": [
            {
              "id": "purchaseFilters",
              "type": "filterBar",
              "fields": [
                { "id": "status", "label": "审批状态", "type": "select", "optionSetId": "approvalStatus", "notes": ["状态口径以审批流程当前节点为准。"] },
                { "id": "purchaseType", "label": "采购类型", "type": "select", "optionSetId": "purchaseType" }
              ]
            }
          ]
        },
        {
          "id": "table",
          "title": "申请列表",
          "components": [
            {
              "id": "purchaseTable",
              "type": "table",
              "columns": [
                { "id": "requestNo", "label": "申请编号", "type": "text" },
                { "id": "title", "label": "申请标题", "type": "text" },
                { "id": "amount", "label": "申请金额", "type": "currency" },
                { "id": "status", "label": "审批状态", "type": "status", "optionSetId": "approvalStatus" }
              ],
              "actions": [
                { "id": "create", "type": "navigate", "label": "新建申请", "targetPageId": "purchase-edit", "notes": ["申请人从这里发起新的采购申请。"] },
                { "id": "view", "type": "navigate", "label": "查看详情", "targetPageId": "purchase-detail" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "purchase-edit",
      "title": "新建采购申请",
      "purpose": "填写采购申请信息并提交审批",
      "route": "/purchases/new",
      "type": "form",
      "nav": { "visible": true, "label": "新建申请", "group": "采购管理", "order": 20 },
      "sections": [
        {
          "id": "baseInfo",
          "title": "基本信息",
          "components": [
            {
              "id": "purchaseForm",
              "type": "form",
              "fields": [
                { "id": "title", "label": "申请标题", "type": "text", "required": true },
                { "id": "purchaseType", "label": "采购类型", "type": "select", "optionSetId": "purchaseType", "required": true },
                { "id": "amount", "label": "申请金额", "type": "currency", "required": true, "validationRules": ["金额必须大于 0"] },
                { "id": "budgetNote", "label": "预算说明", "type": "textarea", "requiredWhen": { "fieldId": "amount", "operator": "greaterThan", "value": 50000 }, "notes": ["金额超过 50000 时，预算说明是审批关注点。"] },
                { "id": "assetUsage", "label": "资产用途", "type": "textarea", "visibleWhen": { "fieldId": "purchaseType", "operator": "equals", "value": "fixed_asset" } }
              ],
              "actions": [
                { "id": "submit", "type": "submitPrototype", "label": "提交审批", "notes": ["提交后申请人不能修改明细，只能撤回后重新编辑。"] }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "purchase-detail",
      "title": "采购申请详情",
      "purpose": "查看申请信息、明细和审批进度",
      "route": "/purchases/detail",
      "type": "detail",
      "nav": { "visible": false, "label": "申请详情" },
      "sections": [
        {
          "id": "summary",
          "title": "申请摘要",
          "components": [
            {
              "id": "summaryList",
              "type": "descriptionList",
              "fields": [
                { "id": "requestNo", "label": "申请编号", "type": "text" },
                { "id": "status", "label": "审批状态", "type": "status", "optionSetId": "approvalStatus" }
              ]
            },
            {
              "id": "approvalSteps",
              "type": "steps",
              "notes": ["审批步骤只表达业务状态，不模拟真实审批流。"],
              "emptyState": { "title": "暂无审批记录" }
            }
          ]
        }
      ]
    },
    {
      "id": "approval-workbench",
      "title": "审批处理",
      "purpose": "审批人查看待处理申请并填写审批意见",
      "route": "/approvals",
      "type": "approval",
      "nav": { "visible": true, "label": "审批处理", "group": "审批", "order": 30 },
      "sections": [
        {
          "id": "decision",
          "title": "审批意见",
          "components": [
            {
              "id": "approvalForm",
              "type": "form",
              "fields": [
                { "id": "decision", "label": "审批结论", "type": "radio", "options": [{ "value": "approved", "label": "通过" }, { "value": "rejected", "label": "驳回" }], "required": true },
                { "id": "rejectReason", "label": "驳回原因", "type": "textarea", "requiredWhen": { "fieldId": "decision", "operator": "equals", "value": "rejected" } }
              ],
              "actions": [
                { "id": "confirmApproval", "type": "submitPrototype", "label": "提交审批结果" }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "supplier-reference",
      "title": "供应商与品类参考",
      "purpose": "查看采购品类和供应商选择口径",
      "route": "/suppliers",
      "type": "reference",
      "nav": { "visible": true, "label": "供应商参考", "group": "基础信息", "order": 40 },
      "sections": [
        {
          "id": "supplierCards",
          "title": "供应商参考",
          "components": [
            {
              "id": "supplierList",
              "type": "cardList",
              "notes": ["本页只做参考展示，不提供供应商维护能力。"]
            }
          ]
        }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create example README**

Create `plugins/spec-bifrost/examples/procurement-system/README.md`:

```md
# 采购申请管理系统示例

这是 Spec Bifrost MVP 的完整小系统示例，用于验证多页面、字段、规则、交互、备注、校验、预览和导出。

## 试跑

复制示例 JSON 到项目根目录：

```bash
cp plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json spec-bifrost.json
```

校验：

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"
```

预览：

```bash
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
```

导出：

```txt
/spec-bifrost:export
```

## 覆盖能力

- 多页面 B 端系统。
- optionSets。
- 表单、筛选、表格、详情、步骤、卡片。
- 条件显示、条件必填、动作跳转。
- 页面、section、组件、字段、动作和按钮备注。

## 边界

本示例不代表技术实现方案，不包含接口定义、数据库设计、实体模型、代码结构或任务拆分。
```

- [ ] **Step 3: Validate example**

Run:

```bash
npm run build
plugins/spec-bifrost/bin/spec-bifrost validate --cwd plugins/spec-bifrost/examples/procurement-system
```

Expected: `Spec Bifrost validation passed.`

- [ ] **Step 4: Commit**

```bash
git add plugins/spec-bifrost/examples
git commit -m "feat: add procurement system example"
```

## Task 10: Add README And SECURITY

**Files:**
- Create: `plugins/spec-bifrost/README.md`
- Create: `plugins/spec-bifrost/SECURITY.md`

- [ ] **Step 1: Create plugin README**

Create `plugins/spec-bifrost/README.md`:

```md
# Spec Bifrost

Spec Bifrost is a Claude Code plugin for creating page-driven B-end requirement prototypes from a local `spec-bifrost.json` file.

## What It Does

- Guides Claude to create and modify `spec-bifrost.json` through chat.
- Validates JSON syntax, schema, and references.
- Starts a local preview for multi-page B-end prototypes.
- Keeps last known good preview output when the current JSON cannot render.
- Guides Claude to export frontend and backend Markdown requirement documents.

## What It Does Not Do

- It does not generate production code.
- It does not create API definitions.
- It does not create database tables.
- It does not create technical architecture.
- It does not create task breakdowns.
- It does not persist preview input data.
- It does not upload requirement data.

## Commands

```txt
/spec-bifrost:spec
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:refresh
/spec-bifrost:export
```

## Local CLI

```bash
spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR}"
spec-bifrost preview --cwd "${CLAUDE_PROJECT_DIR}" --host 127.0.0.1 --port 3737
spec-bifrost refresh --cwd "${CLAUDE_PROJECT_DIR}"
```

## Example

Use `examples/procurement-system/spec-bifrost.json` to try the full flow.
```

- [ ] **Step 2: Create SECURITY**

Create `plugins/spec-bifrost/SECURITY.md`:

```md
# Security

Spec Bifrost handles local product requirement assets.

## Local Files

The plugin reads the current project `spec-bifrost.json`.

Claude may create or modify `spec-bifrost.json` when the user asks to create or change a prototype.

The export skill writes:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## Local Preview

The preview service binds to `127.0.0.1` by default.

Preview input values stay in browser memory and are not written back to JSON.

## Network

The plugin does not upload `spec-bifrost.json` or exported documents.

## Hooks And Renderer

The validation hook reports error facts only.

The renderer reports render error facts only.

Neither hook nor renderer writes `spec-bifrost.json`.
```

- [ ] **Step 3: Verify docs**

Run:

```bash
rg -n "API definitions|database tables|technical architecture|task breakdowns|upload" plugins/spec-bifrost/README.md plugins/spec-bifrost/SECURITY.md
```

Expected: matches only in sections that describe forbidden or absent behavior.

- [ ] **Step 4: Commit**

```bash
git add plugins/spec-bifrost/README.md plugins/spec-bifrost/SECURITY.md
git commit -m "docs: add plugin usage and security docs"
```

## Task 11: Final Verification

**Files:**
- Modify only files needed to fix verification failures found in this task.

- [ ] **Step 1: Run full check**

Run:

```bash
npm run check
```

Expected: TypeScript build PASS and all Node tests PASS.

- [ ] **Step 2: Validate bundled example**

Run:

```bash
plugins/spec-bifrost/bin/spec-bifrost validate --cwd plugins/spec-bifrost/examples/procurement-system
```

Expected:

```txt
Spec Bifrost validation passed.
```

- [ ] **Step 3: Start preview manually**

Run:

```bash
plugins/spec-bifrost/bin/spec-bifrost preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737
```

Expected: terminal prints:

```txt
Spec Bifrost preview running at http://127.0.0.1:3737
```

Open `http://127.0.0.1:3737` in the Codex in-app browser. Verify:

- Sidebar navigation shows采购申请, 新建申请, 审批处理, 供应商参考.
- 页面标题展示正确。
- 显示备注按钮 can reveal notes.
- No blank page is shown.

- [ ] **Step 4: Verify no repair suggestions leak**

Run:

```bash
rg -n "suggestion|建议修复|how to fix" plugins/spec-bifrost/src plugins/spec-bifrost/hooks plugins/spec-bifrost/skills
```

Expected: no matches in hook or renderer diagnostic output. Matches are acceptable only if a skill says validators do not provide suggestions.

- [ ] **Step 5: Verify forbidden export content is documented**

Run:

```bash
rg -n "接口定义|数据库|技术架构|任务拆分|实体模型|领域对象" plugins/spec-bifrost/skills plugins/spec-bifrost/README.md plugins/spec-bifrost/SECURITY.md
```

Expected: matches only in prohibition text.

- [ ] **Step 6: Inspect git status**

Run:

```bash
git status --short
```

Expected: no unexpected files. Build output under `plugins/spec-bifrost/dist/` and `node_modules/` should be ignored.

- [ ] **Step 7: Commit final verification fixes if any**

If files were changed during verification:

```bash
git add <changed-files>
git commit -m "fix: resolve mvp verification issues"
```

If no files changed, do not create an empty commit.

## Self-Review

Spec coverage:

- Schema contract: Tasks 2, 3, and 9.
- Notes on page, section, component, field, action, and button: Tasks 2, 6, 8, and 9.
- Hook facts only: Task 5.
- Renderer last known good and render facts only: Tasks 6 and 7.
- Preview interaction shell: Tasks 6 and 7.
- Export guidance as Claude skill, not deterministic exporter: Task 8.
- Public marketplace preparation: Tasks 1, 8, 10, and 11.
- Procurement example system: Task 9.
- Security and data boundaries: Task 10.

Placeholder scan:

- The plan contains no placeholder markers.
- Each task names exact files and exact verification commands.

Type consistency:

- `SpecBifrostDocument`, `ValidationResult`, `SpecDiagnostic`, `RenderDiagnostic`, and public functions are introduced before later tasks use them.
- CLI commands use `validate`, `preview`, `refresh`, and `diagnostics` consistently.
