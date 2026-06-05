import assert from "node:assert/strict";
import test from "node:test";
import type { SpecBifrostDocument } from "../../src/core/types.ts";
import { renderPrototypeHtml } from "../../src/renderer/renderHtml.ts";

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
  assert.match(html, /列表页/);
  assert.match(html, /\/list/);
  assert.match(html, /列表页用于日常跟踪/);
});

test("renderPrototypeHtml renders business components instead of schema cards", () => {
  const spec: SpecBifrostDocument = {
    schemaVersion: "1.0",
    project: { name: "采购申请管理系统", description: "测试系统", actors: ["申请人"] },
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
        id: "list",
        title: "采购申请列表",
        purpose: "查看申请",
        route: "/list",
        type: "list",
        nav: { visible: true, label: "采购申请", group: "采购管理", order: 1 },
        sections: [
          {
            id: "filters",
            title: "筛选条件",
            components: [
              {
                id: "purchaseFilters",
                type: "filterBar",
                fields: [{ id: "status", label: "审批状态", type: "select", optionSetId: "approvalStatus" }]
              }
            ]
          },
          {
            id: "table",
            title: "申请列表",
            components: [
              {
                id: "purchaseTable",
                type: "table",
                columns: [
                  { id: "requestNo", label: "申请编号", type: "text" },
                  { id: "amount", label: "申请金额", type: "currency" },
                  { id: "status", label: "审批状态", type: "status", optionSetId: "approvalStatus" }
                ],
                actions: [{ id: "view", type: "navigate", label: "查看详情", targetPageId: "detail" }]
              }
            ]
          }
        ]
      },
      {
        id: "edit",
        title: "新建采购申请",
        purpose: "填写申请",
        route: "/edit",
        type: "form",
        nav: { visible: true, label: "新建申请", group: "采购管理", order: 2 },
        sections: [
          {
            id: "base",
            title: "基本信息",
            components: [
              {
                id: "purchaseForm",
                type: "form",
                fields: [
                  { id: "title", label: "申请标题", type: "text", required: true },
                  { id: "amount", label: "申请金额", type: "currency", validationRules: ["金额必须大于 0"] },
                  { id: "remark", label: "备注", type: "textarea" }
                ],
                actions: [{ id: "submit", type: "submitPrototype", label: "提交审批" }]
              }
            ]
          }
        ]
      },
      {
        id: "detail",
        title: "采购申请详情",
        purpose: "查看详情",
        route: "/detail",
        type: "detail",
        nav: { visible: false, label: "详情" },
        sections: []
      }
    ]
  };

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /<form class="filter-bar"/);
  assert.match(html, /<select id="field-status"/);
  assert.match(html, /<option value="pending">审批中<\/option>/);
  assert.match(html, /<table class="data-table"/);
  assert.match(html, /3 个字段 · 3 条示例数据/);
  assert.match(html, /<th>申请编号<\/th>/);
  assert.match(html, /<td>REQ-2026-001<\/td>/);
  assert.match(html, /<button type="button" class="text-button" data-action-button data-action-type="navigate" data-target-page-id="detail">查看详情<\/button>/);
  assert.match(html, /<div class="form-grid"/);
  assert.match(html, /<input id="field-title" type="text"/);
  assert.match(html, /<textarea id="field-remark"/);
  assert.match(html, /金额必须大于 0/);
  assert.doesNotMatch(html, />filterBar<\/span>/);
  assert.doesNotMatch(html, /purchaseFilters/);
  assert.doesNotMatch(html, /purchaseTable/);
});

test("renderPrototypeHtml keeps notes out of heading and filter alignment rows", () => {
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
        sections: [
          {
            id: "filters",
            title: "筛选条件",
            notes: ["筛选条件用于快速定位申请。"],
            components: [
              {
                id: "purchaseFilters",
                type: "filterBar",
                fields: [{ id: "status", label: "审批状态", type: "select", notes: ["状态口径以当前节点为准。"] }]
              }
            ]
          }
        ]
      }
    ]
  };

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /<div class="section-heading"><h2>筛选条件<\/h2><\/div>\s*<div class="section-notes">/);
  assert.match(html, /<div class="field-notes">/);
  assert.doesNotMatch(html, /\.filter-bar\s*\{[^}]*align-items:\s*end/);
});

