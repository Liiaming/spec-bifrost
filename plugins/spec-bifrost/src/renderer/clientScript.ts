export function clientScript(): string {
  return `
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.matches("[data-notes-toggle]")) {
    document.body.classList.toggle("show-notes");
    target.textContent = document.body.classList.contains("show-notes") ? "隐藏备注" : "显示备注";
    return;
  }
  const actionButton = target.closest("[data-action-button]");
  if (actionButton instanceof HTMLElement) {
    const page = currentPage();
    const values = page ? collectPageValues(page) : {};
    const condition = readCondition(actionButton.dataset.actionWhen);
    if (condition && !evaluateCondition(condition, values)) return;
    if (actionButton.dataset.message) {
      showPrototypeMessage(actionButton.dataset.message);
    }
    if (actionButton.dataset.targetPageId) {
      navigateToPage(actionButton.dataset.targetPageId);
    }
    return;
  }
  const pageButton = target.closest("[data-page-id]");
  if (pageButton instanceof HTMLElement) {
    navigateToPage(pageButton.dataset.pageId);
  }
});
document.addEventListener("input", applyCurrentPageConditions);
document.addEventListener("change", applyCurrentPageConditions);
document.addEventListener("submit", (event) => {
  event.preventDefault();
});
applyCurrentPageConditions();

function currentPage() {
  return document.querySelector("[data-page]:not([hidden])");
}

function navigateToPage(pageId) {
  if (!pageId) return;
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.toggleAttribute("hidden", page.getAttribute("data-page") !== pageId);
  });
  document.querySelectorAll(".nav button[data-page-id]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-page-id") === pageId);
  });
  applyCurrentPageConditions();
}

function applyCurrentPageConditions() {
  const page = currentPage();
  if (!page) return;
  const values = collectPageValues(page);
  page.querySelectorAll("[data-field-shell]").forEach((shell) => {
    const visibleWhen = readCondition(shell.dataset.visibleWhen);
    const requiredWhen = readCondition(shell.dataset.requiredWhen);
    const enabledWhen = readCondition(shell.dataset.enabledWhen);
    const visible = visibleWhen ? evaluateCondition(visibleWhen, values) : true;
    shell.hidden = !visible;
    const required = visible && (shell.dataset.requiredStatic === "true" || Boolean(requiredWhen && evaluateCondition(requiredWhen, values)));
    const enabled = visible && (enabledWhen ? evaluateCondition(enabledWhen, values) : true);
    shell.querySelectorAll("[data-field-control]").forEach((control) => {
      control.required = required;
      control.disabled = !enabled;
    });
    shell.querySelectorAll("[data-required-marker]").forEach((marker) => {
      marker.hidden = !required;
    });
  });
  page.querySelectorAll("[data-action-button]").forEach((button) => {
    const condition = readCondition(button.dataset.actionWhen);
    const enabled = condition ? evaluateCondition(condition, collectPageValues(page)) : true;
    button.disabled = !enabled;
    button.setAttribute("aria-disabled", String(!enabled));
  });
}

function collectPageValues(page) {
  const values = {};
  page.querySelectorAll("[data-field-control]").forEach((control) => {
    const fieldId = control.dataset.fieldId;
    if (!fieldId) return;
    if (control.type === "checkbox") {
      values[fieldId] = control.checked;
      return;
    }
    if (control.tagName === "SELECT" && control.multiple) {
      values[fieldId] = Array.from(control.selectedOptions).map((option) => option.value);
      return;
    }
    values[fieldId] = control.value;
  });
  return values;
}

function readCondition(raw) {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function evaluateCondition(condition, values) {
  if (!condition) return true;
  if (Array.isArray(condition.all)) {
    return condition.all.every((child) => evaluateCondition(child, values));
  }
  if (Array.isArray(condition.any)) {
    return condition.any.some((child) => evaluateCondition(child, values));
  }
  if (!condition.fieldId || !condition.operator) return true;
  const current = values[condition.fieldId];
  const expected = condition.value;
  switch (condition.operator) {
    case "equals":
      return valuesEqual(current, expected);
    case "notEquals":
      return !valuesEqual(current, expected);
    case "in":
      return Array.isArray(expected) && expected.some((value) => valuesEqual(current, value));
    case "notIn":
      return Array.isArray(expected) && !expected.some((value) => valuesEqual(current, value));
    case "empty":
      return isEmpty(current);
    case "notEmpty":
      return !isEmpty(current);
    case "greaterThan":
      return toNumber(current) > toNumber(expected);
    case "greaterThanOrEqual":
      return toNumber(current) >= toNumber(expected);
    case "lessThan":
      return toNumber(current) < toNumber(expected);
    case "lessThanOrEqual":
      return toNumber(current) <= toNumber(expected);
    case "contains":
      return Array.isArray(current) ? current.some((value) => valuesEqual(value, expected)) : String(current ?? "").includes(String(expected ?? ""));
    default:
      return false;
  }
}

function valuesEqual(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function isEmpty(value) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function showPrototypeMessage(message) {
  let toast = document.querySelector(".prototype-toast");
  if (!(toast instanceof HTMLElement)) {
    toast = document.createElement("div");
    toast.className = "prototype-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showPrototypeMessage.timer);
  showPrototypeMessage.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}
`;
}
