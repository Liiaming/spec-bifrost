import {
  SUPPORTED_ACTION_TYPES,
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_CONDITION_OPERATORS,
  SUPPORTED_FIELD_TYPES,
  SUPPORTED_PAGE_TYPES
} from "./constants.js";
import type { ActionSpec, ComponentSpec, ConditionOperator, ConditionSpec, FieldSpec, OptionSet, OptionValue, PageSpec, SpecBifrostDocument } from "./types.js";
import type { SpecDiagnostic, ValidationResult } from "./diagnostics.js";

export function validateSpec(input: unknown): ValidationResult {
  const errors: SpecDiagnostic[] = [];
  if (!isRecord(input)) {
    return fail("schema_error", "", "Spec root must be an object.", input);
  }

  const spec = input as unknown as SpecBifrostDocument;
  if (spec.schemaVersion !== "1.0") {
    errors.push(error("schema_error", "schemaVersion", 'schemaVersion must be "1.0".', spec.schemaVersion));
  }
  if (!isRecord(spec.project)) {
    errors.push(error("schema_error", "project", "project must be an object.", spec.project));
  } else {
    requireString(spec.project.name, "project.name", errors);
    requireString(spec.project.description, "project.description", errors);
    if (!Array.isArray(spec.project.actors)) {
      errors.push(error("schema_error", "project.actors", "project.actors must be an array.", spec.project.actors));
    } else {
      validateStringArray(spec.project.actors, "project.actors", "actors", errors);
    }
  }
  if (spec.optionSets !== undefined && !Array.isArray(spec.optionSets)) {
    errors.push(error("schema_error", "optionSets", "optionSets must be an array.", spec.optionSets));
  } else {
    spec.optionSets?.forEach((optionSet, optionSetIndex) => validateOptionSet(optionSet, `optionSets[${optionSetIndex}]`, errors));
  }
  if (!Array.isArray(spec.pages)) {
    errors.push(error("schema_error", "pages", "pages must be an array.", spec.pages));
    return { ok: errors.length === 0, errors };
  }

  spec.pages.forEach((page, pageIndex) => validatePage(page, `pages[${pageIndex}]`, errors));
  validateUniqueIds(spec, errors);
  validateReferences(spec, errors);
  return { ok: errors.length === 0, errors };
}

function validatePage(page: PageSpec, path: string, errors: SpecDiagnostic[]): void {
  if (!isRecord(page)) {
    errors.push(error("schema_error", path, "page must be an object.", page));
    return;
  }
  requireString(page.id, `${path}.id`, errors);
  requireString(page.title, `${path}.title`, errors);
  requireString(page.purpose, `${path}.purpose`, errors);
  requireString(page.route, `${path}.route`, errors);
  if (!SUPPORTED_PAGE_TYPES.includes(page.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported page type "${String(page.type)}".`, page.type));
  }
  validateNavigation(page.nav, `${path}.nav`, errors);
  validateNotes(page.notes, `${path}.notes`, errors);
  if (!Array.isArray(page.sections)) {
    errors.push(error("schema_error", `${path}.sections`, "sections must be an array.", page.sections));
    return;
  }
  page.sections.forEach((section, sectionIndex) => {
    const sectionPath = `${path}.sections[${sectionIndex}]`;
    if (!isRecord(section)) {
      errors.push(error("schema_error", sectionPath, "section must be an object.", section));
      return;
    }
    validateOptionalString(section.title, `${sectionPath}.title`, errors);
    validateNotes(section.notes, `${sectionPath}.notes`, errors);
    if (!Array.isArray(section.components)) {
      errors.push(error("schema_error", `${sectionPath}.components`, "components must be an array.", section.components));
      return;
    }
    section.components.forEach((component, componentIndex) => {
      validateComponent(component, `${sectionPath}.components[${componentIndex}]`, errors);
    });
  });
}

function validateComponent(component: ComponentSpec, path: string, errors: SpecDiagnostic[]): void {
  if (!isRecord(component)) {
    errors.push(error("schema_error", path, "component must be an object.", component));
    return;
  }
  requireString(component.id, `${path}.id`, errors);
  if (!SUPPORTED_COMPONENT_TYPES.includes(component.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported component type "${String(component.type)}".`, component.type));
  }
  validateOptionalString(component.title, `${path}.title`, errors);
  validateEmptyState(component.emptyState, `${path}.emptyState`, errors);
  validateNotes(component.notes, `${path}.notes`, errors);
  validateOptionalArray(component.fields, `${path}.fields`, "fields", errors)?.forEach((field, fieldIndex) =>
    validateField(field, `${path}.fields[${fieldIndex}]`, errors)
  );
  validateOptionalArray(component.columns, `${path}.columns`, "columns", errors)?.forEach((field, fieldIndex) =>
    validateField(field, `${path}.columns[${fieldIndex}]`, errors)
  );
  validateOptionalArray(component.actions, `${path}.actions`, "actions", errors)?.forEach((action, actionIndex) =>
    validateAction(action, `${path}.actions[${actionIndex}]`, errors)
  );
  validateOptionalArray(component.items, `${path}.items`, "items", errors);
}

