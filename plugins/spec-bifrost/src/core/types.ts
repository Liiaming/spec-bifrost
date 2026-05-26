export type Notes = string[];

export interface SpecBifrostDocument {
  schemaVersion: "1.0";
  project: {
    name: string;
    description: string;
    actors: string[];
  };
  optionSets?: OptionSet[];
  pages: PageSpec[];
}

export interface OptionSet {
  id: string;
  label: string;
  options: OptionValue[];
}

export interface OptionValue {
  value: string;
  label: string;
}

export interface PageSpec {
  id: string;
  title: string;
  purpose: string;
  route: string;
  type: PageType;
  nav?: NavigationSpec;
  sections: SectionSpec[];
  notes?: Notes;
}

export interface NavigationSpec {
  visible: boolean;
  label: string;
  group?: string;
  order?: number;
}

export interface SectionSpec {
  id: string;
  title?: string;
  components: ComponentSpec[];
  notes?: Notes;
}

export interface ComponentSpec {
  id: string;
  type: ComponentType;
  title?: string;
  fields?: FieldSpec[];
  columns?: FieldSpec[];
  actions?: ActionSpec[];
  items?: unknown[];
  emptyState?: EmptyStateSpec;
  notes?: Notes;
}

export interface FieldSpec {
  id: string;
  label: string;
  type: FieldType;
  meaning?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: OptionValue[];
  optionSetId?: string;
  validationRules?: string[];
  displayRules?: string[];
  visibleWhen?: ConditionSpec;
  enabledWhen?: ConditionSpec;
  requiredWhen?: ConditionSpec;
  notes?: Notes;
}

export interface ActionSpec {
  id: string;
  type: ActionType;
  label: string;
  targetPageId?: string;
  message?: string;
  actionWhen?: ConditionSpec;
  notes?: Notes;
}

export interface EmptyStateSpec {
  title: string;
  description?: string;
  notes?: Notes;
}

export interface ConditionSpec {
  fieldId?: string;
  operator?: ConditionOperator;
  value?: unknown;
  all?: ConditionSpec[];
  any?: ConditionSpec[];
}

export type PageType = "list" | "form" | "detail" | "approval" | "reference";

export type ComponentType =
  | "pageHeader"
  | "section"
  | "form"
  | "filterBar"
  | "table"
  | "descriptionList"
  | "cardList"
  | "steps"
  | "tabs"
  | "alert"
  | "emptyState"
  | "modal"
  | "drawer"
  | "actionBar"
  | "textBlock";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "dateRange"
  | "time"
  | "select"
  | "multiSelect"
  | "radio"
  | "checkbox"
  | "switch"
  | "user"
  | "department"
  | "file"
  | "status"
  | "tag";

export type ActionType =
  | "navigate"
  | "openModal"
  | "closeModal"
  | "openDrawer"
  | "closeDrawer"
  | "setFieldValue"
  | "submitPrototype"
  | "resetFields"
  | "showMessage";

export type ConditionOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "empty"
  | "notEmpty"
  | "greaterThan"
  | "greaterThanOrEqual"
  | "lessThan"
  | "lessThanOrEqual"
  | "contains";
