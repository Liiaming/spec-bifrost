import {
  SUPPORTED_ACTION_TYPES,
  SUPPORTED_COMPONENT_TYPES,
  SUPPORTED_CONDITION_OPERATORS,
  SUPPORTED_FIELD_TYPES,
  SUPPORTED_PAGE_TYPES
} from "./constants.js";
import type { ActionSpec, ComponentSpec, ConditionOperator, ConditionSpec, FieldSpec, PageSpec, SpecBifrostDocument } from "./types.js";
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
  validateReferences(spec, errors);
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
  const record = condition as Record<string, unknown>;
  const operator = record["operator"];
  if (operator !== undefined && (typeof operator !== "string" || !SUPPORTED_CONDITION_OPERATORS.includes(operator as ConditionOperator))) {
    errors.push(error("schema_error", `${path}.operator`, `Unsupported condition operator "${String(operator)}".`, operator));
  }
  const all = record["all"];
  if (Array.isArray(all)) {
    all.forEach((child, index) => validateCondition(child as ConditionSpec, `${path}.all[${index}]`, errors));
  }
  const any = record["any"];
  if (Array.isArray(any)) {
    any.forEach((child, index) => validateCondition(child as ConditionSpec, `${path}.any[${index}]`, errors));
  }
}

function validateReferences(spec: SpecBifrostDocument, errors: SpecDiagnostic[]): void {
  const pageIds = new Set(spec.pages.map((page) => page.id));
  const optionSetIds = new Set((Array.isArray(spec.optionSets) ? spec.optionSets : []).map((optionSet) => optionSet.id));

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
