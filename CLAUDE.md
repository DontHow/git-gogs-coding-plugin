# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Code plugin marketplace repository for the IMW team. It provides Git + Gogs workflow plugins that wrap common Git operations (create branch, commit/push, create PR, merge) as Claude Code skills.

## Repository Structure

```
.claude-plugin/marketplace.json          # Marketplace manifest (currently empty)
plugins/
  imw-git-gogs/
    .claude-plugin/plugin.json           # Plugin manifest — name, description, version, author
    skills/
      imw-git-gogs-create-branch/SKILL.md
      imw-git-gogs-commit-and-push/SKILL.md
      imw-git-gogs-create-pr/SKILL.md
      imw-git-gogs-merge/SKILL.md
```

## Current State

- This repository is a skeleton with empty SKILL.md files (0 bytes each) and an empty marketplace manifest.
- The only populated file is `plugins/imw-git-gogs/.claude-plugin/plugin.json` which defines the plugin metadata.
- No build system, package manager, tests, or CI configuration exists yet.

## Plugin Format

Each skill is defined by a `SKILL.md` file in its own directory under `plugins/<plugin>/skills/<skill-name>/`. The plugin manifest at `plugins/<plugin>/.claude-plugin/plugin.json` follows this structure:

```json
{
  "name": "plugin-id",
  "description": "Human-readable description",
  "version": "x.y.z",
  "author": { "name": "..." }
}
```

## Notes

- Do not add build commands, test commands, or development workflows that do not exist in the repository.
- If adding new skills, follow the existing directory naming convention: `imw-git-gogs-<action>`.
