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
  const component = spec.pages[0]!.sections[0]!.components[0]! as unknown as Record<string, unknown>;
  component["type"] = "chart";

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

test("navigating actions require targetPageId", () => {
  const spec = validSpec();
  spec.pages[0]!.sections[0]!.components[0]!.actions = [
    {
      id: "detail",
      type: "navigate",
      label: "查看详情"
    },
    {
      id: "submit",
      type: "submitPrototype",
      label: "提交后进入详情",
      actionWhen: { fieldId: "status", operator: "equals", value: "pending" }
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[0].actions[0].targetPageId",
      "pages[0].sections[0].components[0].actions[1].targetPageId"
    ]
  );
});

test("duplicate page and optionSet ids fail as schema errors", () => {
  const spec = validSpec();
  spec.pages.push({
    ...spec.pages[0]!,
    title: "重复页面"
  });
  spec.optionSets!.push({
    id: "approvalStatus",
    label: "重复状态",
    options: [{ value: "draft", label: "草稿" }]
  });

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    ["optionSets[1].id", "pages[1].id"]
  );
});

test("duplicate field ids in the same page fail as schema errors", () => {
  const spec = validSpec();
  spec.pages[0]!.sections[0]!.components.push({
    id: "statusTable",
    type: "table",
    columns: [{ id: "status", label: "审批状态", type: "status", optionSetId: "approvalStatus" }]
  });

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "schema_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections[0].components[1].columns[0].id");
});

test("malformed nav declarations return schema errors", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  pages.push({
    id: "hidden-detail",
    title: "隐藏详情",
    purpose: "查看隐藏详情",
    route: "/hidden-detail",
    type: "detail",
    nav: "not-an-object",
    sections: []
  });
  pages[0]!["nav"] = {
    visible: "yes",
    label: "",
    group: 10,
    order: "first"
  };

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    ["pages[0].nav.visible", "pages[0].nav.label", "pages[0].nav.group", "pages[0].nav.order", "pages[1].nav"]
  );
});

test("project actors and field rule arrays must contain strings", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const project = spec["project"] as Record<string, unknown>;
  project["actors"] = ["申请人", 123];
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  const fields = components[0]!["fields"] as Array<Record<string, unknown>>;
  fields[0]!["validationRules"] = ["必须选择状态", null];
  fields[0]!["displayRules"] = "not-an-array";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "project.actors[1]",
      "pages[0].sections[0].components[0].fields[0].validationRules[1]",
      "pages[0].sections[0].components[0].fields[0].displayRules"
    ]
  );
});

test("optional display fields must match their schema types", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  sections[0]!["title"] = 123;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  components[0]!["title"] = false;
  components[0]!["emptyState"] = {
    title: "",
    description: 10,
    notes: [false]
  };
  const fields = components[0]!["fields"] as Array<Record<string, unknown>>;
  fields[0]!["meaning"] = 123;
  fields[0]!["required"] = "yes";
  components[0]!["actions"] = [
    {
      id: "toast",
      type: "showMessage",
      label: "提示",
      message: 100
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].title",
      "pages[0].sections[0].components[0].title",
      "pages[0].sections[0].components[0].emptyState.title",
      "pages[0].sections[0].components[0].emptyState.description",
      "pages[0].sections[0].components[0].emptyState.notes",
      "pages[0].sections[0].components[0].fields[0].meaning",
      "pages[0].sections[0].components[0].fields[0].required",
      "pages[0].sections[0].components[0].actions[0].message"
    ]
  );
});

test("malformed page sections return schema errors instead of throwing", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  pages[0]!["sections"] = "not-an-array";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "schema_error");
  assert.equal(result.errors[0]?.path, "pages[0].sections");
});

