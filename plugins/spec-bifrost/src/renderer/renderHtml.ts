import type { ActionSpec, ComponentSpec, ConditionSpec, FieldSpec, OptionSet, OptionValue, SpecBifrostDocument } from "../core/types.js";
import { clientScript } from "./clientScript.js";
import type { RenderDiagnostic } from "./state.js";

export interface RenderPrototypeInput {
  spec: SpecBifrostDocument;
  diagnostics: RenderDiagnostic[];
}

export function renderPrototypeHtml(input: RenderPrototypeInput): string {
  const context = createRenderContext(input.spec);
  const navPages = input.spec.pages
    .filter((page) => page.nav?.visible)
    .sort((left, right) => (left.nav?.order ?? 0) - (right.nav?.order ?? 0));
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
    <div class="brand">
      <div class="brand-mark">${escapeHtml(input.spec.project.name.slice(0, 1))}</div>
      <div>
        <strong>${escapeHtml(input.spec.project.name)}</strong>
        <span>${escapeHtml(input.spec.project.description)}</span>
      </div>
    </div>
    ${renderNavigation(navPages, firstPageId)}
  </aside>
  <main>
    <div class="topbar">
      <div class="actor-list">${input.spec.project.actors.map((actor) => `<span>${escapeHtml(actor)}</span>`).join("")}</div>
      <button class="ghost-button" data-notes-toggle>显示备注</button>
    </div>
    ${input.diagnostics.length > 0 ? `<div class="warning">当前 JSON 存在错误，预览为上一版有效结果</div>` : ""}
    ${input.spec.pages
      .map(
        (page, index) => `
      <section class="page" data-page="${escapeHtml(page.id)}" ${index === 0 || page.id === firstPageId ? "" : "hidden"}>
        <header class="page-header">
          <h1>${escapeHtml(page.title)}</h1>
          <p>${escapeHtml(page.purpose)}</p>
          ${renderNotes(page.notes)}
        </header>
        ${page.sections
          .map(
            (section) => `
          <section class="section">
            ${renderSectionHeading(section.title, section.notes)}
            ${section.components.map((component) => renderComponent(component, context)).join("")}
          </section>
        `
          )
          .join("")}
      </section>
    `
      )
      .join("")}
  </main>
  <script>${clientScript()}</script>
</body>
</html>`;
}

interface RenderContext {
  optionSets: Map<string, OptionSet>;
}

function createRenderContext(spec: SpecBifrostDocument): RenderContext {
  return {
    optionSets: new Map((spec.optionSets ?? []).map((optionSet) => [optionSet.id, optionSet]))
  };
}

function renderSectionHeading(title: string | undefined, notes: string[] | undefined): string {
  return `${title ? `<div class="section-heading"><h2>${escapeHtml(title)}</h2></div>` : ""}${renderNotesBlock(notes, "section-notes")}`;
}

function renderNavigation(navPages: SpecBifrostDocument["pages"], firstPageId: string): string {
  const groups = new Map<string, SpecBifrostDocument["pages"]>();
  navPages.forEach((page) => {
    const group = page.nav?.group ?? "系统页面";
    groups.set(group, [...(groups.get(group) ?? []), page]);
  });

  return `<nav class="nav">${Array.from(groups.entries())
    .map(
      ([group, pages]) => `
      <section class="nav-group">
        <div class="nav-group-title">${escapeHtml(group)}</div>
        ${pages
          .map(
            (page) =>
              `<button class="${page.id === firstPageId ? "active" : ""}" data-page-id="${escapeHtml(page.id)}">${escapeHtml(
                page.nav?.label ?? page.title
              )}</button>`
          )
          .join("")}
      </section>`
    )
    .join("")}</nav>`;
}

function renderComponent(component: ComponentSpec, context: RenderContext): string {
  switch (component.type) {
    case "filterBar":
      return renderFilterBar(component, context);
    case "table":
      return renderTable(component, context);
    case "form":
      return renderForm(component, context);
    case "descriptionList":
      return renderDescriptionList(component, context);
    case "steps":
      return renderSteps(component);
    case "cardList":
      return renderCardList(component);
    case "emptyState":
      return renderEmptyState(component.emptyState);
    case "alert":
      return renderAlert(component);
    case "actionBar":
      return renderActionBar(component.actions);
    case "textBlock":
    case "pageHeader":
    case "section":
    case "tabs":
    case "modal":
    case "drawer":
      return renderSimpleComponent(component, context);
    default:
      return renderSimpleComponent(component, context);
  }
}

function renderComponentTitle(component: ComponentSpec): string {
  if (!component.title && (!component.notes || component.notes.length === 0)) return "";
  return `${component.title ? `<div class="component-title"><h3>${escapeHtml(component.title)}</h3></div>` : ""}${renderNotesBlock(component.notes, "component-notes")}`;
}

function renderFilterBar(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? [];
  return `
    ${renderComponentTitle(component)}
    <form class="filter-bar">
      ${fields.map((field) => renderFieldControl(field, context, "filter")).join("")}
      <div class="filter-actions">
        <button type="button" class="primary-button">查询</button>
        <button type="reset" class="secondary-button">重置</button>
      </div>
    </form>
  `;
}

function renderTable(component: ComponentSpec, context: RenderContext): string {
  const columns = component.columns ?? component.fields ?? [];
  const actions = component.actions ?? [];
  const rowActions = actions.filter(isRowAction);
  const toolbarActions = actions.filter((action) => !isRowAction(action));

  return `
    <div class="table-shell">
      <div class="table-toolbar">
        <div>${renderComponentTitle(component)}</div>
        ${toolbarActions.length > 0 ? `<div class="table-actions">${toolbarActions.map((action) => renderActionButton(action, "primary")).join("")}</div>` : ""}
      </div>
      <table class="data-table">
        <thead>
          <tr>
            ${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}
            ${rowActions.length > 0 ? "<th>操作</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${renderTableRows(component, columns, rowActions, context)}
        </tbody>
      </table>
      ${columns.length === 0 ? renderEmptyState(component.emptyState ?? { title: "暂无字段配置" }) : ""}
    </div>
  `;
}

function renderTableRows(component: ComponentSpec, columns: FieldSpec[], rowActions: ActionSpec[], context: RenderContext): string {
  if (columns.length === 0) return "";
  const records = normalizeRecords(component.items);
  const rows = records.length > 0 ? records : [0, 1, 2].map((index) => sampleRecord(columns, index, context));
  return rows
    .slice(0, 3)
    .map(
      (record) => `
        <tr>
          ${columns.map((column) => `<td>${renderTableCell(record[column.id], column, context)}</td>`).join("")}
          ${rowActions.length > 0 ? `<td class="row-actions">${rowActions.map((action) => renderActionButton(action, "text")).join("")}</td>` : ""}
        </tr>
      `
    )
    .join("");
}

function normalizeRecords(items: unknown[] | undefined): Array<Record<string, unknown>> {
  if (!items) return [];
  return items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function sampleRecord(columns: FieldSpec[], index: number, context: RenderContext): Record<string, unknown> {
  return Object.fromEntries(columns.map((column) => [column.id, sampleValue(column, index, context)]));
}

function renderForm(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? [];
  return `
    ${renderComponentTitle(component)}
    <form class="business-form">
      <div class="form-grid">
        ${fields.map((field) => renderFieldControl(field, context, "form")).join("")}
      </div>
      ${renderActionBar(component.actions)}
    </form>
  `;
}

function renderDescriptionList(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? [];
  return `
    ${renderComponentTitle(component)}
    <dl class="description-list">
      ${fields
        .map(
          (field, index) => `
          <div>
            <dt>${escapeHtml(field.label)}</dt>
            <dd>${renderTableCell(sampleValue(field, index, context), field, context)}</dd>
            ${renderFieldHelp(field)}
          </div>
        `
        )
        .join("")}
    </dl>
  `;
}

function renderSteps(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无进度记录" })}`;
  return `
    ${renderComponentTitle(component)}
    <ol class="steps-list">
      ${records
        .map(
          (record, index) => `
          <li>
            <span>${index + 1}</span>
            <div>
              <strong>${escapeHtml(record.title ?? record.label ?? `步骤 ${index + 1}`)}</strong>
              ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}
            </div>
          </li>
        `
        )
        .join("")}
    </ol>
  `;
}