function validateField(field: FieldSpec, path: string, errors: SpecDiagnostic[]): void {
  if (!isRecord(field)) {
    errors.push(error("schema_error", path, "field must be an object.", field));
    return;
  }
  requireString(field.id, `${path}.id`, errors);
  requireString(field.label, `${path}.label`, errors);
  if (!SUPPORTED_FIELD_TYPES.includes(field.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported field type "${String(field.type)}".`, field.type));
  }
  validateOptionalString(field.meaning, `${path}.meaning`, errors);
  validateOptionalBoolean(field.required, `${path}.required`, errors);
  validateNotes(field.notes, `${path}.notes`, errors);
  validateCondition(field.visibleWhen, `${path}.visibleWhen`, errors);
  validateCondition(field.enabledWhen, `${path}.enabledWhen`, errors);
  validateCondition(field.requiredWhen, `${path}.requiredWhen`, errors);
  validateOptionValues(field.options, `${path}.options`, errors);
  validateStringArray(field.validationRules, `${path}.validationRules`, "validationRules", errors);
  validateStringArray(field.displayRules, `${path}.displayRules`, "displayRules", errors);
}

function validateAction(action: ActionSpec, path: string, errors: SpecDiagnostic[]): void {
  if (!isRecord(action)) {
    errors.push(error("schema_error", path, "action must be an object.", action));
    return;
  }
  requireString(action.id, `${path}.id`, errors);
  requireString(action.label, `${path}.label`, errors);
  if (!SUPPORTED_ACTION_TYPES.includes(action.type)) {
    errors.push(error("schema_error", `${path}.type`, `Unsupported action type "${String(action.type)}".`, action.type));
  }
  if (requiresTargetPage(action) && (typeof action.targetPageId !== "string" || action.targetPageId.length === 0)) {
    errors.push(error("schema_error", `${path}.targetPageId`, "targetPageId is required for this action.", action.targetPageId));
  }
  validateOptionalString(action.message, `${path}.message`, errors);
  validateNotes(action.notes, `${path}.notes`, errors);
  validateCondition(action.actionWhen, `${path}.actionWhen`, errors);
}

function validateCondition(condition: ConditionSpec | undefined, path: string, errors: SpecDiagnostic[]): void {
  if (condition === undefined) return;
  if (!isRecord(condition)) {
    errors.push(error("schema_error", path, "condition must be an object.", condition));
    return;
  }
  const record = condition as Record<string, unknown>;
  const operator = record["operator"];
  const hasGroup = Array.isArray(record["all"]) || Array.isArray(record["any"]);
  if (!hasGroup && (typeof record["fieldId"] !== "string" || record["fieldId"].length === 0)) {
    errors.push(error("schema_error", `${path}.fieldId`, "fieldId is required for condition leaf objects.", record["fieldId"]));
  }
  if (!hasGroup && typeof operator !== "string") {
    errors.push(error("schema_error", `${path}.operator`, "operator is required for condition leaf objects.", operator));
  }
  if (operator !== undefined && (typeof operator !== "string" || !SUPPORTED_CONDITION_OPERATORS.includes(operator as ConditionOperator))) {
    errors.push(error("schema_error", `${path}.operator`, `Unsupported condition operator "${String(operator)}".`, operator));
  }
  const all = record["all"];
  if (Array.isArray(all)) {
    all.forEach((child, index) => validateCondition(child as ConditionSpec, `${path}.all[${index}]`, errors));
  } else if (all !== undefined) {
    errors.push(error("schema_error", `${path}.all`, "all must be an array.", all));
  }
  const any = record["any"];
  if (Array.isArray(any)) {
    any.forEach((child, index) => validateCondition(child as ConditionSpec, `${path}.any[${index}]`, errors));
  } else if (any !== undefined) {
    errors.push(error("schema_error", `${path}.any`, "any must be an array.", any));
  }
}

function validateNavigation(nav: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (nav === undefined) return;
  if (!isRecord(nav)) {
    errors.push(error("schema_error", path, "nav must be an object.", nav));
    return;
  }
  if (typeof nav["visible"] !== "boolean") {
    errors.push(error("schema_error", `${path}.visible`, "visible must be a boolean.", nav["visible"]));
  }
  requireString(nav["label"], `${path}.label`, errors);
  if (nav["group"] !== undefined && typeof nav["group"] !== "string") {
    errors.push(error("schema_error", `${path}.group`, "group must be a string.", nav["group"]));
  }
  if (nav["order"] !== undefined && typeof nav["order"] !== "number") {
    errors.push(error("schema_error", `${path}.order`, "order must be a number.", nav["order"]));
  }
}

function requiresTargetPage(action: ActionSpec): boolean {
  return action.type === "navigate" || (action.type === "submitPrototype" && isRecord(action.actionWhen));
}

function validateReferences(spec: SpecBifrostDocument, errors: SpecDiagnostic[]): void {
  const pageIds = new Set(spec.pages.filter(isRecord).map((page) => page["id"]).filter((id): id is string => typeof id === "string"));
  const optionSetIds = new Set(
    (Array.isArray(spec.optionSets) ? spec.optionSets : []).filter(isRecord).map((optionSet) => optionSet["id"]).filter((id): id is string => typeof id === "string")
  );

  spec.pages.forEach((page, pageIndex) => {
    if (!isRecord(page)) return;
    const fieldIds = new Set<string>();
    if (!Array.isArray(page.sections)) return;
    page.sections.forEach((section) => {
      if (!isRecord(section)) return;
      if (!Array.isArray(section.components)) return;
      section.components.forEach((component) => {
        if (!isRecord(component)) return;
        if (Array.isArray(component.fields)) {
          component.fields.filter(isRecord).forEach((field) => {
            if (typeof field["id"] === "string") fieldIds.add(field["id"]);
          });
        }
        if (Array.isArray(component.columns)) {
          component.columns.filter(isRecord).forEach((field) => {
            if (typeof field["id"] === "string") fieldIds.add(field["id"]);
          });
        }
      });
    });

    page.sections.forEach((section, sectionIndex) => {
      if (!isRecord(section)) return;
      if (!Array.isArray(section.components)) return;
      section.components.forEach((component, componentIndex) => {
        if (!isRecord(component)) return;
        const componentPath = `pages[${pageIndex}].sections[${sectionIndex}].components[${componentIndex}]`;
        if (Array.isArray(component.fields)) {
          component.fields.forEach((field, fieldIndex) => {
            if (!isRecord(field)) return;
            validateFieldReferences(field, `${componentPath}.fields[${fieldIndex}]`, optionSetIds, fieldIds, errors);
          });
        }
        if (Array.isArray(component.columns)) {
          component.columns.forEach((field, fieldIndex) => {
            if (!isRecord(field)) return;
            validateFieldReferences(field, `${componentPath}.columns[${fieldIndex}]`, optionSetIds, fieldIds, errors);
          });
        }
        if (Array.isArray(component.actions)) {
          component.actions.forEach((action, actionIndex) => {
            if (!isRecord(action)) return;
            const actionPath = `${componentPath}.actions[${actionIndex}]`;
            const targetPageId = action["targetPageId"];
            if (typeof targetPageId === "string" && !pageIds.has(targetPageId)) {
              errors.push(error("reference_error", `${actionPath}.targetPageId`, `targetPageId "${targetPageId}" does not match any page id.`, targetPageId));
            }
            validateConditionReferences(action["actionWhen"] as ConditionSpec | undefined, `${actionPath}.actionWhen`, fieldIds, errors);
          });
        }
      });
    });
  });
}

function validateUniqueIds(spec: SpecBifrostDocument, errors: SpecDiagnostic[]): void {
  validateUniqueStringIds((spec.optionSets ?? []).filter(isRecord), "optionSets", errors);
  validateUniqueStringIds(spec.pages.filter(isRecord), "pages", errors);

  spec.pages.forEach((page, pageIndex) => {
    if (!isRecord(page)) return;
    if (!Array.isArray(page.sections)) return;
    const fieldIds = new Map<string, string>();
    page.sections.forEach((section, sectionIndex) => {
      if (!isRecord(section)) return;
      if (!Array.isArray(section.components)) return;
      section.components.forEach((component, componentIndex) => {
        if (!isRecord(component)) return;
        const componentPath = `pages[${pageIndex}].sections[${sectionIndex}].components[${componentIndex}]`;
        collectUniqueFieldIds(component["fields"] as FieldSpec[] | undefined, `${componentPath}.fields`, fieldIds, errors);
        collectUniqueFieldIds(component["columns"] as FieldSpec[] | undefined, `${componentPath}.columns`, fieldIds, errors);
      });
    });
  });
}

function collectUniqueFieldIds(
  fields: FieldSpec[] | undefined,
  path: string,
  knownIds: Map<string, string>,
  errors: SpecDiagnostic[]
): void {
  if (!Array.isArray(fields)) return;
  fields.forEach((field, fieldIndex) => {
    if (!isRecord(field) || typeof field["id"] !== "string" || field["id"].length === 0) return;
    const duplicateOf = knownIds.get(field["id"]);
    const fieldPath = `${path}[${fieldIndex}].id`;
    if (duplicateOf) {
      errors.push(error("schema_error", fieldPath, `Duplicate field id "${field["id"]}" also appears at ${duplicateOf}.`, field["id"]));
      return;
    }
    knownIds.set(field["id"], fieldPath);
  });
}

function validateUniqueStringIds(values: Array<{ id?: unknown }>, path: string, errors: SpecDiagnostic[]): void {
  const knownIds = new Map<string, string>();
  values.forEach((value, index) => {
    if (typeof value.id !== "string" || value.id.length === 0) return;
    const duplicateOf = knownIds.get(value.id);
    const idPath = `${path}[${index}].id`;
    if (duplicateOf) {
      errors.push(error("schema_error", idPath, `Duplicate id "${value.id}" also appears at ${duplicateOf}.`, value.id));
      return;
    }
    knownIds.set(value.id, idPath);
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
  if (!isRecord(condition)) return;
  const fieldId = condition["fieldId"];
  if (typeof fieldId === "string" && !fieldIds.has(fieldId)) {
    errors.push(error("reference_error", `${path}.fieldId`, `fieldId "${fieldId}" does not exist in the current page.`, fieldId));
  }
  if (Array.isArray(condition.all)) {
    condition.all.forEach((child, index) => validateConditionReferences(child, `${path}.all[${index}]`, fieldIds, errors));
  }
  if (Array.isArray(condition.any)) {
    condition.any.forEach((child, index) => validateConditionReferences(child, `${path}.any[${index}]`, fieldIds, errors));
  }
}

function validateNotes(notes: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (notes === undefined) return;
  if (!Array.isArray(notes) || notes.some((note) => typeof note !== "string")) {
    errors.push(error("schema_error", path, "notes must be an array of strings.", notes));
  }
}

function validateEmptyState(emptyState: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (emptyState === undefined) return;
  if (!isRecord(emptyState)) {
    errors.push(error("schema_error", path, "emptyState must be an object.", emptyState));
    return;
  }
  requireString(emptyState["title"], `${path}.title`, errors);
  validateOptionalString(emptyState["description"], `${path}.description`, errors);
  validateNotes(emptyState["notes"], `${path}.notes`, errors);
}

function validateOptionalString(value: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (value === undefined) return;
  requireString(value, path, errors);
}

function validateOptionalBoolean(value: unknown, path: string, errors: SpecDiagnostic[]): void {
  if (value === undefined) return;
  if (typeof value !== "boolean") {
    errors.push(error("schema_error", path, "value must be a boolean.", value));
  }
}

function validateStringArray(value: unknown, path: string, label: string, errors: SpecDiagnostic[]): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    errors.push(error("schema_error", path, `${label} must be an array.`, value));
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.length === 0) {
      errors.push(error("schema_error", `${path}[${index}]`, "value must be a non-empty string.", item));
    }
  });
}

function validateOptionSet(optionSet: OptionSet, path: string, errors: SpecDiagnostic[]): void {
  if (!isRecord(optionSet)) {
    errors.push(error("schema_error", path, "optionSet must be an object.", optionSet));
    return;
  }
  requireString(optionSet.id, `${path}.id`, errors);
  requireString(optionSet.label, `${path}.label`, errors);
  validateOptionValues(optionSet.options, `${path}.options`, errors, true);
}

function validateOptionValues(value: OptionValue[] | undefined, path: string, errors: SpecDiagnostic[], required = false): void {
  if (value === undefined) {
    if (required) errors.push(error("schema_error", path, "options must be an array.", value));
    return;
  }
  validateOptionalArray(value, path, "options", errors)?.forEach((option, optionIndex) => {
    if (!isRecord(option)) {
      errors.push(error("schema_error", `${path}[${optionIndex}]`, "option must be an object.", option));
      return;
    }
    requireString(option.value, `${path}[${optionIndex}].value`, errors);
    requireString(option.label, `${path}[${optionIndex}].label`, errors);
  });
}

function validateOptionalArray<T>(value: T[] | undefined, path: string, label: string, errors: SpecDiagnostic[]): T[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    errors.push(error("schema_error", path, `${label} must be an array.`, value));
    return undefined;
  }
  return value;
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
