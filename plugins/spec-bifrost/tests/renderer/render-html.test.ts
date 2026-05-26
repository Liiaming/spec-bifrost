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
