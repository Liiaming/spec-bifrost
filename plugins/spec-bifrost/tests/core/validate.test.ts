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
