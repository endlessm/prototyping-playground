---
title: Agent context routing
description: Agent context routing guidance for the Endless team.
---

Root AGENTS.md is hand edited. Only the studio:modules marker block is generated. CLAUDE.md includes it. `yarn studio sync` reads enabled module declarations, platform skills and registered systems' skills. Root task routes are declared with a module-relative path and a when trigger in module.ts. Every skills/<name>/SKILL.md in an enabled module is exposed as an adapter, including supporting skills without a root route. A disabled module loses its routes and adapters. Future modules use the same discovery path.

Canonical sources live under src/platform/skills, src/modules/<id>/skills and src/systems/<id>/skills. Adapters in .agents/skills serve Codex and Cursor; .claude/skills serves Claude Code. The hash manifest .agents/studio-skills.json records generated content. Hand-written files are preserved. Edited generated entries produce a refusal rather than overwriting work. Resolve the edit into its canonical source, then remove only the obsolete generated adapter and sync again. `sync --check` writes nothing and exits nonzero for drift.

Resolve the system with studio context before using system guidance. Skill discovery grants no permission and enables no capability. See [Responsibilities](contracts-and-instructions.md).

Context & Skills discovers the Platform README, context documents and skills under src/platform automatically, plus enabled modules' guidance. It remains available when the optional Documentation module (the Manual) is disabled. Keep canonical guidance in those owner folders; no browser registration is needed.
