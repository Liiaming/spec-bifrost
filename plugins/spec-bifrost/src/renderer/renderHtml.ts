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
  <div class="app-frame">
    <aside class="sidebar" aria-label="页面导航">
      <div class="brand">
        <div class="brand-mark">${escapeHtml(input.spec.project.name.slice(0, 1))}</div>
        <div class="brand-copy">
          <strong>${escapeHtml(input.spec.project.name)}</strong>
          <span>${escapeHtml(input.spec.project.description)}</span>
        </div>
      </div>
      ${renderNavigation(navPages, firstPageId)}
      <div class="sidebar-footer">本地预览 · ${input.spec.pages.length} 个页面</div>
    </aside>
    <main class="workspace">
      <div class="topbar">
        <div class="context-strip">
          <span class="topbar-label">角色</span>
          <div class="actor-list">${input.spec.project.actors.map((actor) => `<span>${escapeHtml(actor)}</span>`).join("")}</div>
        </div>
        <button class="ghost-button" data-notes-toggle>显示备注</button>
      </div>
      ${input.diagnostics.length > 0 ? `<div class="warning">当前 JSON 存在错误，预览为上一版有效结果</div>` : ""}
      ${input.spec.pages
        .map(
          (page, index) => `
        <section class="page" data-page="${escapeHtml(page.id)}" ${index === 0 || page.id === firstPageId ? "" : "hidden"}>
          <header class="page-header">
            <div class="page-meta">
              <span>${escapeHtml(formatPageType(page.type))}</span>
              <span>${escapeHtml(page.route)}</span>
            </div>
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
  </div>
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
              `<button type="button" class="${page.id === firstPageId ? "active" : ""}" data-page-id="${escapeHtml(page.id)}">
                <span class="nav-page-label">${escapeHtml(page.nav?.label ?? page.title)}</span>
                <span class="nav-page-type">${escapeHtml(formatPageType(page.type))}</span>
              </button>`
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
    case "editableTable":
      return renderEditableTable(component, context);
    case "treeTable":
      return renderTreeTable(component, context);
    case "comparisonTable":
      return renderComparisonTable(component, context);
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
    case "chart":
      return renderChart(component);
    case "calendar":
      return renderCalendar(component);
    case "gantt":
      return renderGantt(component);
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
    case "form":
      return renderForm(component, context);
    case "descriptionList":
      return renderDescriptionList(component, context);
    case "steps":
      return renderSteps(component);
    case "metricList":
      return renderMetricList(component);
    case "timeline":
      return renderTimeline(component);
    case "treeList":
      return renderTreeList(component);
    case "cardList":
      return renderCardList(component);
    case "emptyState":
      return renderEmptyState(component.emptyState);
    case "alert":
      return renderAlert(component);
    case "actionBar":
      return renderActionPanel(component);
    case "tabs":
      return renderTabs(component);
    case "modal":
      return renderModal(component, context);
    case "drawer":
      return renderDrawer(component, context);
    case "textBlock":
    case "pageHeader":
    case "section":
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
        <div class="table-title-stack">
          ${renderComponentTitle(component)}
          <span class="table-summary">${columns.length} 个字段 · ${normalizeRecords(component.items).length || 3} 条示例数据</span>
        </div>
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

function renderMetricList(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无指标配置" })}`;
  return `
    ${renderComponentTitle(component)}
    <div class="metric-list">
      ${records
        .map(
          (record) => `
          <article class="metric-card">
            <span>${escapeHtml(record.label ?? record.title ?? "指标")}</span>
            <strong>${escapeHtml(record.value ?? "-")}</strong>
            ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}
            ${record.trend ? `<em>${escapeHtml(record.trend)}</em>` : ""}
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function renderTabs(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无分组内容" })}`;
  return `
    ${renderComponentTitle(component)}
    <div class="tabs-preview">
      <div class="tab-buttons">
        ${records.map((record, index) => `<button type="button" class="${index === 0 ? "active" : ""}">${escapeHtml(record.label ?? record.title ?? `分组 ${index + 1}`)}</button>`).join("")}
      </div>
      <div class="tab-panels">
        ${records
          .map(
            (record, index) => `
            <section ${index === 0 ? "" : "hidden"}>
              <strong>${escapeHtml(record.title ?? record.label ?? `分组 ${index + 1}`)}</strong>
              ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}
            </section>
          `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderModal(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? [];
  return `
    <div class="modal-preview">
      <div class="modal-surface">
        ${renderComponentTitle(component)}
        ${fields.length > 0 ? `<div class="form-grid">${fields.map((field) => renderFieldControl(field, context, "form")).join("")}</div>` : ""}
        ${renderActionBar(component.actions)}
        ${fields.length === 0 && !component.actions?.length ? renderEmptyState(component.emptyState ?? { title: "暂无弹窗内容" }) : ""}
      </div>
    </div>
  `;
}

function renderDrawer(component: ComponentSpec, context: RenderContext): string {
  const fields = component.fields ?? [];
  return `
    <aside class="drawer-preview">
      ${renderComponentTitle(component)}
      ${fields.length > 0 ? `<div class="form-grid drawer-grid">${fields.map((field) => renderFieldControl(field, context, "form")).join("")}</div>` : ""}
      ${renderActionBar(component.actions)}
      ${fields.length === 0 && !component.actions?.length ? renderEmptyState(component.emptyState ?? { title: "暂无抽屉内容" }) : ""}
    </aside>
  `;
}

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

function renderChart(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  const maxValue = Math.max(1, ...records.map((record) => (typeof record.value === "number" ? record.value : Number(record.value) || 0)));
  return `
    ${renderComponentTitle(component)}
    <div class="chart-preview">
      ${records
        .map((record) => {
          const value = typeof record.value === "number" ? record.value : Number(record.value) || 0;
          return `<div class="chart-row"><span>${escapeHtml(record.label ?? record.title ?? "分类")}</span><div><i style="width:${Math.round((value / maxValue) * 100)}%"></i></div><strong>${escapeHtml(record.value ?? "-")}</strong></div>`;
        })
        .join("")}
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

function renderTimeline(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无时间线记录" })}`;
  return `
    ${renderComponentTitle(component)}
    <ol class="timeline-list">
      ${records
        .map(
          (record) => `
          <li>
            <time>${escapeHtml(record.time ?? record.date ?? "")}</time>
            <div>
              <strong>${escapeHtml(record.title ?? record.label ?? "时间线节点")}</strong>
              ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ""}
              ${record.status ? `<span class="status-tag">${escapeHtml(record.status)}</span>` : ""}
            </div>
          </li>
        `
        )
        .join("")}
    </ol>
  `;
}

