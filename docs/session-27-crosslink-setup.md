# Session 27 — Crosslink Setup + Documentation Consolidation

Pre-rollout session. Configures the issue-tracking infrastructure 
that Sessions 28-30 will use.

## Why now

Crosslink (https://github.com/forecast-bio/crosslink) is a session-
context-tracking CLI for AI-assisted development. The setup cost 
isn't justified during single-property fix work, but for the 
rollout phase (multiple properties, parallel work potential, 
repeated patterns, production stakes) the structured tracking 
earns its keep.

This session happens after Chill Zone is complete (Session 26) 
and before any rollout begins (Session 28+).

## Scope

### 1. Documentation audit and consolidation

Review every document in `docs/`. Decide for each:
- Authoritative — keep as-is (e.g., `docs/skill/rollout-checklist.md`, 
  `docs/skill/property-config.md`, `docs/retrospective.md` core rules)
- Historical — archive (most session handoffs, individual fix notes, 
  diagnostic-book-button.md, diagnostic-pricing-display.md)
- Stale — delete (anything contradicted by later work)
- Needs merge or rewrite

Output: a consolidated set of docs that are still relevant going 
forward, with archived material moved to `docs/archive/`.

### 2. Crosslink installation

Install Crosslink on the Windows + Git Bash setup. Solve any 
platform issues at this stage rather than during rollout.

```bash
cargo install crosslink
crosslink init
```

Verify the tool runs end-to-end (create issue, start session, 
record breadcrumb, end session, restart, verify session memory 
persisted) before moving on.

### 3. Migrate rollout-relevant state

- Convert per-property configs from `property-config.md` into 
  Crosslink issues with sub-issues per property
- Set up issue templates for each rollout step (CSS deploy, JS 
  deploy, admin layout config, booking flow verification, end-to-
  end test)
- Configure multi-agent locking if parallel property work is 
  intended

### 4. Configure Claude Code hooks

Crosslink offers behavioral hooks that enforce coding discipline 
automatically. Hooks worth enabling map to retrospective rules we've 
already learned the hard way:

- Adversarial review enforcement (rule 26)
- No-stubs / no-placeholder code
- Issue tracking enforcement (every change ties to an issue)
- Verification-before-fix pattern (catches Session 13 failure mode)

The hook config reference: 
https://forecast-bio.github.io/crosslink/reference/hook-config.html

Read this before the session starts and decide which hooks to enable.

### 5. Dry-run a property rollout

Before Session 28 actually deploys to a real property, dry-run the 
rollout flow inside Crosslink. Use a fake "property 5" or a clone 
of Chill Zone's config to verify:

- Issue templates create the right sub-issue structure
- Hooks fire when expected
- Session memory carries between sessions correctly
- Multi-agent locking (if used) doesn't block legitimate work

### 6. Document the new workflow

Write or update `WORKFLOW.md` (or extend CLAUDE.md) describing:
- How to start a Crosslink session
- Where breadcrumbs go
- How handoff happens between sessions in the new system
- What replaces the old `session-handoff-N.md` files (likely: 
  Crosslink session records become the handoff)
- Migration path for any existing handoffs that should remain 
  accessible

## Open questions to think about beforehand

1. What hooks does Crosslink actually offer? Read the hook config 
   reference and have an opinion before the session starts.
2. How does Crosslink integrate with multiple work surfaces (Claude 
   Code in VS, Claude Design, Claude chat)? Likely Claude Code via 
   MCP only; the others stay outside Crosslink scope.
3. What does multi-agent locking actually do for our solo workflow? 
   Worth understanding what we'd use it for during rollout.
4. Backup plan if Crosslink hits unfixable friction: existing 
   handoff workflow continues, lightweight automation around it 
   (a shell script that templates session-handoff files), and 
   Crosslink waits for a future project. Worth having this stated 
   so the session doesn't get stuck trying to make Crosslink work 
   past the point it's useful.

## Fallback plan

If Session 27 reveals Crosslink doesn't work on Windows or has 
unworkable bugs, abandon it for this project. The existing 
handoff-based workflow has been working through 20+ sessions and 
will continue to work for the rollout. Crosslink can be tried 
again on the next project.

The documentation consolidation in step 1 is valuable regardless 
of whether Crosslink installs successfully — that work happens 
either way.
