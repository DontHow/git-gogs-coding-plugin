---
name: sync-branch
description: Use when 用户用“更新到 dev”“同步目标分支”“把当前分支跟上某分支”等口语表达，需要先消除 Git 同步方向和方式歧义。
---

# Sync Branch

先应用 `/git-gogs-coding-plugin:git-safety`。本 Skill 负责消除“同步/更新”类口语歧义，并把用户确认后的方案交给明确的 Git 流程执行。

## 需要澄清的表达

以下表达不得直接执行：

```text
更新到 dev
同步 dev
同步到 dev
把当前分支更新到 dev
让当前分支和 dev 一样
跟上 dev
```

这些可能表示：

- 把 `dev` 合并到当前分支
- 把当前分支合并到 `dev`
- 把当前分支 rebase 到 `dev`
- 切换到 `dev`
- 将当前分支重置成 `dev`

不得自动切分支，不得 reset。

## 默认安全解释

如果用户没有明确方向，默认只提出以下理解，不直接执行：

```text
我理解为：把 <target> 的变更同步到当前分支，也就是 <target> -> 当前分支。
这不是切换到 <target>，也不是把当前分支重置为 <target>。
```

然后要求用户确认同步方式：

```text
请选择：
- merge：把 <target> 合并到当前分支
- rebase：把当前分支 rebase 到 <target>（仅在明确需要线性历史时使用）
- cancel：取消
```

## 检查

确认方向和方式前只做只读检查：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git status --porcelain
git rev-parse --abbrev-ref --symbolic-full-name @{u}
git remote
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git show-ref --verify --quiet refs/heads/<target-branch>
git show-ref --verify --quiet refs/remotes/<remote>/<target-branch>
```

远端目标分支必须基于 `git remote` 列出的 remote 名称逐个精确检查，不得硬编码 `origin`，也不得用正则假设 remote 名不含斜杠。

检查当前分支是否已发布（用于 rebase 防护）时，同样必须基于 `git remote` 逐个 remote 精确检查：

```bash
git show-ref --verify --quiet refs/remotes/<remote>/<current-branch>
```

如果当前分支存在 upstream，必须读取：

```bash
git log --oneline --left-right --cherry-pick @{u}...HEAD
```

如果 `git rev-parse --abbrev-ref --symbolic-full-name @{u}` 失败，只表示当前分支没有 upstream，不得因此终止检查。

需要刷新远端引用时，先单独确认 `git fetch --all --prune`，执行后重新检查。

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空或是保护分支
- 工作区不干净
- 存在未完成 merge/rebase/cherry-pick
- 目标分支不存在

## 执行分派

- 用户选择 `merge`：切换到 `merge` Skill，执行“目标分支 -> 当前分支”流程。
- 用户明确选择 `rebase`：先执行 rebase 防护检查；通过后输出 rebase 计划并再次确认；若执行中出现冲突，停止并切换到 `resolve-conflict`。
- 用户选择 `cancel` 或表达不明确：停止，不执行 Git 写操作。

## Rebase 防护

只有当前分支没有 upstream，且任一远端都不存在同名分支时，才允许进入 rebase 计划。

如果当前分支存在 upstream，或存在远端同名分支，视为已发布分支，必须停止 rebase，并建议改用 `merge`：

```text
暂不能 rebase

原因：当前分支已发布或可能已被他人基于使用，rebase 会重写本地历史；本插件禁止 force push，因此无法保证后续安全推送。

当前分支：
upstream：
远端同名分支：

建议：
- 使用 merge 同步目标分支
- 或在 `git-safety` 公共底线之外，由用户自行处理 rebase 及必要的 `force-with-lease`
```

rebase 计划必须包含：

```text
拟执行 rebase

当前分支：
目标分支：
执行命令：
git rebase <target-ref>
风险：
- 会重写当前分支未推送提交的本地历史
- 若分支已被他人基于使用，不建议执行

是否执行？（是/否）
```

禁止自动执行 `git push --force` 或 `git push --force-with-lease`。rebase 后如需推送，停止并说明：建议改用 merge；若坚持 rebase，远端历史需要用户自行处理。

## 输出

输出必须明确方向、方式和未执行的危险解释，例如“未切换分支”“未 reset 当前分支”。失败时说明当前分支、目标分支、选择的同步方式和停止原因。
