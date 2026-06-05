import { SUPPORTED_ACTION_TYPES, SUPPORTED_COMPONENT_TYPES, SUPPORTED_CONDITION_OPERATORS, SUPPORTED_FIELD_TYPES, SUPPORTED_PAGE_TYPES } from "./constants.js";
export function validateSpec(input) {
    const errors = [];
    if (!isRecord(input)) {
        return fail("schema_error", "", "Spec root must be an object.", input);
    }
    const spec = input;
    if (spec.schemaVersion !== "1.0") {
        errors.push(error("schema_error", "schemaVersion", 'schemaVersion must be "1.0".', spec.schemaVersion));
    }
    if (!isRecord(spec.project)) {
        errors.push(error("schema_error", "project", "project must be an object.", spec.project));
    }
    else {
        requireString(spec.project.name, "project.name", errors);
        requireString(spec.project.description, "project.description", errors);
        if (!Array.isArray(spec.project.actors)) {
            errors.push(error("schema_error", "project.actors", "project.actors must be an array.", spec.project.actors));
        }
        else {
            validateStringArray(spec.project.actors, "project.actors", "actors", errors);
        }
    }
    if (spec.optionSets !== undefined && !Array.isArray(spec.optionSets)) {
        errors.push(error("schema_error", "optionSets", "optionSets must be an array.", spec.optionSets));
    }
    else {
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
function validatePage(page, path, errors) {
    if (!isRecord(page)) {
        errors.push(error("schema_error", path, "page must be an object.", page));
        return;
    }
    const pageContext = contextPart("page", page.id);
    requireString(page.id, `${path}.id`, errors, pageContext);
    requireString(page.title, `${path}.title`, errors, pageContext);
    requireString(page.purpose, `${path}.purpose`, errors, pageContext);
    requireString(page.route, `${path}.route`, errors, pageContext);
    if (!SUPPORTED_PAGE_TYPES.includes(page.type)) {
        errors.push(error("schema_error", `${path}.type`, `Unsupported page type "${String(page.type)}".`, page.type, pageContext));
    }
    validateNavigation(page.nav, `${path}.nav`, errors, pageContext);
    validateNotes(page.notes, `${path}.notes`, errors, pageContext);
    if (!Array.isArray(page.sections)) {
        errors.push(error("schema_error", `${path}.sections`, "sections must be an array.", page.sections, pageContext));
        return;
    }
    page.sections.forEach((section, sectionIndex) => {
        const sectionPath = `${path}.sections[${sectionIndex}]`;
        if (!isRecord(section)) {
            errors.push(error("schema_error", sectionPath, "section must be an object.", section, pageContext));
            return;
        }
        validateOptionalString(section.title, `${sectionPath}.title`, errors, pageContext);
        validateNotes(section.notes, `${sectionPath}.notes`, errors, pageContext);
        if (!Array.isArray(section.components)) {
            errors.push(error("schema_error", `${sectionPath}.components`, "components must be an array.", section.components, pageContext));
            return;
        }
        section.components.forEach((component, componentIndex) => {
            validateComponent(component, `${sectionPath}.components[${componentIndex}]`, errors, pageContext);
        });
    });
}
function validateComponent(component, path, errors, pageContext) {
    if (!isRecord(component)) {
        errors.push(error("schema_error", path, "component must be an object.", component, pageContext));
        return;
    }
    const componentContext = joinContext(pageContext, contextPart("component", component.id));
    requireString(component.id, `${path}.id`, errors, componentContext);
    if (!SUPPORTED_COMPONENT_TYPES.includes(component.type)) {
        errors.push(error("schema_error", `${path}.type`, `Unsupported component type "${String(component.type)}".`, component.type, componentContext));
    }
    validateOptionalString(component.title, `${path}.title`, errors, componentContext);
    validateEmptyState(component.emptyState, `${path}.emptyState`, errors, componentContext);
    validateNotes(component.notes, `${path}.notes`, errors, componentContext);
    validateOptionalArray(component.fields, `${path}.fields`, "fields", errors, componentContext)?.forEach((field, fieldIndex) => validateField(field, `${path}.fields[${fieldIndex}]`, errors, componentContext));
    validateOptionalArray(component.columns, `${path}.columns`, "columns", errors, componentContext)?.forEach((field, fieldIndex) => validateField(field, `${path}.columns[${fieldIndex}]`, errors, componentContext));
    validateOptionalArray(component.actions, `${path}.actions`, "actions", errors, componentContext)?.forEach((action, actionIndex) => validateAction(action, `${path}.actions[${actionIndex}]`, errors, componentContext));
    validateOptionalArray(component.items, `${path}.items`, "items", errors, componentContext);
    validateOptionalArray(component.relations, `${path}.relations`, "relations", errors, componentContext)?.forEach((relation, relationIndex) => validateRelation(relation, `${path}.relations[${relationIndex}]`, errors, componentContext));
}
function validateField(field, path, errors, componentContext) {
    if (!isRecord(field)) {
        errors.push(error("schema_error", path, "field must be an object.", field, componentContext));
        return;
    }
    const fieldContext = joinContext(componentContext, contextPart("field", field.id));
    requireString(field.id, `${path}.id`, errors, fieldContext);
    requireString(field.label, `${path}.label`, errors, fieldContext);
    if (!SUPPORTED_FIELD_TYPES.includes(field.type)) {
        errors.push(error("schema_error", `${path}.type`, `Unsupported field type "${String(field.type)}".`, field.type, fieldContext));
    }
    validateOptionalString(field.meaning, `${path}.meaning`, errors, fieldContext);
    validateOptionalBoolean(field.required, `${path}.required`, errors, fieldContext);
    validateNotes(field.notes, `${path}.notes`, errors, fieldContext);
    validateCondition(field.visibleWhen, `${path}.visibleWhen`, errors, fieldContext);
    validateCondition(field.enabledWhen, `${path}.enabledWhen`, errors, fieldContext);
    validateCondition(field.requiredWhen, `${path}.requiredWhen`, errors, fieldContext);
    validateOptionValues(field.options, `${path}.options`, errors, false, fieldContext);
    validateStringArray(field.validationRules, `${path}.validationRules`, "validationRules", errors, fieldContext);
    validateStringArray(field.displayRules, `${path}.displayRules`, "displayRules", errors, fieldContext);
}
function validateAction(action, path, errors, componentContext) {
    if (!isRecord(action)) {
        errors.push(error("schema_error", path, "action must be an object.", action, componentContext));
        return;
    }
    const actionContext = joinContext(componentContext, contextPart("action", action.id));
    requireString(action.id, `${path}.id`, errors, actionContext);
    requireString(action.label, `${path}.label`, errors, actionContext);
    if (!SUPPORTED_ACTION_TYPES.includes(action.type)) {
        errors.push(error("schema_error", `${path}.type`, `Unsupported action type "${String(action.type)}".`, action.type, actionContext));
    }
    if (requiresTargetPage(action) && (typeof action.targetPageId !== "string" || action.targetPageId.length === 0)) {
        errors.push(error("schema_error", `${path}.targetPageId`, "targetPageId is required for this action.", action.targetPageId, actionContext));
    }
    validateOptionalString(action.message, `${path}.message`, errors, actionContext);
    validateNotes(action.notes, `${path}.notes`, errors, actionContext);
    validateCondition(action.actionWhen, `${path}.actionWhen`, errors, actionContext);
}
function validateRelation(relation, path, errors, componentContext) {
    if (!isRecord(relation)) {
        errors.push(error("schema_error", path, "relation must be an object.", relation, componentContext));
        return;
    }
    requireString(relation["sourceId"], `${path}.sourceId`, errors, componentContext);
    requireString(relation["targetId"], `${path}.targetId`, errors, componentContext);
    validateOptionalString(relation["label"], `${path}.label`, errors, componentContext);
    validateOptionalString(relation["type"], `${path}.type`, errors, componentContext);
    validateNotes(relation["notes"], `${path}.notes`, errors, componentContext);
}
function validateCondition(condition, path, errors, context) {
    if (condition === undefined)
        return;
    if (!isRecord(condition)) {
        errors.push(error("schema_error", path, "condition must be an object.", condition, context));
        return;
    }
    const record = condition;
    const operator = record["operator"];
    const hasGroup = Array.isArray(record["all"]) || Array.isArray(record["any"]);
    if (!hasGroup && (typeof record["fieldId"] !== "string" || record["fieldId"].length === 0)) {
        errors.push(error("schema_error", `${path}.fieldId`, "fieldId is required for condition leaf objects.", record["fieldId"], context));
    }
    if (!hasGroup && typeof operator !== "string") {
        errors.push(error("schema_error", `${path}.operator`, "operator is required for condition leaf objects.", operator, context));
    }
    if (operator !== undefined && (typeof operator !== "string" || !SUPPORTED_CONDITION_OPERATORS.includes(operator))) {
        errors.push(error("schema_error", `${path}.operator`, `Unsupported condition operator "${String(operator)}".`, operator, context));
    }
    const all = record["all"];
    if (Array.isArray(all)) {
        all.forEach((child, index) => validateCondition(child, `${path}.all[${index}]`, errors, context));
    }
    else if (all !== undefined) {
        errors.push(error("schema_error", `${path}.all`, "all must be an array.", all, context));
    }
    const any = record["any"];
    if (Array.isArray(any)) {
        any.forEach((child, index) => validateCondition(child, `${path}.any[${index}]`, errors, context));
    }
    else if (any !== undefined) {
        errors.push(error("schema_error", `${path}.any`, "any must be an array.", any, context));
    }
}
function validateNavigation(nav, path, errors, context) {
    if (nav === undefined)
        return;
    if (!isRecord(nav)) {
        errors.push(error("schema_error", path, "nav must be an object.", nav, context));
        return;
    }
    if (typeof nav["visible"] !== "boolean") {
        errors.push(error("schema_error", `${path}.visible`, "visible must be a boolean.", nav["visible"], context));
    }
    requireString(nav["label"], `${path}.label`, errors, context);
    if (nav["group"] !== undefined && typeof nav["group"] !== "string") {
        errors.push(error("schema_error", `${path}.group`, "group must be a string.", nav["group"], context));
    }
    if (nav["order"] !== undefined && typeof nav["order"] !== "number") {
        errors.push(error("schema_error", `${path}.order`, "order must be a number.", nav["order"], context));
    }
}
function requiresTargetPage(action) {
    return action.type === "navigate" || (action.type === "submitPrototype" && isRecord(action.actionWhen));
}
function validateReferences(spec, errors) {
    const pageIds = new Set(spec.pages.filter(isRecord).map((page) => page["id"]).filter((id) => typeof id === "string"));
    const optionSetIds = new Set((Array.isArray(spec.optionSets) ? spec.optionSets : []).filter(isRecord).map((optionSet) => optionSet["id"]).filter((id) => typeof id === "string"));
    spec.pages.forEach((page, pageIndex) => {
        if (!isRecord(page))
            return;
        const fieldIds = new Set();
        if (!Array.isArray(page.sections))
            return;
        page.sections.forEach((section) => {
            if (!isRecord(section))
                return;
            if (!Array.isArray(section.components))
                return;
            section.components.forEach((component) => {
                if (!isRecord(component))
                    return;
                if (Array.isArray(component.fields)) {
                    component.fields.filter(isRecord).forEach((field) => {
                        if (typeof field["id"] === "string")
                            fieldIds.add(field["id"]);
                    });
                }
                if (Array.isArray(component.columns)) {
                    component.columns.filter(isRecord).forEach((field) => {
                        if (typeof field["id"] === "string")
                            fieldIds.add(field["id"]);
                    });
                }
            });
        });
        page.sections.forEach((section, sectionIndex) => {
            if (!isRecord(section))
                return;
            if (!Array.isArray(section.components))
                return;
            section.components.forEach((component, componentIndex) => {
                if (!isRecord(component))
                    return;
                const componentPath = `pages[${pageIndex}].sections[${sectionIndex}].components[${componentIndex}]`;
                const componentContext = joinContext(contextPart("page", page["id"]), contextPart("component", component["id"]));
                if (Array.isArray(component.fields)) {
                    component.fields.forEach((field, fieldIndex) => {
                        if (!isRecord(field))
                            return;
                        validateFieldReferences(field, `${componentPath}.fields[${fieldIndex}]`, optionSetIds, fieldIds, errors, componentContext);
                    });
                }
                if (Array.isArray(component.columns)) {
                    component.columns.forEach((field, fieldIndex) => {
                        if (!isRecord(field))
                            return;
                        validateFieldReferences(field, `${componentPath}.columns[${fieldIndex}]`, optionSetIds, fieldIds, errors, componentContext);
                    });
                }
                if (Array.isArray(component.actions)) {
                    component.actions.forEach((action, actionIndex) => {
                        if (!isRecord(action))
                            return;
                        const actionPath = `${componentPath}.actions[${actionIndex}]`;
                        const actionContext = joinContext(componentContext, contextPart("action", action["id"]));
                        const targetPageId = action["targetPageId"];
                        if (typeof targetPageId === "string" && !pageIds.has(targetPageId)) {
                            errors.push(error("reference_error", `${actionPath}.targetPageId`, `targetPageId "${targetPageId}" does not match any page id.`, targetPageId, actionContext));
                        }
                        validateConditionReferences(action["actionWhen"], `${actionPath}.actionWhen`, fieldIds, errors, actionContext);
                    });
                }
                validateRelationReferences(component["relations"], `${componentPath}.relations`, component["items"], errors, componentContext);
            });
        });
    });
}
function validateUniqueIds(spec, errors) {
    validateUniqueStringIds((spec.optionSets ?? []).filter(isRecord), "optionSets", errors);
    validateUniqueStringIds(spec.pages.filter(isRecord), "pages", errors);
    spec.pages.forEach((page, pageIndex) => {
        if (!isRecord(page))
            return;
        if (!Array.isArray(page.sections))
            return;
        const fieldIds = new Map();
        page.sections.forEach((section, sectionIndex) => {
            if (!isRecord(section))
                return;
            if (!Array.isArray(section.components))
                return;
            section.components.forEach((component, componentIndex) => {
                if (!isRecord(component))
                    return;
                const componentPath = `pages[${pageIndex}].sections[${sectionIndex}].components[${componentIndex}]`;
                const componentContext = joinContext(contextPart("page", page["id"]), contextPart("component", component["id"]));
                collectUniqueFieldIds(component["fields"], `${componentPath}.fields`, fieldIds, errors, componentContext);
                collectUniqueFieldIds(component["columns"], `${componentPath}.columns`, fieldIds, errors, componentContext);
            });
        });
    });
}
function collectUniqueFieldIds(fields, path, knownIds, errors, componentContext) {
    if (!Array.isArray(fields))
        return;
    fields.forEach((field, fieldIndex) => {
        if (!isRecord(field) || typeof field["id"] !== "string" || field["id"].length === 0)
            return;
        const duplicateOf = knownIds.get(field["id"]);
        const fieldPath = `${path}[${fieldIndex}].id`;
        const fieldContext = joinContext(componentContext, contextPart("field", field["id"]));
        if (duplicateOf) {
            errors.push(error("schema_error", fieldPath, `Duplicate field id "${field["id"]}" also appears at ${duplicateOf}.`, field["id"], fieldContext));
            return;
        }
        knownIds.set(field["id"], fieldPath);
    });
}
function validateUniqueStringIds(values, path, errors) {
    const knownIds = new Map();
    values.forEach((value, index) => {
        if (typeof value.id !== "string" || value.id.length === 0)
            return;
        const duplicateOf = knownIds.get(value.id);
        const idPath = `${path}[${index}].id`;
        if (duplicateOf) {
            errors.push(error("schema_error", idPath, `Duplicate id "${value.id}" also appears at ${duplicateOf}.`, value.id));
            return;
        }
        knownIds.set(value.id, idPath);
    });
}
function validateFieldReferences(field, path, optionSetIds, fieldIds, errors, componentContext) {
    const fieldContext = joinContext(componentContext, contextPart("field", field.id));
    if (field.optionSetId !== undefined && !optionSetIds.has(field.optionSetId)) {
        errors.push(error("reference_error", `${path}.optionSetId`, `optionSetId "${field.optionSetId}" does not exist.`, field.optionSetId, fieldContext));
    }
    validateConditionReferences(field.visibleWhen, `${path}.visibleWhen`, fieldIds, errors, fieldContext);
    validateConditionReferences(field.enabledWhen, `${path}.enabledWhen`, fieldIds, errors, fieldContext);
    validateConditionReferences(field.requiredWhen, `${path}.requiredWhen`, fieldIds, errors, fieldContext);
}
function validateConditionReferences(condition, path, fieldIds, errors, context) {
    if (condition === undefined)
        return;
    if (!isRecord(condition))
        return;
    const fieldId = condition["fieldId"];
    if (typeof fieldId === "string" && !fieldIds.has(fieldId)) {
        errors.push(error("reference_error", `${path}.fieldId`, `fieldId "${fieldId}" does not exist in the current page.`, fieldId, context));
    }
    if (Array.isArray(condition.all)) {
        condition.all.forEach((child, index) => validateConditionReferences(child, `${path}.all[${index}]`, fieldIds, errors, context));
    }
    if (Array.isArray(condition.any)) {
        condition.any.forEach((child, index) => validateConditionReferences(child, `${path}.any[${index}]`, fieldIds, errors, context));
    }
}
function validateRelationReferences(relations, path, items, errors, context) {
    if (!Array.isArray(relations))
        return;
    const itemIds = collectItemIds(items);
    relations.forEach((relation, relationIndex) => {
        if (!isRecord(relation))
            return;
        const sourceId = relation["sourceId"];
        const targetId = relation["targetId"];
        if (typeof sourceId === "string" && sourceId.length > 0 && !itemIds.has(sourceId)) {
            errors.push(error("reference_error", `${path}[${relationIndex}].sourceId`, `sourceId "${sourceId}" does not match any item id in the component.`, sourceId, context));
        }
        if (typeof targetId === "string" && targetId.length > 0 && !itemIds.has(targetId)) {
            errors.push(error("reference_error", `${path}[${relationIndex}].targetId`, `targetId "${targetId}" does not match any item id in the component.`, targetId, context));
        }
    });
}
function collectItemIds(items) {
    const ids = new Set();
    if (!Array.isArray(items))
        return ids;
    collectItemIdsRecursive(items, ids);
    return ids;
}
function collectItemIdsRecursive(items, ids) {
    items.filter(isRecord).forEach((item) => {
        if (typeof item["id"] === "string" && item["id"].length > 0)
            ids.add(item["id"]);
        if (Array.isArray(item["children"]))
            collectItemIdsRecursive(item["children"], ids);
    });
}
function validateNotes(notes, path, errors, context) {
    if (notes === undefined)
        return;
    if (!Array.isArray(notes) || notes.some((note) => typeof note !== "string")) {
        errors.push(error("schema_error", path, "notes must be an array of strings.", notes, context));
    }
}
function validateEmptyState(emptyState, path, errors, context) {
    if (emptyState === undefined)
        return;
    if (!isRecord(emptyState)) {
        errors.push(error("schema_error", path, "emptyState must be an object.", emptyState, context));
        return;
    }
    requireString(emptyState["title"], `${path}.title`, errors, context);
    validateOptionalString(emptyState["description"], `${path}.description`, errors, context);
    validateNotes(emptyState["notes"], `${path}.notes`, errors, context);
}
function validateOptionalString(value, path, errors, context) {
    if (value === undefined)
        return;
    requireString(value, path, errors, context);
}
function validateOptionalBoolean(value, path, errors, context) {
    if (value === undefined)
        return;
    if (typeof value !== "boolean") {
        errors.push(error("schema_error", path, "value must be a boolean.", value, context));
    }
}
function validateStringArray(value, path, label, errors, context) {
    if (value === undefined)
        return;
    if (!Array.isArray(value)) {
        errors.push(error("schema_error", path, `${label} must be an array.`, value, context));
        return;
    }
    value.forEach((item, index) => {
        if (typeof item !== "string" || item.length === 0) {
            errors.push(error("schema_error", `${path}[${index}]`, "value must be a non-empty string.", item, context));
        }
    });
}
function validateOptionSet(optionSet, path, errors) {
    if (!isRecord(optionSet)) {
        errors.push(error("schema_error", path, "optionSet must be an object.", optionSet));
        return;
    }
    const optionSetContext = contextPart("optionSet", optionSet.id);
    requireString(optionSet.id, `${path}.id`, errors, optionSetContext);
    requireString(optionSet.label, `${path}.label`, errors, optionSetContext);
    validateOptionValues(optionSet.options, `${path}.options`, errors, true, optionSetContext);
}
function validateOptionValues(value, path, errors, required = false, context) {
    if (value === undefined) {
        if (required)
            errors.push(error("schema_error", path, "options must be an array.", value, context));
        return;
    }
    validateOptionalArray(value, path, "options", errors, context)?.forEach((option, optionIndex) => {
        if (!isRecord(option)) {
            errors.push(error("schema_error", `${path}[${optionIndex}]`, "option must be an object.", option, context));
            return;
        }
        requireString(option.value, `${path}[${optionIndex}].value`, errors, context);
        requireString(option.label, `${path}[${optionIndex}].label`, errors, context);
    });
}
function validateOptionalArray(value, path, label, errors, context) {
    if (value === undefined)
        return undefined;
    if (!Array.isArray(value)) {
        errors.push(error("schema_error", path, `${label} must be an array.`, value, context));
        return undefined;
    }
    return value;
}
function requireString(value, path, errors, context) {
    if (typeof value !== "string" || value.length === 0) {
        errors.push(error("schema_error", path, "value must be a non-empty string.", value, context));
    }
}
function fail(type, path, message, value) {
    return { ok: false, errors: [error(type, path, message, value)] };
}
function error(type, path, message, value, context) {
    return context === undefined ? { type, path, message, value } : { type, path, message, value, context };
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function contextPart(kind, value) {
    return typeof value === "string" && value.length > 0 ? `${kind} ${value}` : undefined;
}
function joinContext(...parts) {
    const definedParts = parts.filter((part) => part !== undefined);
    return definedParts.length > 0 ? definedParts.join(" > ") : undefined;
}