test("renderPrototypeHtml emits condition metadata and runtime hooks", () => {
  const spec: SpecBifrostDocument = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试系统", actors: ["申请人"] },
    pages: [
      {
        id: "edit",
        title: "新建采购申请",
        purpose: "填写申请",
        route: "/edit",
        type: "form",
        nav: { visible: true, label: "新建申请", order: 1 },
        sections: [
          {
            id: "base",
            title: "基本信息",
            components: [
              {
                id: "purchaseForm",
                type: "form",
                fields: [
                  { id: "amount", label: "申请金额", type: "currency", required: true },
                  {
                    id: "budgetNote",
                    label: "预算说明",
                    type: "textarea",
                    requiredWhen: { fieldId: "amount", operator: "greaterThan", value: 50000 }
                  },
                  {
                    id: "assetUsage",
                    label: "资产用途",
                    type: "textarea",
                    visibleWhen: { fieldId: "purchaseType", operator: "equals", value: "fixed_asset" }
                  }
                ],
                actions: [
                  {
                    id: "submitHighAmount",
                    type: "submitPrototype",
                    label: "提交大额审批",
                    targetPageId: "approval",
                    actionWhen: { fieldId: "amount", operator: "greaterThan", value: 50000 },
                    message: "已进入大额审批"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "approval",
        title: "审批处理",
        purpose: "处理审批",
        route: "/approval",
        type: "approval",
        sections: []
      }
    ]
  };

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /data-field-shell/);
  assert.match(html, /data-field-control data-field-id="amount"/);
  assert.match(html, /data-required-when="\{&quot;fieldId&quot;:&quot;amount&quot;,&quot;operator&quot;:&quot;greaterThan&quot;,&quot;value&quot;:50000\}"/);
  assert.match(html, /data-visible-when="\{&quot;fieldId&quot;:&quot;purchaseType&quot;,&quot;operator&quot;:&quot;equals&quot;,&quot;value&quot;:&quot;fixed_asset&quot;\}"/);
  assert.match(html, /data-action-when="\{&quot;fieldId&quot;:&quot;amount&quot;,&quot;operator&quot;:&quot;greaterThan&quot;,&quot;value&quot;:50000\}"/);
  assert.match(html, /data-message="已进入大额审批"/);
  assert.match(html, /addEventListener\("input", applyCurrentPageConditions\)/);
  assert.match(html, /addEventListener\("change", applyCurrentPageConditions\)/);
  assert.match(html, /function evaluateCondition/);
});

test("renderPrototypeHtml renders requirement expressiveness components", () => {
  const spec = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试系统", actors: ["申请人", "审批人"] },
    pages: [
      {
        id: "detail",
        title: "采购申请详情",
        purpose: "查看复杂采购申请",
        route: "/detail",
        type: "detail",
        nav: { visible: true, label: "详情", order: 1 },
        sections: [
          {
            id: "overview",
            title: "审批概览",
            components: [
              {
                id: "approvalMetrics",
                type: "metricList",
                title: "关键指标",
                items: [
                  { label: "审批中", value: "12", description: "当前待处理申请", trend: "较昨日 +3" },
                  { label: "大额申请", value: "4", description: "超过 50000 元" }
                ]
              },
              {
                id: "detailTabs",
                type: "tabs",
                title: "详情分组",
                items: [
                  { label: "基础信息", description: "申请标题、金额、供应商信息" },
                  { label: "审批记录", description: "节点、处理人和处理意见" }
                ]
              },
              {
                id: "attachmentDrawer",
                type: "drawer",
                title: "附件抽屉",
                fields: [{ id: "contractFile", label: "合同附件", type: "file", notes: ["支持表达上传和附件归档需求。"] }],
                actions: [{ id: "close", type: "closeDrawer", label: "关闭抽屉" }]
              },
              {
                id: "rejectModal",
                type: "modal",
                title: "驳回确认弹窗",
                fields: [{ id: "rejectReason", label: "驳回原因", type: "textarea", required: true }],
                actions: [{ id: "confirmReject", type: "showMessage", label: "确认驳回", message: "已记录驳回意见" }]
              },
              {
                id: "approvalTimeline",
                type: "timeline",
                title: "审批时间线",
                items: [
                  { title: "提交申请", time: "2026-06-01 09:00", description: "申请人提交采购需求" },
                  { title: "部门负责人审批", time: "2026-06-01 10:00", description: "确认预算归属" }
                ]
              },
              {
                id: "categoryTree",
                type: "treeList",
                title: "采购分类树",
                items: [
                  {
                    title: "办公用品",
                    description: "行政采购",
                    children: [{ title: "显示器" }, { title: "工位耗材" }]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  } as SpecBifrostDocument;

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /<div class="metric-list"/);
  assert.match(html, /<strong>12<\/strong>/);
  assert.match(html, /<div class="tabs-preview"/);
  assert.match(html, /<button type="button" class="active">基础信息<\/button>/);
  assert.match(html, /<aside class="drawer-preview"/);
  assert.match(html, /<input id="field-contractFile" type="file"/);
  assert.match(html, /<div class="modal-preview"/);
  assert.match(html, /驳回确认弹窗/);
  assert.match(html, /<ol class="timeline-list"/);
  assert.match(html, /2026-06-01 10:00/);
  assert.match(html, /<ul class="tree-list"/);
  assert.match(html, /显示器/);
  assert.doesNotMatch(html, /暂无内容配置/);
});

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

test("renderPrototypeHtml keeps batch table actions in the toolbar", () => {
  const spec: SpecBifrostDocument = {
    schemaVersion: "1.0",
    project: { name: "采购申请", description: "测试系统", actors: ["审批人"] },
    pages: [
      {
        id: "approval",
        title: "审批工作台",
        purpose: "批量处理采购申请",
        route: "/approval",
        type: "approval",
        nav: { visible: true, label: "审批", order: 1 },
        sections: [
          {
            id: "table",
            components: [
              {
                id: "approvalTable",
                type: "table",
                columns: [{ id: "requestNo", label: "申请编号", type: "text" }],
                actions: [
                  { id: "batchApprove", type: "showMessage", label: "批量审批", message: "已批量审批" },
                  { id: "viewDetail", type: "navigate", label: "查看详情", targetPageId: "detail" }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "detail",
        title: "详情",
        purpose: "查看详情",
        route: "/detail",
        type: "detail",
        sections: []
      }
    ]
  };

  const html = renderPrototypeHtml({ spec, diagnostics: [] });

  assert.match(html, /<div class="table-actions"><button type="button" class="primary-button" data-action-button data-action-type="showMessage" data-message="已批量审批">批量审批<\/button><\/div>/);
  assert.match(html, /<td class="row-actions"><button type="button" class="text-button" data-action-button data-action-type="navigate" data-target-page-id="detail">查看详情<\/button><\/td>/);
});
