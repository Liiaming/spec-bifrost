# Spec Bifrost

[中文](README.md)

Spec Bifrost is a Claude Code plugin that turns product conversations into a local `spec-bifrost.json`, previews multi-page business-facing requirement prototypes from that JSON, and exports separate frontend and backend Markdown requirement documents.

> Status: MVP. The project focuses on validating the "chat + local JSON + live prototype + role-specific requirement documents" workflow.

## Why

Product prototypes are intuitive for people, but not stable enough for AI and engineering workflows. Developers often need to rewrite prototypes, notes, and verbal context into structured text, which can introduce quality drift.

Spec Bifrost explores a lighter workflow:

1. Product managers describe a complete but relatively simple business-facing system in Claude Code chat.
2. Claude Code creates and edits the local `spec-bifrost.json`.
3. The plugin validates the JSON and serves a local preview.
4. After product confirmation, Claude exports frontend-focused and backend-focused requirement documents from the JSON.

## What It Does

- Guides Claude Code to create and modify `spec-bifrost.json` through skills.
- Validates JSON syntax, schema, and reference integrity.
- Provides medium-fidelity, multi-page business-facing prototype previews.
- Supports notes on pages, sections, components, fields, actions, and buttons.
- Supports common business UI patterns such as forms, filters, tables, detail views, steps, cards, and empty states.
- Supports field rules, conditional display, conditional required fields, and page navigation.
- Uses a last-known-good renderer strategy and keeps the previous valid preview when the current JSON cannot render.
- Guides Claude to export frontend and backend Markdown requirement documents.

## What It Does Not Do

- It does not generate production code.
- It is not a low-code platform.
- It does not mock backend APIs.
- It does not persist user input from the preview.
- It does not export API definitions, database designs, technical architecture, code structure, or task breakdowns.
- It does not turn backend documents into entity models or implementation plans.
- It does not upload `spec-bifrost.json` or exported documents.

## Repository Layout

```txt
.
├── .claude-plugin/marketplace.json
├── docs/superpowers/
├── plugins/spec-bifrost/
│   ├── .claude-plugin/plugin.json
│   ├── bin/spec-bifrost
│   ├── examples/procurement-system/
│   ├── hooks/hooks.json
│   ├── skills/
│   ├── src/
│   │   ├── cli/
│   │   ├── core/
│   │   ├── hooks/
│   │   └── renderer/
│   └── tests/
├── package.json
└── tsconfig.json
```

- `plugins/spec-bifrost/src/core`: JSON reading, diagnostics, schema validation, and reference validation.
- `plugins/spec-bifrost/src/hooks`: Claude Code hook integration.
- `plugins/spec-bifrost/src/renderer`: Local preview server and HTML renderer.
- `plugins/spec-bifrost/src/cli`: Local CLI command entry.
- `plugins/spec-bifrost/skills`: Claude Code commands and workflow instructions.
- `plugins/spec-bifrost/tests`: Tests organized by module.

## Requirements

- Node.js 24 LTS is recommended.
- npm is required.
- Claude Code CLI with plugin support is required.

## Install for Local Testing

Clone the repository and build the plugin:

```bash
git clone <repo-url>
cd spec-bifrost
npm install
npm run build
```

Install the plugin into a test project with local scope, so global Claude Code configuration is not changed:

```bash
mkdir -p ~/Projects/Private/spec-bifrost-test
cd ~/Projects/Private/spec-bifrost-test
claude plugin marketplace add --scope local /path/to/spec-bifrost
claude plugin install --scope local spec-bifrost@spec-bifrost-marketplace
claude
```

After changing plugin source code, rebuild first and then update the local test installation:

```bash
cd /path/to/spec-bifrost
npm run build
cd ~/Projects/Private/spec-bifrost-test
claude plugin update spec-bifrost@spec-bifrost-marketplace --scope local
```

## Claude Commands

```txt
/spec-bifrost:spec
/spec-bifrost:validate
/spec-bifrost:preview
/spec-bifrost:refresh
/spec-bifrost:export
```

- `/spec-bifrost:spec`: Guides Claude to create or modify the local prototype JSON.
- `/spec-bifrost:validate`: Validates syntax, schema, and references.
- `/spec-bifrost:preview`: Starts the local preview server.
- `/spec-bifrost:refresh`: Asks the running preview to reload the current JSON.
- `/spec-bifrost:export`: Guides Claude to write frontend and backend requirement documents.

Exported documents are expected at:

```txt
docs/spec-bifrost/frontend-requirements.md
docs/spec-bifrost/backend-requirements.md
```

## Local CLI

After build, use the local CLI to validate and preview the example project:

```bash
npm run spec-bifrost -- validate --cwd plugins/spec-bifrost/examples/procurement-system
npm run spec-bifrost -- preview --cwd plugins/spec-bifrost/examples/procurement-system --host 127.0.0.1 --port 3737
```

## Example

The procurement system example demonstrates a small multi-page business-facing system:

```txt
plugins/spec-bifrost/examples/procurement-system/spec-bifrost.json
```

It covers option sets, forms, filters, tables, detail views, steps, cards, conditional display, conditional required fields, navigation actions, and notes.

## Development

```bash
npm run build
npm test
npm run check
```

- `npm run build`: Compiles TypeScript into `plugins/spec-bifrost/dist`.
- `npm test`: Runs all tests under `plugins/spec-bifrost/tests`.
- `npm run check`: Runs build and tests together.

When Claude Code CLI is available, validate the plugin package too:

```bash
claude plugin validate plugins/spec-bifrost
claude plugin validate .
```

## Design Principles

- The JSON file is a local project asset, visible and editable, but the primary workflow is chat-driven.
- The schema should be semi-structured: stable enough for validation and preview, flexible enough for product notes.
- Notes are first-class because not every requirement detail can be safely structured in the MVP.
- Hooks and the renderer report error facts only; Claude Code decides how to repair JSON according to plugin conventions.
- Exported documents must remain requirement documents and must not become implementation plans.

## Security

Spec Bifrost is designed around local files:

- The preview server binds to `127.0.0.1` by default.
- Preview input values stay in browser memory and are not written back to JSON.
- The plugin does not upload `spec-bifrost.json` or exported Markdown files.
- Real product prototypes may contain sensitive business information; review examples and test data before publishing.

See `plugins/spec-bifrost/SECURITY.md` for more detail.

## Contributing

Contributions should keep the MVP focused, practical, and verifiable:

- Prefer small, focused pull requests.
- Add or update tests for behavior changes.
- Run `npm run check` before submitting changes.
- Include screenshots for visible renderer changes.
- Keep commits in Conventional Commits format.

Commit examples:

```txt
feat(renderer): 优化 B 端预览渲染体验
fix(core): 修正引用完整性校验
docs: 完善本地安装说明
```

## License

MIT
