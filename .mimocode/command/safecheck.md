---
description: "Run typecheck, rebuild server, and verify. Usage: /safecheck [commit-message]"
---

# Safe Check Cycle

Run the full typecheck → build → verify cycle after code changes. Optionally commit if all passes.

## Usage

```
/safecheck                           # typecheck + build only
/safecheck "fix: correct ledger bug" # typecheck + build + git commit
```

## Steps

1. **Typecheck server**
   ```bash
   cd /home/fawad/ai/minierp && npm run typecheck:server 2>&1 | tail -20
   ```

2. **Typecheck client**
   ```bash
   cd /home/fawad/ai/minierp && npm run typecheck:client 2>&1 | tail -20
   ```

3. **Rebuild server**
   ```bash
   cd /home/fawad/ai/minierp/server && npm run build
   ```

4. **If commit message provided:**
   ```bash
   cd /home/fawad/ai/minierp && git add -A && git commit -m "$1"
   ```

## Safety Rules
- If typecheck fails, STOP. Do not build or commit.
- If build fails, STOP. Do not commit.
- Only commit after both typecheck and build succeed.
- Never use `--force` or `--no-verify` flags.
- Check `git status` before committing to verify only intended files are staged.

## Typical Workflow
After making code changes:
1. Run `/safecheck` to verify everything compiles
2. If it passes, make any final adjustments
3. Run `/safecheck "description of changes"` to verify + commit
