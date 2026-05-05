---
name: create-pr
description: Use when 用户需要检查当前分支能否创建 Pull Request、生成 PR 标题和描述，或确认后创建 PR。
---

# Create PR

先应用 `/git-gogs-coding-plugin:git-safety`。本 Skill 只负责当前分支发起 PR，不负责提交普通代码、同步目标分支、解决冲突或合并 PR。

## 语义

默认当前分支是 source branch。目标分支必须明确。

```text
创建 PR 到 dev
= 当前分支 -> dev
```

如果用户未指定目标分支，必须要求用户补充，不得猜测。

## 检查

检查类请求只输出可行性和 PR 内容，不创建 PR。

必须读取：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git status --porcelain
git remote -v
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git show-ref --verify --quiet refs/heads/<target-branch>
git show-ref --verify --quiet refs/remotes/<remote>/<target-branch>
git merge-base HEAD <target-ref>
git log --oneline --left-right --cherry-pick <target-ref>...HEAD
git diff --stat <target-ref>...HEAD
git diff --name-status <target-ref>...HEAD
git diff <target-ref>...HEAD
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

远端目标分支必须基于 `git remote -v` 列出的 remote 名称逐个精确检查，不得硬编码 `origin`，也不得用正则假设 remote 名不含斜杠。

需要刷新远端引用时，先单独确认 `git fetch --all --prune`，执行后重新检查。

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空或是保护分支
- 工作区不干净
- 存在未完成 merge/rebase/cherry-pick
- remote 不存在
- 目标分支不存在
- 当前分支相对目标分支没有有效差异

如果当前分支未推送或有未推送提交，必须暂停并询问是否推送当前分支。

如果当前分支已有 upstream，执行：

```bash
git push
```

如果当前分支没有 upstream，必须先基于 `git remote -v` 列出的 remote 让用户选择目标 remote，不得自动假设 `origin`：

```bash
git push -u <remote> HEAD
```

推送完成后必须重新执行完整 PR 检查。

## PR 内容

PR 标题和描述必须基于提交和 diff 生成，不得只根据分支名猜测。

标题推荐：

```text
<type>[optional scope]: <中文简短描述>
```

type 使用 `git-safety` 中的统一列表，scope 可选。

描述模板：

```markdown
## 变更说明

-

## 影响范围

-

## 自测情况

- [ ] 已完成本地编译
- [ ] 已完成核心流程自测
- [ ] 已确认无无关文件变更

## 风险点

-

## 关联信息

-
```

无法确认自测时不得编造，写 `- [ ] 未确认，需要用户补充`。关联信息可写 issue、Jira、Linear 或 Gogs 工单编号；没有关联信息时写 `- 无`。

## 创建计划

创建前必须输出：

```text
拟创建 PR

来源分支：
目标分支：
提交数量：
影响文件：
- path/to/file
PR 标题：
PR 描述：
创建方式：
- 自动创建 / 手动创建
风险：

是否创建？（是/否）
```

用户要求调整标题或描述时，重新生成内容并再次确认。

## 创建

只有在以下条件满足后才允许创建：

- 工作区干净
- 当前分支已推送到远端
- 目标分支存在
- PR 标题和描述已确认

## PR 创建方式

优先使用 Gogs MCP。

必须先从当前分支的 upstream 解析 source branch 和 remote：

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git remote get-url <remote>
```

从 remote URL 解析 `owner/repo`，必须兼容带 `.git` 与不带 `.git` 的形式：

```text
https://<host>/<owner>/<repo>
https://<host>/<owner>/<repo>.git
git@<host>:<owner>/<repo>
git@<host>:<owner>/<repo>.git
ssh://git@<host>/<owner>/<repo>
ssh://git@<host>/<owner>/<repo>.git
```

解析后，如果 `mcp__gogs-pr__gogs_list_pull_requests` 可用，先检查是否已存在同 head/base 的 open PR；如已存在，不得重复创建，输出已有 PR。

用户确认创建后，必须优先调用：

```text
mcp__gogs-pr__gogs_create_pull_request
```

调用前必须先读取该工具的实际 schema，按 schema 字段名精确填入；不得自创字段名。基于当前 Gogs MCP schema，字段映射如下：

```text
owner: 解析自 remote URL
repo:  解析自 remote URL
head:  当前分支名（同仓库内传裸分支名）
base:  用户指定的目标分支
title: 已确认的 PR 标题
body:  已确认的 PR 描述
```

只有以下情况才允许降级为手动创建步骤：

- 当前环境没有 `gogs-pr` MCP 工具
- remote URL 无法解析出 owner/repo
- MCP 认证或请求失败

降级时必须说明降级原因，不得伪造 PR 创建成功。

## 输出

自动创建成功时输出 PR 地址、来源分支、目标分支、标题、是否已推送和工作区状态。

未自动创建时输出完整 PR 内容和手动创建步骤。

失败时输出失败步骤、失败原因、是否已推送、PR 内容和建议处理方式。