function renderCardList(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) {
    return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无参考数据", description: "后续可在 JSON 中补充卡片条目。" })}`;
  }
  return `
    ${renderComponentTitle(component)}
    <div class="card-list">
      ${records
        .map(
          (record) => `
          <article>
            <strong>${escapeHtml(record.title ?? record.name ?? "未命名条目")}</strong>
            ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderAlert(component: ComponentSpec): string {
  return `<div class="inline-alert">${renderComponentTitle(component)}${component.emptyState?.description ? escapeHtml(component.emptyState.description) : ""}</div>`;
}

function renderSimpleComponent(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? component.columns ?? [];
  return `
    <div class="simple-component">
      ${renderComponentTitle(component)}
      ${fields.length > 0 ? `<div class="form-grid">${fields.map((field) => renderFieldControl(field, context, "form")).join("")}</div>` : ""}
      ${renderActionBar(component.actions)}
      ${fields.length === 0 && !component.actions?.length ? renderEmptyState(component.emptyState ?? { title: "暂无内容配置" }) : ""}
    </div>
  `;
}

function renderFieldControl(field: FieldSpec, context: RenderContext, mode: "filter" | "form"): string {
  const requiredMarker = `<b class="required" data-required-marker ${field.required ? "" : "hidden"}>*</b>`;
  return `
    <label class="form-field ${field.type === "textarea" ? "textarea-field" : ""}" data-field-shell data-field-id="${escapeHtml(field.id)}" data-required-static="${field.required ? "true" : "false"}"${renderConditionAttribute("data-visible-when", field.visibleWhen)}${renderConditionAttribute("data-enabled-when", field.enabledWhen)}${renderConditionAttribute("data-required-when", field.requiredWhen)}>
      <span>${escapeHtml(field.label)}${requiredMarker}</span>
      ${renderControl(field, context, mode)}
      ${mode === "form" ? renderFieldHelp(field) : renderNotesBlock(field.notes, "field-notes")}
    </label>
  `;
}

