## Quick instructions for AI coding agents working in this workspace

This workspace is a local VS Code extensions store (installed extension packages under `extensions/`). Treat each folder under `extensions/` as an independent VS Code extension package. Use the examples below to find build, test and integration points quickly.

- Big picture
  - Root layout: `extensions/<publisher>.<name>-<version>/` is the primary surface. Each extension contains a `package.json` that defines its activation events, contributed commands, webviews, and build/test scripts.
  - Most extensions are TypeScript/Node projects with `dist/` (built output) and `extension` or `extension/src` for source. Example: `extensions/github.copilot-1.388.0/package.json` (has `main`, `browser`, `scripts`, `engines`).

- Where to look to understand behavior
  - `package.json` (per-extension): activationEvents, contributes (commands, configuration, menus), `main` (node extension entry) and `browser` (web extension entry). Example fields:
    - `activationEvents`: when the extension activates (e.g. `onStartupFinished`).
    - `contributes.commands`: lists command IDs and intended UI names.
  - `dist/` and `extension/` directories: compiled output; read `extension/src` or `lib/src` when present for runtime logic.
  - `assets/`, `syntaxes/`, and `readme.md` for UX and language contributions.

- Build and test workflows (concrete examples)
  - Typical build: cd into the extension folder and run the scripts listed in `package.json`.
    - Example (Copilot extension):
      - npm ci
      - npm run build
    - Many extensions declare `prebuild` or `pretest` hooks that run `npm install` or `npm run build`.
  - Run tests where provided. Example script names observed:
    - `npm run test` (runs mocha suites and linters)
    - `npm run test:extension` (runs VS Code extension tests via `@vscode/test-electron`)
    - `npm run vsix` or `vsce package` to create a packaged extension
  - Node/npm constraints: check `engines` in `package.json` (e.g. Copilot requires `node >=22.0.0` and `npm >=11.6.2`). Use the extension's own package.json to decide runtime requirements.

- Project-specific conventions and patterns
  - Per-extension self-contained npm scripts. Prefer invoking the script named in that extension's `package.json` rather than assuming a root script.
  - Build tool: many extensions use `tsx` + `esbuild` and TypeScript (`tsc`) for types. Look for `esbuild.ts`, `tsx` invocations, and `tsconfig.json` inside an extension folder.
  - Tests: mocha is the primary test runner (`mocha "lib/src/**/*.test.{ts,tsx}"`). Look at `test:` script variants to understand which suites run in CI vs locally.
  - Packaging: `vsce package` and `@vscode/vsce` are used for producing .vsix artifacts (script `vsix`).

- Integration points & cross-component communication
  - Extensions communicate via the VS Code Extension API and webviews (main/browser entries). Inspect `postMessage`/`onDidReceiveMessage` in webview code under `dist/web` or `extension/src`.
  - `extensionPack` in `package.json` groups related extensions; changes to one extension may affect behavior when the pack is installed.
  - Look for SDKs and external connectors in `dependencies` (examples: `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`, `@octokit/*`) — these indicate network calls and auth flows to be mindful of.

- How to be productive (actionable checklist for edits)
  - To modify runtime behavior: edit the TypeScript source under the corresponding extension folder (`extension/src`, `lib/src`, or `agent/src`), then run that folder's `npm run build`.
  - To run local tests for a change: from the extension folder run `npm ci` (or `npm install`), then `npm run test` or the more specific `test:extension` / `test:lib` scripts shown in package.json.
  - To debug an extension: prefer using VS Code's Extension Development Host (launch configuration found or created in `.vscode/launch.json`). If no launch config exists, use the `@vscode/test-electron` based tests or add a standard extension debug config.

- What not to assume
  - There is no single monorepo build command — treat each extension's `package.json` as the authoritative source for scripts and constraints.
  - This workspace appears to be a collection of installed extension packages (vendor copies). Edits here may be local; the authoritative source for each extension could be upstream repositories.

If any section feels incomplete or you want me to prioritize a specific extension to inspect (for example `github.copilot-1.388.0`), tell me which one and I'll expand examples and add quick-run commands for that package.