function renderTreeList(component: ComponentSpec): string {
  const records = normalizeRecords(component.items);
  if (records.length === 0) return `${renderComponentTitle(component)}${renderEmptyState(component.emptyState ?? { title: "暂无层级数据" })}`;
  return `
    ${renderComponentTitle(component)}
    ${renderTreeNodes(records, true)}
  `;
}

function renderTreeNodes(records: Array<Record<string, unknown>>, isRoot = false): string {
  return `<ul class="tree-list${isRoot ? " tree-root" : ""}">${records
    .map((record) => {
      const children = normalizeRecords(Array.isArray(record.children) ? record.children : undefined);
      return `
        <li>
          <div class="tree-node">
            <strong>${escapeHtml(record.title ?? record.label ?? record.name ?? "未命名节点")}</strong>
            ${record.description ? `<span>${escapeHtml(record.description)}</span>` : ""}
          </div>
          ${children.length > 0 ? renderTreeNodes(children) : ""}
        </li>
      `;
    })
    .join("")}</ul>`;
}

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

function renderActionPanel(component: ComponentSpec): string {
  return `
    <div class="action-panel">
      ${renderComponentTitle(component)}
      ${renderActionBar(component.actions)}
      ${!component.actions?.length ? renderEmptyState(component.emptyState ?? { title: "暂无操作配置" }) : ""}
    </div>
  `;
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
    return `<textarea id="field-${escapeHtml(field.id)}" ${controlAttrs} rows="4" placeholder="请输入${escapeHtml(field.label)}…"></textarea>`;
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
    return `<input id="field-${escapeHtml(field.id)}" type="number" ${controlAttrs} placeholder="请输入${escapeHtml(field.label)}…" />`;
  }
  return `<input id="field-${escapeHtml(field.id)}" type="text" ${controlAttrs} placeholder="请输入${escapeHtml(field.label)}…" />`;
}

