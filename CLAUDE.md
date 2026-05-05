# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

本仓库是 IMW 团队的 Claude Code 插件市场。它提供基于 Git + Gogs 工作流的插件，将 Git 公共安全底线和常见工作流封装为 Claude Code 技能。

本仓库同时维护 Claude Code、Codex、Cursor 和 OpenCode 四端插件配置，skills 目录为共享内容。

## 仓库结构

```
.claude-plugin/marketplace.json          # Claude Code 市场清单
plugins/
  git-gogs-coding-plugin/
    .claude-plugin/plugin.json           # Claude Code 插件清单
    skills/
      git-safety/SKILL.md                # 公共安全底线
      create-branch/SKILL.md             # 创建开发分支
      commit-and-push/SKILL.md           # 分析变更、提交并推送
      merge/SKILL.md                     # 合并分支
      create-pr/SKILL.md                 # 创建 Gogs PR
      sync-branch/SKILL.md               # 同步分支
      resolve-conflict/SKILL.md          # 处理冲突
      rollback-safe/SKILL.md             # 安全回滚

.codex-plugin/plugin.json                # Codex 插件配置
.cursor-plugin/plugin.json               # Cursor 插件配置
.opencode/plugins/git-gogs-coding-plugin.js  # OpenCode 插件
```

## 当前状态

- 本仓库当前包含两层 Git Skill：`git-safety` 公共底线，以及 7 个独立工作流 Skill。
- `git-safety` 不是工作流；它定义所有 Git Skill 必须遵守的公共禁令。
- 工作流 Skill 包括 `create-branch`、`commit-and-push`、`merge`、`create-pr`、`sync-branch`、`resolve-conflict`、`rollback-safe`。
- `create-pr` 优先依赖运行环境中的 `gogs-pr` MCP 创建 Gogs PR，不可用时降级为手动创建内容。
- 已配置 Codex、Cursor、OpenCode 三端插件配置，skills 目录为共享内容，各平台 manifest 指向 `./plugins/git-gogs-coding-plugin/skills/`。
- 目前尚未配置构建系统、包管理器、测试或 CI；验证以结构检查和内容检查为主。

## 插件格式

### Claude Code

市场清单位于 `.claude-plugin/marketplace.json`，插件清单位于 `plugins/<plugin>/.claude-plugin/plugin.json`：

```json
{
  "name": "plugin-id",
  "description": "Human-readable description",
  "version": "x.y.z",
  "author": { "name": "..." }
}
```

### Codex

配置位于 `.codex-plugin/plugin.json`，含 `skills` 和 `interface` 字段：

```json
{
  "name": "plugin-id",
  "version": "x.y.z",
  "skills": "./plugins/git-gogs-coding-plugin/skills/",
  "interface": { "displayName": "...", "category": "Coding", ... }
}
```

### Cursor

配置位于 `.cursor-plugin/plugin.json`：

```json
{
  "name": "plugin-id",
  "displayName": "...",
  "skills": "./plugins/git-gogs-coding-plugin/skills/"
}
```

### OpenCode

插件为 JavaScript 模块，位于 `.opencode/plugins/git-gogs-coding-plugin.js`，通过 `config` hook 注册 skills 目录路径。

## 注意事项

- 不要添加仓库中不存在的构建命令、测试命令或开发工作流。
- 如需添加新技能，请遵循现有目录命名约定：`<action>`，并先判断是否属于公共底线还是独立工作流。
- 新增或修改跨平台配置时，保持各端 `name`、`version`、`description` 一致，skills 路径统一指向 `./plugins/git-gogs-coding-plugin/skills/`。

---

## Skill 编写行为指南

- `git-safety` 只写所有 Git Skill 共同遵守的底线，不写完整业务流程。
- 工作流 Skill 只负责自己的触发语义、检查项、计划输出、确认点、执行边界和失败输出。
- 任何 Git 写操作必须能在 Skill 文本中找到对应的前置检查、计划展示和用户确认。
- 涉及远端刷新、推送、Gogs PR 创建、stash、merge、rebase、rollback 的流程必须说明降级或停止条件。
- 命令块必须可读、可复制；不要把互斥命令并列成“全部执行”的形式。
- 新增或修改 Skill 后，至少运行 frontmatter 校验、JSON 校验、`git diff --check` 和针对本次需求的文本断言。