test("malformed array elements return schema errors instead of throwing", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  spec["optionSets"] = [null];
  spec["pages"] = [
    {
      id: "purchase-list",
      title: "采购申请列表",
      purpose: "查看采购申请",
      route: "/purchases",
      type: "list",
      sections: [
        {
          id: "main",
          components: [
            {
              id: "statusFilter",
              type: "filterBar",
              fields: [null],
              columns: ["not-an-object"],
              actions: [false]
            }
          ]
        },
        "not-an-object"
      ]
    },
    null
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "optionSets[0]",
      "pages[0].sections[0].components[0].fields[0]",
      "pages[0].sections[0].components[0].columns[0]",
      "pages[0].sections[0].components[0].actions[0]",
      "pages[0].sections[1]",
      "pages[1]"
    ]
  );
});

test("reference diagnostics preserve original indexes when array elements are malformed", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  components[0]!["fields"] = [
    null,
    {
      id: "status",
      label: "审批状态",
      type: "select",
      optionSetId: "missingStatus"
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    ["pages[0].sections[0].components[0].fields[0]", "pages[0].sections[0].components[0].fields[1].optionSetId"]
  );
});

test("malformed component arrays return schema errors instead of throwing", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  components[0]!["fields"] = "not-an-array";
  components[0]!["columns"] = "not-an-array";
  components[0]!["actions"] = "not-an-array";
  components[0]!["items"] = "not-an-array";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[0].fields",
      "pages[0].sections[0].components[0].columns",
      "pages[0].sections[0].components[0].actions",
      "pages[0].sections[0].components[0].items"
    ]
  );
});

test("malformed option arrays return schema errors before preview rendering", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const optionSets = spec["optionSets"] as Array<Record<string, unknown>>;
  optionSets[0]!["options"] = "not-an-array";
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  const fields = components[0]!["fields"] as Array<Record<string, unknown>>;
  fields[0]!["options"] = "not-an-array";

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    ["optionSets[0].options", "pages[0].sections[0].components[0].fields[0].options"]
  );
});

test("malformed conditions return schema errors instead of throwing", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  const fields = components[0]!["fields"] as Array<Record<string, unknown>>;
  fields[0]!["visibleWhen"] = null;
  fields[0]!["requiredWhen"] = {
    all: [null],
    any: "not-an-array"
  };
  components[0]!["actions"] = [
    {
      id: "submit",
      type: "submitPrototype",
      label: "提交",
      actionWhen: "not-an-object"
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[0].fields[0].visibleWhen",
      "pages[0].sections[0].components[0].fields[0].requiredWhen.all[0]",
      "pages[0].sections[0].components[0].fields[0].requiredWhen.any",
      "pages[0].sections[0].components[0].actions[0].actionWhen"
    ]
  );
});

test("condition leaf objects require fieldId and operator", () => {
  const spec = validSpec() as unknown as Record<string, unknown>;
  const pages = spec["pages"] as Array<Record<string, unknown>>;
  const sections = pages[0]!["sections"] as Array<Record<string, unknown>>;
  const components = sections[0]!["components"] as Array<Record<string, unknown>>;
  const fields = components[0]!["fields"] as Array<Record<string, unknown>>;
  fields[0]!["visibleWhen"] = {};
  fields[0]!["enabledWhen"] = { fieldId: "status" };
  fields[0]!["requiredWhen"] = { operator: "notEmpty" };
  components[0]!["actions"] = [
    {
      id: "conditionalSubmit",
      type: "submitPrototype",
      label: "提交",
      targetPageId: "purchase-list",
      actionWhen: { any: [{ fieldId: "status", operator: "equals", value: "pending" }] }
    }
  ];

  const result = validateSpec(spec);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.errors.map((diagnostic) => diagnostic.path),
    [
      "pages[0].sections[0].components[0].fields[0].visibleWhen.fieldId",
      "pages[0].sections[0].components[0].fields[0].visibleWhen.operator",
      "pages[0].sections[0].components[0].fields[0].enabledWhen.operator",
      "pages[0].sections[0].components[0].fields[0].requiredWhen.fieldId"
    ]
  );
});

test("invalid JSON returns syntax diagnostic", async () => {
  const { readSpecFile } = await import("../../src/core/readSpec.ts");
  const result = await readSpecFile(new URL("data:application/json,{bad-json}"));

  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.type, "json_syntax_error");
});