function renderOptions(options: OptionValue[], mode: "filter" | "form"): string {
  if (options.length === 0) return `<option value="">请选择…</option>`;
  return `<option value="">${mode === "filter" ? "全部" : "请选择…"}</option>${options
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
  if (/batch|bulk/i.test(action.id) || /批量/.test(action.label)) return false;
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

function formatPageType(type: string): string {
  const labels: Record<string, string> = {
    approval: "审批页",
    detail: "详情页",
    edit: "编辑页",
    form: "表单页",
    list: "列表页",
    reference: "参考页"
  };
  return labels[type] ?? type;
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

function renderRelationList(component: ComponentSpec): string {
  if (!component.relations || component.relations.length === 0) return "";
  return `<ol class="relation-list">${component.relations.map((relation) => `<li><span>${escapeHtml(relation.sourceId)}</span><strong>${escapeHtml(relation.label ?? relation.type ?? "关联")}</strong><span>${escapeHtml(relation.targetId)}</span>${renderNotes(relation.notes)}</li>`).join("")}</ol>`;
}

function renderProgressBar(value: unknown): string {
  const numericValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `<div class="progress-bar" aria-label="完成度 ${numericValue}%"><span style="width:${numericValue}%"></span><em>${numericValue}%</em></div>`;
}

function styles(): string {
  return `
:root {
  color-scheme: light;
  --bg: #f6f7f9;
  --paper: #ffffff;
  --panel: #ffffff;
  --panel-soft: #f8fafc;
  --ink: #111827;
  --muted: #64748b;
  --faint: #94a3b8;
  --line: #e5e7eb;
  --line-strong: #d1d5db;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --accent-soft: #eff6ff;
  --accent-tint: #f8fbff;
  --attention: #b45309;
  --attention-soft: #fffbeb;
  --success: #047857;
  --success-soft: #ecfdf5;
  --warn-bg: #fffbeb;
  --warn-line: #f59e0b;
  --danger: #dc2626;
  --shadow: 0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 24px rgba(15, 23, 42, 0.06);
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
button, input, select, textarea { font: inherit; }
button {
  cursor: pointer;
  touch-action: manipulation;
}
button:disabled { cursor: not-allowed; opacity: 0.45; }
button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.42);
  outline-offset: 2px;
}
.app-frame {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  position: sticky;
  top: 0;
  width: 286px;
  flex: 0 0 286px;
  height: 100vh;
  min-height: 100vh;
  padding: 20px 16px 18px;
  background: var(--panel);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-y: auto;
}
.brand { display: grid; grid-template-columns: 44px 1fr; gap: 12px; align-items: center; min-width: 0; }
.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid var(--line-strong);
  background: #f9fafb;
  color: var(--accent);
  font-weight: 700;
}
.brand-copy { min-width: 0; }
.brand-copy strong { display: block; font-size: 15px; line-height: 1.35; font-weight: 650; overflow-wrap: anywhere; }
.brand-copy span {
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
.nav { gap: 18px; flex: 1; }
.nav-group-title {
  padding: 0 10px;
  color: var(--faint);
  font-size: 12px;
  font-weight: 650;
}
.nav button {
  position: relative;
  width: 100%;
  min-height: 46px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 10px 8px 13px;
  background: transparent;
  color: #334155;
  text-align: left;
  overflow: hidden;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}
.nav button::before {
  content: "";
  position: absolute;
  inset: 8px auto 8px 0;
  width: 3px;
  border-radius: 99px;
  background: transparent;
}
.nav button:hover { background: #f8fafc; border-color: var(--line); }
.nav button.active {
  border-color: rgba(37, 99, 235, 0.24);
  background: var(--accent-soft);
  color: var(--accent-strong);
}
.nav button.active::before { background: var(--accent); }
.nav-page-label {
  display: block;
  overflow-wrap: anywhere;
  font-weight: 650;
}
.nav-page-type {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}
.sidebar-footer {
  border-top: 1px solid var(--line);
  padding: 14px 10px 0;
  color: var(--muted);
  font-size: 12px;
}
.workspace {
  flex: 1;
  min-width: 0;
  padding: 22px 32px 46px;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 4;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: -22px -32px 24px;
  padding: 13px 32px;
  border-bottom: 1px solid var(--line);
  background: rgba(246, 247, 249, 0.92);
  backdrop-filter: blur(14px);
}
.context-strip { display: flex; align-items: center; gap: 10px; min-width: 0; }
.topbar-label {
  color: var(--faint);
  font-size: 12px;
  font-weight: 650;
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
  color: #334155;
  font-size: 12px;
}
.ghost-button, .secondary-button, .primary-button, .text-button {
  min-height: 34px;
  border-radius: 6px;
  padding: 7px 12px;
  font-weight: 650;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, box-shadow 140ms ease;
}
.ghost-button, .secondary-button {
  border: 1px solid var(--line-strong);
  background: var(--panel);
  color: #334155;
}
.ghost-button:hover, .secondary-button:hover { border-color: rgba(37, 99, 235, 0.44); color: var(--accent-strong); background: #f8fafc; }
.primary-button {
  border: 1px solid var(--accent);
  background: var(--accent);
  color: #ffffff;
}
.primary-button:hover { background: var(--accent-strong); border-color: var(--accent-strong); box-shadow: 0 1px 2px rgba(15, 23, 42, 0.14); }
.text-button {
  border: 0;
  background: transparent;
  color: var(--accent);
  padding-inline: 4px;
}
.text-button:hover { color: var(--accent-strong); text-decoration: underline; }
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
  padding: 11px 14px;
  box-shadow: var(--shadow);
}
.page { max-width: 1380px; }
.page-header {
  margin-bottom: 26px;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--line);
}
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: 8px; font-size: 28px; line-height: 1.2; font-weight: 700; text-wrap: balance; }
h2 { margin-bottom: 0; font-size: 16px; line-height: 1.4; font-weight: 700; text-wrap: balance; }
h3 { margin-bottom: 0; font-size: 14px; line-height: 1.4; font-weight: 700; text-wrap: balance; }
p { color: var(--muted); line-height: 1.6; }
.page-header p { margin-bottom: 0; }
.page-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.page-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  color: var(--muted);
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 650;
}
.section {
  margin-bottom: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.section-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
}
.section-heading::before {
  content: "";
  width: 3px;
  height: 17px;
  border-radius: 99px;
  background: var(--accent);
}
.component-title { margin-bottom: 12px; }
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
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.filter-actions { display: flex; gap: 8px; align-self: start; padding-top: 27px; }
.business-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 18px;
  box-shadow: var(--shadow);
}
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
  color: #334155;
  font-weight: 650;
}
.form-field > span { display: inline-flex; align-items: center; gap: 2px; }
.textarea-field { grid-column: 1 / -1; }
.required { color: var(--danger); font-style: normal; margin-left: 2px; }
input, select, textarea {
  width: 100%;
  min-height: 38px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background: #ffffff;
  color: var(--ink);
  padding: 7px 10px;
  outline: none;
}
textarea { resize: vertical; }
input:focus, select:focus, textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14); }
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
  background: #f8fafc;
  padding: 3px 7px;
}
.actions, .table-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.actions > div { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.table-shell, .editable-table-shell, .tree-table-shell, .comparison-table-shell {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid var(--line);
}
.table-title-stack { min-width: 0; }
.table-summary {
  display: block;
  color: var(--muted);
  font-size: 12px;
}
.data-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
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
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}
.data-table tr:last-child td { border-bottom: 0; }
.data-table tbody tr:hover { background: var(--accent-tint); }
.data-table td { font-variant-numeric: tabular-nums; }
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
td.row-actions { display: flex; gap: 10px; }
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
  background: var(--panel);
  box-shadow: var(--shadow);
}
.description-list div { padding: 14px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.description-list dt { color: var(--muted); font-size: 12px; }
.description-list dd { margin: 6px 0 0; font-weight: 650; font-variant-numeric: tabular-nums; }
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  list-style: none;
  box-shadow: var(--shadow);
}
.steps-list li {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 12px;
  align-items: start;
  padding: 10px 4px;
}
.steps-list li > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 650;
}
.metric-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}
.metric-card {
  min-height: 132px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.metric-card span { color: var(--muted); font-size: 12px; font-weight: 650; }
.metric-card strong { display: block; margin-top: 8px; font-size: 26px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric-card p { margin: 8px 0 0; }
.metric-card em { display: inline-block; margin-top: 10px; color: var(--attention); font-size: 12px; font-style: normal; font-weight: 650; }
.tabs-preview {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.tab-buttons {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
  background: var(--panel-soft);
  padding: 8px 10px 0;
  overflow-x: auto;
}
.tab-buttons button {
  min-height: 36px;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 6px 6px 0 0;
  background: transparent;
  color: var(--muted);
  padding: 8px 12px;
  font-weight: 650;
  white-space: nowrap;
  transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
}
.tab-buttons button.active {
  background: #ffffff;
  border-color: var(--line);
  color: var(--accent-strong);
}
.tab-panels { padding: 14px; }
.tab-panels section p { margin: 6px 0 0; }
.modal-preview, .drawer-preview, .action-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.modal-preview {
  display: grid;
  place-items: center;
  min-height: 260px;
  background: #f8fafc;
}
.modal-surface {
  width: min(620px, 100%);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
  box-shadow: var(--shadow);
}
.drawer-preview {
  width: min(560px, 100%);
  margin-left: auto;
  border-right: 3px solid var(--accent);
  overscroll-behavior: contain;
}
.drawer-grid { grid-template-columns: 1fr; }
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
.timeline-list {
  margin: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  list-style: none;
  box-shadow: var(--shadow);
}
.timeline-list li {
  position: relative;
  display: grid;
  grid-template-columns: minmax(120px, 170px) 1fr;
  gap: 16px;
  padding: 12px 4px 12px 22px;
}
.timeline-list li::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 19px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent);
}
.timeline-list time { color: var(--muted); font-size: 12px; font-weight: 650; font-variant-numeric: tabular-nums; }
.timeline-list p { margin: 4px 0 0; }
.tree-list {
  margin: 0;
  padding: 8px 0 8px 18px;
  list-style: none;
}
.tree-root {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.tree-list .tree-list {
  border-left: 1px dashed var(--line-strong);
  margin-left: 8px;
}
.tree-list li { padding: 5px 10px 5px 0; }
.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
}
.tree-node strong::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--accent);
  margin-right: 8px;
}
.tree-node span { color: var(--muted); font-size: 12px; }
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
.card-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.card-list article, .empty-state, .simple-component, .inline-alert {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  padding: 14px;
  box-shadow: var(--shadow);
}
.inline-alert {
  border-color: rgba(180, 83, 9, 0.28);
  background: var(--attention-soft);
}
.empty-state { color: var(--muted); text-align: center; }
.empty-state strong { display: block; color: var(--ink); margin-bottom: 4px; }
.switch-control { width: 48px; }
.switch-control input { width: auto; min-height: auto; }
.notes {
  display: none;
  max-width: 780px;
  border: 1px solid rgba(37, 99, 235, 0.22);
  border-left: 3px solid var(--accent);
  border-radius: 6px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  margin: 8px 0 0;
  padding: 8px 10px 8px 24px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.55;
}
.show-notes .notes { display: block; }
[hidden] { display: none !important; }
@media (prefers-reduced-motion: no-preference) {
  .page:not([hidden]) { animation: page-in 180ms ease-out; }
  @keyframes page-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
}
@media (max-width: 900px) {
  .app-frame { display: block; }
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .nav { gap: 10px; }
  .nav-group { flex-direction: row; flex-wrap: wrap; }
  .nav-group-title { width: 100%; }
  .nav button { width: auto; }
  .workspace { padding: 16px; }
  .topbar { position: static; align-items: flex-start; flex-direction: column; margin: -16px -16px 18px; padding: 14px 16px; }
  .context-strip { align-items: flex-start; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .filter-bar { grid-template-columns: 1fr; }
  .filter-actions { grid-column: 1 / -1; padding-top: 0; }
  .table-toolbar { align-items: flex-start; flex-direction: column; }
  h1 { font-size: 25px; }
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
