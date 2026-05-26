# Spec Bifrost Schema

`spec-bifrost.json` is page-driven. It represents a complete but simple multi-page B-end system through pages, sections, components, fields, actions, conditions, rules, and notes.

## Top-Level Shape

```json
{
  "schemaVersion": "1.0",
  "project": {
    "name": "采购申请管理系统",
    "description": "用于创建、审批和跟踪采购申请的内部 B 端系统",
    "actors": ["申请人", "审批人", "采购专员"]
  },
  "optionSets": [],
  "pages": []
}
```

`optionSets` stores reusable option lists only. It is not a business object model and not a rules library.

Navigation is derived from `pages[].nav`. Do not create a separate top-level navigation tree.

Do not put export instructions in the project JSON. Export behavior is defined by this plugin.

## Page Fields

Each page should include:

- `id`
- `title`
- `purpose`
- `route`
- `type`
- `sections`
- optional `nav`
- optional `notes`

Supported page types:

- `list`
- `form`
- `detail`
- `approval`
- `reference`

## Components

Supported component types:

- `pageHeader`
- `section`
- `form`
- `filterBar`
- `table`
- `descriptionList`
- `cardList`
- `steps`
- `tabs`
- `alert`
- `emptyState`
- `modal`
- `drawer`
- `actionBar`
- `textBlock`

Do not use unsupported components such as chart, tree, calendar, transfer, tour, carousel, rate, colorPicker, qrCode, or watermark in the MVP.

## Fields

Supported field types:

- `text`
- `textarea`
- `number`
- `currency`
- `date`
- `dateRange`
- `time`
- `select`
- `multiSelect`
- `radio`
- `checkbox`
- `switch`
- `user`
- `department`
- `file`
- `status`
- `tag`

Common field properties:

- `label`
- `meaning`
- `required`
- `defaultValue`
- `options`
- `optionSetId`
- `validationRules`
- `displayRules`
- `visibleWhen`
- `enabledWhen`
- `requiredWhen`
- `notes`

## Actions

Supported action types:

- `navigate`
- `openModal`
- `closeModal`
- `openDrawer`
- `closeDrawer`
- `setFieldValue`
- `submitPrototype`
- `resetFields`
- `showMessage`

`submitPrototype` expresses a product action only. It does not call an API, persist data, or simulate backend behavior.

## Conditions

Supported condition slots:

- `visibleWhen`
- `enabledWhen`
- `requiredWhen`
- `actionWhen`

Supported operators:

- `equals`
- `notEquals`
- `in`
- `notIn`
- `empty`
- `notEmpty`
- `greaterThan`
- `greaterThanOrEqual`
- `lessThan`
- `lessThanOrEqual`
- `contains`

Use `all` and `any` for condition groups. Do not use arbitrary expression strings.

## Notes

`notes` is a general requirement fact container. It may appear on:

- pages
- sections
- components
- fields
- actions
- buttons

Use `notes` for product facts that are not stable enough to structure, such as business nuance, field口径, special boundaries, history, or action caveats.

`notes` must not contain implementation advice.

## Reference Integrity

- `pageId` must reference an existing page.
- `fieldId` must reference a field in the current page.
- `optionSetId` must reference `optionSets`.
- `action.targetPageId` must reference an existing page.
- Condition field references must exist.
