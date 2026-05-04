---
name: commit-and-push
description: Use when 用户要求检查当前 Git 变更、生成提交计划、按 Conventional Commits 提交，或提交并推送当前分支。
---

# Commit and Push

先应用 `/imw-git-gogs:git-safety`。本 Skill 只负责当前分支的变更分析、提交和推送，不负责 merge、rebase、创建 PR、解决冲突或回滚。

## 意图识别

- “检查一下”“帮我看看”“生成提交计划”：只读分析并输出计划，不执行写操作。
- “提交”“提交并推送”“按计划执行”：先检查并输出提交计划，等待用户确认后执行。
- 用户只要求提交时，不默认 push；用户要求提交并推送时，提交完成后再按计划 push。

## 执行前检查

必须先读取：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git diff --stat
git diff --name-status
git diff
git diff --staged --stat
git diff --staged --name-status
git diff --staged
git ls-files --others --exclude-standard
```

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空或是保护分支
- 存在未完成 merge/rebase/cherry-pick，改用 `resolve-conflict`
- 没有任何 staged、unstaged 或 untracked 变更
- 任务包含 push 但没有 remote

如果用户明确要求空提交触发 CI，必须把 `git commit --allow-empty` 写入提交计划并再次确认；否则无变更时停止。

## 提交计划

必须基于 diff 内容生成计划，不得只看文件名。

计划必须包含：

```text
当前分支：
提交数量：
每个提交：
- type/scope/description
- 文件或 patch 范围
- 是否需要 body
推送命令：
风险：
是否执行？（是/否）
```

提交信息使用 Conventional Commits：

```text
<type>[optional scope][!]: <中文描述>
```

type 使用 `git-safety` 中的统一列表。merge commit 由 `merge` Skill 单独定义，不走本 Skill。

拆分规则：

- 按单一意图拆分提交。
- 逻辑变更、格式化、文档、测试、构建配置、不同模块的无关变更不得混在同一提交。
- 同文件多意图只在 patch 可清晰拆分时自动拆分；无法稳定拆分时停止并要求用户手动整理或明确授权交互式拆分。

## 执行

用户确认后按计划精确暂存：

```bash
git add <file>
git apply --cached --check <patch>
git apply --cached <patch>
```

禁止无计划执行 `git add .` 或 `git add -A`。只有用户明确要求“提交全部变更”，且计划已覆盖全部变更时，才允许使用 `git add -A`。

每次 commit 前必须检查：

```bash
git diff --staged --stat
git diff --staged
```

确认 staged 内容只属于当前提交后，使用 `git commit -F <message-file>` 或 `git commit -m <message>`。

所有提交完成后，如果用户要求推送：

```bash
git status -sb
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

如果当前分支已有 upstream，执行：

```bash
git push
```

如果当前分支没有 upstream，执行：

```bash
git push -u origin HEAD
```

只允许推送当前分支。禁止 force push。

## 输出

成功时输出：

```text
提交并推送完成

当前分支：
提交：
- <hash> <message>
是否已推送：
工作区状态：
```

失败时输出失败步骤、失败原因、已完成的提交或推送、当前分支和工作区状态。不得隐瞒部分成功的操作。
