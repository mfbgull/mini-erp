---
name: codebase-audit
description: "Run a comprehensive codebase audit: dead code, orphan files, unused exports, security patterns, and code quality. Trigger when user asks to find dead code, audit the codebase, check for unused code/orphans, or run a code quality review."
---

# Codebase Audit

Systematic audit of the MiniERP codebase for dead code, orphan files, unused exports, security patterns, and code quality issues. Derived from 4+ repeated audit sessions.

## When to Use

- User asks to "find dead code" or "check for unused code"
- User asks for a "code audit", "code quality audit", or "refactoring audit"
- User asks to find "orphan CSS", "orphan files", or "unused components"
- User asks to check for "security issues" or "security audit"
- Any broad codebase hygiene request

## Audit Categories

Run all applicable categories. Skip categories the user explicitly excludes.

### Category 1: Dead Code Detection

**Unused files** — files that exist but are never imported anywhere:

```bash
# For each candidate file, check if it's imported by anything
for f in <file-list>; do
  name=$(basename "$f" .ts | basename "$f" .tsx)
  count=$(grep -r "$name" --include='*.ts' --include='*.tsx' <dirs> 2>/dev/null | grep -v "$f" | wc -l)
  [ "$count" -eq "0" ] && echo "DEAD FILE: $f"
done
```

**Unused exports** — functions, constants, types, classes exported but never referenced:

```bash
# For each file, extract exports and check cross-file usage
grep -oP "export (?:default |)(?:const |function |async function |class |type |interface |enum )?\K\w+" "$file" | while read fn; do
  [ -z "$fn" ] && continue
  count=$(grep -r "$fn" --include='*.ts' --include='*.tsx' <dirs> 2>/dev/null | grep -v "$(basename $file)" | wc -l)
  [ "$count" -eq "0" ] && echo "DEAD EXPORT: $fn in $(basename $file)"
done
```

**Unused TypeScript types** — exported types with zero external references:

```bash
grep -oP "export interface \K\w+|export type \K\w+|export enum \K\w+" types/index.ts | while read name; do
  count=$(grep -r "$name" --include='*.ts' --include='*.tsx' <dirs> 2>/dev/null | grep -v "types/index.ts" | wc -l)
  [ "$count" -eq "0" ] && echo "UNUSED TYPE: $name"
done
```

**Checklist by directory:**
- `server/src/models/` — each model file should be imported by at least one controller or route
- `server/src/utils/` — each utility should be imported by at least one model/controller
- `server/src/middleware/` — each middleware should be used in app.ts or a route file
- `server/src/services/` — each service should be imported by at least one controller
- `server/src/controllers/` — each controller export should be referenced in a route file
- `client/src/utils/` — each utility should be imported by at least one component/hook
- `client/src/hooks/` — each hook should be called by at least one component
- `client/src/context/` — each context should be provided in App.tsx and consumed by components
- `client/src/components/common/` — each component should be imported by at least one page

### Category 2: Orphan Files

**Orphan CSS** — `.css` files with no matching `.tsx` import:

```bash
for css in client/src/**/*.css; do
  base=$(basename "$css" .css)
  count=$(grep -r "$base" --include='*.tsx' --include='*.ts' client/src/ 2>/dev/null | grep -v "$css" | wc -l)
  [ "$count" -eq "0" ] && echo "ORPHAN CSS: $css"
done
```

**Orphan components** — `.tsx` files in components/ not imported anywhere:

```bash
for f in client/src/components/**/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -r "$name" --include='*.tsx' --include='*.ts' client/src/ 2>/dev/null | grep -v "$(basename $f)" | wc -l)
  [ "$count" -eq "0" ] && echo "ORPHAN COMPONENT: $f"
done
```

### Category 3: Code Quality Patterns

**`any` type usage:**
```bash
grep -rn ": any\b\|as any\|<any>" --include='*.ts' --include='*.tsx' server/src/ client/src/ | grep -v node_modules | grep -v __tests__
```

**TODO/FIXME/HACK markers:**
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|DEPRECATED" --include='*.ts' --include='*.tsx' server/src/ client/src/
```

**Commented-out code blocks** (lines starting with `//` containing code-like patterns):
```bash
grep -rn "^\s*//\s*\w\+\s*(" --include='*.ts' --include='*.tsx' server/src/ client/src/ | grep -v __tests__
```

**Console.log left in production code:**
```bash
grep -rn "console\.\(log\|debug\|warn\)" --include='*.ts' --include='*.tsx' server/src/ client/src/ | grep -v __tests__ | grep -v node_modules
```

### Category 4: Security Patterns

**Path traversal risks:**
```bash
grep -rn "req\.params\|req\.query" --include='*.ts' server/src/controllers/ | grep -v "sanitize\|validate\|parseInt\|Number("
```

**SQL injection (string concatenation in queries):**
```bash
grep -rn "'" --include='*.ts' server/src/models/ | grep "prepare\|exec\|run\|get\|all" | grep -v "prepared\|param\|?"
```

**Error message leakage** (sending raw error to client):
```bash
grep -rn "res\.status.*json.*error" --include='*.ts' server/src/controllers/ | grep -v "apiResponse"
```

**Missing transactions** (multi-statement writes without db.transaction):
```bash
grep -rn "\.prepare\|\.run\|\.exec" --include='*.ts' server/src/models/ | grep -v "transaction" | head -30
```

### Category 5: Dependency Hygiene

**Unused npm packages:**
```bash
# Check server dependencies
for dep in $(node -e "console.log(Object.keys(require('./server/package.json').dependencies).join('\n'))"); do
  count=$(grep -r "$dep" --include='*.ts' server/src/ 2>/dev/null | wc -l)
  [ "$count" -eq "0" ] && echo "UNUSED DEP: $dep"
done

# Check client dependencies
for dep in $(node -e "console.log(Object.keys(require('./client/package.json').dependencies).join('\n'))"); do
  count=$(grep -r "$dep" --include='*.ts' --include='*.tsx' client/src/ 2>/dev/null | wc -l)
  [ "$count" -eq "0" ] && echo "UNUSED DEP: $dep"
done
```

## Execution Order

1. **Dead code** (highest ROI — removes lines, reduces confusion)
2. **Orphan files** (quick wins — delete unused files)
3. **Code quality** (informational — report, don't auto-fix without user approval)
4. **Security** (informational — report findings, fix only P0/P1 with user approval)
5. **Dependency hygiene** (low priority — only if user asks)

## Output Format

Group findings by category. For each finding:
- **File path** and **line number(s)**
- **What** is dead/unused/orphaned
- **Evidence** (e.g., "0 references outside defining file", "never imported")
- **Confidence** (high/medium — some exports may be used dynamically)

## Safety Rules

- **Read-only by default** — report findings, do not delete/modify without explicit user approval
- **Verify before reporting** — cross-reference with at least 2 search patterns before marking something dead
- **Watch for dynamic usage** — `React.lazy()`, dynamic `import()`, re-exports through barrel files can make things appear unused when they're not
- **Check re-exports** — a module may be "used" via `export * from './foo'` patterns
- **Exclude test files** from dead code analysis (`__tests__/`, `*.test.ts`, `*.spec.ts`)

## Known False Positive Patterns

- **`ledgerExport.ts`** — appears unused but is imported in LedgerTab.tsx for CSV/PDF export
- **`useTranslation.ts`** — used in 68+ files for English/Urdu i18n, don't delete
- **`queryUtils.ts`** / **`sqlSanitizer.ts`** — different purposes, no overlap
- **`requirePermission`** — real RBAC with 243+ usages
- **Context providers in `App.tsx`** — may not appear in grep results due to lazy loading
