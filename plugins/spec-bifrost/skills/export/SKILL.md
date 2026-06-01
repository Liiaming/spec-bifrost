---
name: export
description: Export frontend and backend Markdown requirement documents from spec-bifrost.json.
---

# Spec Bifrost Export

1. Run `spec-bifrost validate --cwd "${CLAUDE_PROJECT_DIR:-$PWD}"`.
2. If validation passes, read `${CLAUDE_PROJECT_DIR:-$PWD}/spec-bifrost.json`.
3. Generate both files:
   - `docs/spec-bifrost/frontend-requirements.md`
   - `docs/spec-bifrost/backend-requirements.md`
4. Keep both files as requirement documents.
5. Do not include API definitions, database tables, technical architecture, code structure, task breakdowns, entity models, or implementation advice.

## 前端版 / Frontend Document

`frontend-requirements.md` should focus on what users see and do:

- 页面清单：list each page title, purpose, route, and visible navigation behavior.
- 页面流程：describe how users move between pages through actions and conditional actions.
- 页面内容：summarize sections, components, tables, cards, steps, empty states, and notes.
- 字段与交互规则：describe field labels, meanings, required state, validation rules, display rules, conditional visibility, conditional enabled state, and conditional required state.
- 操作反馈：describe button labels, navigation outcomes, prototype messages, and business-facing notes.

不要把前端版写成实现方案。Do not include component library choices, code structure, state management, styling implementation, framework advice, or task breakdowns.

## 后端版 / Backend Document

`backend-requirements.md` should focus on business facts and process rules that backend engineers need to understand:

- 业务对象：describe business objects in plain requirement language, based on pages, fields, and notes.
- 业务规则：summarize validation rules, approval conditions, status meanings, role expectations, and conditional flows.
- 数据口径：describe what each important field means to the business and when it matters.
- 流程结果：describe what should be true after submission, approval, rejection, or navigation in business terms.
- 例外与备注：include notes that affect product behavior or engineering understanding.

不要把后端版写成接口定义、数据库表、实体模型、技术架构、代码结构或实现建议。
