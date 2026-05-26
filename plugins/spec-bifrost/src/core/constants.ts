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