function renderControl(field: FieldSpec, context: RenderContext, mode: "filter" | "form"): string {
  const options = getOptions(field, context);
  const controlAttrs = `data-field-control data-field-id="${escapeHtml(field.id)}"`;
  if (field.type === "textarea") {
    return `<textarea id="field-${escapeHtml(field.id)}" ${controlAttrs} rows="4" placeholder="请输入${escapeHtml(field.label)}"></textarea>`;
  }
  if (options.length > 0 || ["select", "multiSelect", "radio", "status"].includes(field.type)) {
    const multiple = field.type === "multiSelect" ? " multiple" : "";
    return `<select id="field-${escapeHtml(field.id)}" ${controlAttrs}${multiple}>${renderOptions(options, mode)}</select>`;
  }
  if (field.type === "switch" || field.type === "checkbox") {
    return `<label class="switch-control"><input id="field-${escapeHtml(field.id)}" type="checkbox" ${controlAttrs} /><span></span></label>`;
  }
  if (field.type === "file") {
    return `<input id="field-${escapeHtml(field.id)}" type="file" ${controlAttrs} />`;
  }
  if (field.type === "date" || field.type === "dateRange") {
    return `<input id="field-${escapeHtml(field.id)}" type="date" ${controlAttrs} />`;
  }
  if (field.type === "number" || field.type === "currency") {
    return `<input id="field-${escapeHtml(field.id)}" type="number" ${controlAttrs} placeholder="请输入${escapeHtml(field.label)}" />`;
  }
  return `<input id="field-${escapeHtml(field.id)}" type="text" ${controlAttrs} placeholder="请输入${escapeHtml(field.label)}" />`;
}

function renderOptions(options: OptionValue[], mode: "filter" | "form"): string {
  if (options.length === 0) return `<option value="">请选择</option>`;
  return `<option value="">${mode === "filter" ? "全部" : "请选择"}</option>${options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("")}`;
}

function renderFieldHelp(field: FieldSpec): string {
  const facts = [
    field.meaning,
    ...(field.validationRules ?? []),
    ...(field.displayRules ?? []),
    field.visibleWhen ? "存在条件显示规则" : undefined,
    field.requiredWhen ? "存在条件必填规则" : undefined,
    field.enabledWhen ? "存在条件启用规则" : undefined
  ].filter(Boolean);

  return `${facts.length > 0 ? `<div class="field-help">${facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("")}</div>` : ""}${renderNotesBlock(field.notes, "field-notes")}`;
}

function renderActionBar(actions: ActionSpec[] | undefined): string {
  if (!actions || actions.length === 0) return "";
  return `<div class="actions">${actions.map((action, index) => `<div>${renderActionButton(action, index === 0 ? "primary" : "secondary")}${renderNotes(action.notes)}</div>`).join("")}</div>`;
}

function renderActionButton(action: ActionSpec, tone: "primary" | "secondary" | "text"): string {
  const className = tone === "primary" ? "primary-button" : tone === "secondary" ? "secondary-button" : "text-button";
  const target = action.targetPageId ? ` data-target-page-id="${escapeHtml(action.targetPageId)}"` : "";
  const message = action.message ? ` data-message="${escapeHtml(action.message)}"` : "";
  return `<button type="button" class="${className}" data-action-button data-action-type="${escapeHtml(action.type)}"${target}${renderConditionAttribute("data-action-when", action.actionWhen)}${message}>${escapeHtml(action.label)}</button>`;
}

function isRowAction(action: ActionSpec): boolean {
  return /view|detail|edit|approve/i.test(action.id) || /查看|详情|编辑|处理|审批/.test(action.label);
}

function renderTableCell(value: unknown, field: FieldSpec, context: RenderContext): string {
  const text = escapeHtml(value ?? sampleValue(field, 0, context));
  if (field.type === "status") return `<span class="status-tag">${text}</span>`;
  if (field.type === "tag") return `<span class="tag">${text}</span>`;
  return text;
}

function sampleValue(field: FieldSpec, index: number, context: RenderContext): string {
  const options = getOptions(field, context);
  if (options[0]) return options[Math.min(index, options.length - 1)]?.label ?? options[0].label;
  if (/no|code|编号/i.test(field.id)) return `REQ-2026-${String(index + 1).padStart(3, "0")}`;
  if (field.type === "currency") return ["¥12,800.00", "¥48,600.00", "¥6,200.00"][index] ?? "¥9,800.00";
  if (field.type === "number") return String([8, 16, 24][index] ?? 1);
  if (field.type === "date" || field.type === "dateRange") return "2026-05-26";
  if (field.type === "user") return ["李明", "周然", "陈悦"][index] ?? "李明";
  if (field.type === "department") return ["行政部", "研发部", "财务部"][index] ?? "行政部";
  if (/title|name|名称|标题/i.test(field.id + field.label)) return `${field.label}示例 ${index + 1}`;
  return "待填写";
}

function getOptions(field: FieldSpec, context: RenderContext): OptionValue[] {
  return field.options ?? (field.optionSetId ? context.optionSets.get(field.optionSetId)?.options : undefined) ?? [];
}

function renderEmptyState(emptyState: ComponentSpec["emptyState"]): string {
  const title = emptyState?.title ?? "暂无数据";
  return `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      ${emptyState?.description ? `<p>${escapeHtml(emptyState.description)}</p>` : ""}
      ${renderNotes(emptyState?.notes)}
    </div>
  `;
}

function renderNotes(notes: string[] | undefined): string {
  if (!notes || notes.length === 0) return "";
  return `<ul class="notes">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
}

function renderNotesBlock(notes: string[] | undefined, className: string): string {
  if (!notes || notes.length === 0) return "";
  return `<div class="${className}">${renderNotes(notes)}</div>`;
}

function styles(): string {
  return `
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --panel: #ffffff;
  --panel-soft: #f9fafb;
  --ink: #1f2937;
  --muted: #6b7280;
  --line: #e5e7eb;
  --line-strong: #d1d5db;
  --accent: #2563eb;
  --accent-soft: #eff6ff;
  --success: #0f766e;
  --success-soft: #ecfdf5;
  --warn-bg: #fffbeb;
  --warn-line: #f59e0b;
  --danger: #dc2626;
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  background: var(--bg);
  color: var(--ink);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 14px;
}
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.45; }
.sidebar {
  width: 272px;
  flex: 0 0 272px;
  min-height: 100vh;
  padding: 20px 16px;
  background: var(--panel);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.brand { display: grid; grid-template-columns: 40px 1fr; gap: 12px; align-items: center; min-width: 0; }
.brand-mark {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  font-weight: 700;
}
.brand strong { display: block; font-size: 15px; line-height: 1.35; }
.brand span {
  display: -webkit-box;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.nav, .nav-group { display: flex; flex-direction: column; gap: 6px; }
.nav { gap: 18px; }
.nav-group-title { padding: 0 10px; color: #9ca3af; font-size: 12px; font-weight: 600; }
.nav button {
  width: 100%;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px;
  background: transparent;
  color: #374151;
  text-align: left;
}
.nav button:hover { background: var(--panel-soft); }
.nav button.active { border-color: #bfdbfe; background: var(--accent-soft); color: #1d4ed8; font-weight: 600; }
main { flex: 1; min-width: 0; padding: 22px 24px 40px; }
.topbar {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.actor-list { display: flex; flex-wrap: wrap; gap: 8px; }
.actor-list span, .tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--panel);
  color: #4b5563;
  font-size: 12px;
}
.ghost-button, .secondary-button, .primary-button, .text-button {
  min-height: 32px;
  border-radius: 6px;
  padding: 6px 12px;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.ghost-button, .secondary-button {
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: #374151;
}
.ghost-button:hover, .secondary-button:hover { border-color: #93c5fd; color: var(--accent); }
.primary-button {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #ffffff;
}
.primary-button:hover { background: #1d4ed8; border-color: #1d4ed8; }
.text-button {
  border: 0;
  background: transparent;
  color: var(--accent);
  padding-inline: 4px;
}
.text-button:hover { color: #1d4ed8; text-decoration: underline; }
.warning {
  border: 1px solid var(--warn-line);
  background: var(--warn-bg);
  padding: 12px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.prototype-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 10;
  max-width: min(360px, calc(100vw - 48px));
  border-radius: 8px;
  background: #111827;
  color: #ffffff;
  padding: 10px 14px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.22);
}
.page { max-width: 1440px; }
.page-header {
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: 6px; font-size: 24px; line-height: 1.25; }
h2 { margin-bottom: 0; font-size: 16px; line-height: 1.4; }
h3 { margin-bottom: 0; font-size: 14px; line-height: 1.4; }
p { color: var(--muted); line-height: 1.6; }
.page-header p { margin-bottom: 0; }
.section {
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
.section-heading, .component-title { margin-bottom: 14px; }
.section-notes { margin: -6px 0 14px; }
.component-notes { margin: -6px 0 12px; }
.field-notes { margin-top: 0; }
.field-notes .notes { max-width: none; }
.component-title:empty { display: none; }
.filter-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  align-items: start;
  gap: 12px;
}
.filter-actions { display: flex; gap: 8px; align-self: start; padding-top: 27px; }
.business-form { display: flex; flex-direction: column; gap: 18px; }
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 16px;
}
.form-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
  color: #374151;
  font-weight: 600;
}
.form-field > span { display: inline-flex; align-items: center; gap: 2px; }
.textarea-field { grid-column: 1 / -1; }
.required { color: var(--danger); font-style: normal; margin-left: 2px; }
input, select, textarea {
  width: 100%;
  min-height: 36px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #ffffff;
  color: var(--ink);
  padding: 7px 10px;
  outline: none;
}
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.field-help {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}
.field-help span {
  border-radius: 6px;
  background: var(--panel-soft);
  padding: 3px 7px;
}
.actions, .table-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.actions > div { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.table-shell { overflow-x: auto; }
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.data-table {
  width: 100%;
  min-width: 720px;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.data-table th, .data-table td {
  border-bottom: 1px solid var(--line);
  padding: 12px 14px;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}
.data-table th {
  background: var(--panel-soft);
  color: #4b5563;
  font-weight: 600;
}
.data-table tr:last-child td { border-bottom: 0; }
.data-table tbody tr:hover { background: #f9fbff; }
.row-actions { display: flex; gap: 10px; }
.status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border-radius: 999px;
  padding: 2px 10px;
  background: var(--success-soft);
  color: var(--success);
  font-size: 12px;
  font-weight: 600;
}
.description-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0;
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}
.description-list div { padding: 12px 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.description-list dt { color: var(--muted); font-size: 12px; }
.description-list dd { margin: 6px 0 0; font-weight: 600; }
.steps-list { display: flex; flex-direction: column; gap: 12px; margin: 0; padding: 0; list-style: none; }
.steps-list li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: start; }
.steps-list li > span {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
}
.card-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card-list article, .empty-state, .simple-component, .inline-alert {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-soft);
  padding: 14px;
}
.empty-state { color: var(--muted); text-align: center; }
.empty-state strong { display: block; color: var(--ink); margin-bottom: 4px; }
.switch-control { width: 48px; }
.switch-control input { width: auto; min-height: auto; }
.notes {
  display: none;
  max-width: 780px;
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  color: #1e40af;
  margin: 8px 0 0;
  padding: 8px 10px 8px 24px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
}
.show-notes .notes { display: block; }
[hidden] { display: none !important; }
@media (max-width: 900px) {
  body { display: block; }
  .sidebar {
    width: 100%;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .nav { gap: 10px; }
  .nav-group { flex-direction: row; flex-wrap: wrap; }
  .nav-group-title { width: 100%; }
  .nav button { width: auto; }
  main { padding: 16px; }
  .topbar { align-items: flex-start; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .filter-actions { grid-column: 1 / -1; }
}
`;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderConditionAttribute(name: string, condition: ConditionSpec | undefined): string {
  if (!condition) return "";
  return ` ${name}="${escapeHtml(JSON.stringify(condition))}"`;
}
