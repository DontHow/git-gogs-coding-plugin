---
name: create-branch
description: Use when 用户需要从现有本地或远端分支创建新的 Git 开发分支，或要求新建 feature、fix、hotfix、chore 分支。
---

# Create Branch

先应用 `/git-gogs-coding-plugin:git-safety`。本 Skill 只负责从已存在的来源分支创建新开发分支，不负责提交、推送、merge、rebase、创建 PR、解决冲突或回滚。

## 需要明确的信息

必须明确：

```text
来源分支：
新分支名：
```

如果用户没有指定来源分支，读取真实分支列表后让用户选择，不得写死默认分支。

如果用户没有指定新分支名，可以根据需求描述生成候选分支名，但执行前必须让用户确认。

## 分支名规则

新分支名推荐：

```text
feature/<short-description>
fix/<short-description>
hotfix/<short-description>
chore/<short-description>
```

如果用户或团队语境明确需要，也允许 `release/<short-description>` 或 `docs/<short-description>`；不得自行扩展其他前缀。

必须满足：

- 使用小写英文、数字、短横线和单个斜杠分组
- 不使用中文、空格、下划线或特殊符号
- 不包含连续斜杠
- 不以斜杠结尾
- 不得与保护分支同名

保护分支可以作为来源分支，但不能作为新分支名。

## 检查

执行前必须读取：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git status --porcelain
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
```

只有需要刷新远端、展示远端来源或排查远端分支时，才读取：

```bash
git remote -v
```

需要刷新分支列表时，先单独确认 `git fetch --all --prune`，执行后重新读取：

```bash
git for-each-ref --format='%(refname:short)' refs/heads
git for-each-ref --format='%(refname:short)' refs/remotes | grep -vE '/HEAD$'
```

必须检查来源分支是否存在：

```bash
git show-ref --verify --quiet refs/heads/<source-branch>
git remote
git show-ref --verify --quiet refs/remotes/<remote>/<source-branch>
```

必须检查新分支是否冲突：

```bash
git show-ref --verify --quiet refs/heads/<new-branch>
git remote
git show-ref --verify --quiet refs/remotes/<remote>/<new-branch>
```

远端来源分支和远端同名新分支必须基于 `git remote` 逐个 remote 精确检查，不得用正则假设 remote 名不含斜杠。

来源分支解析规则：

- 用户输入本地分支名且 `refs/heads/<source-branch>` 存在时，来源引用为 `<source-branch>`。
- 用户输入远端分支名如 `origin/dev` 且 `refs/remotes/origin/dev` 存在时，来源引用为 `origin/dev`。
- 用户输入裸分支名如 `dev`，且本地和任一远端同名，或多个远端同名时，必须让用户选择具体来源，例如 `dev`、`origin/dev` 或 `upstream/dev`。
- 不得自动创建本地跟踪分支。

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空
- 存在未完成 merge/rebase/cherry-pick
- 来源分支不存在
- 新分支名不合法
- 本地或远端已存在同名新分支

## 工作区不干净处理

创建分支会切换到新分支。工作区不干净时，不得静默创建。

必须输出当前未提交变更，并让用户选择：

```text
当前工作区存在未提交变更

当前分支：
来源分支：
新分支：
未提交变更：
- path/to/file

请选择：
- continue：创建新分支，并把当前未提交变更带到新分支
- commit-and-push：先提交并推送当前变更
- stash：确认后 stash 当前变更，再创建分支
- cancel：取消
```

只有当来源分支就是当前 `HEAD`，才允许 `continue`。如果来源分支不是当前 `HEAD`，必须要求用户先处理工作区变更，避免把变更带到错误基线。

选择 `commit-and-push` 时，切换到 `commit-and-push` Skill；完成后必须重新执行本 Skill 检查。

选择 `stash` 时，用户确认后才允许：

```bash
git stash push -u -m "before-create-branch"
```

禁止提供或执行 discard 选项。

## 创建计划

执行前必须输出：

```text
拟创建开发分支

当前分支：
来源分支：
实际来源引用：
新分支：
工作区状态：
执行命令：
git switch -c <new-branch> <source-ref>

说明：
- 该命令会创建并切换到新分支
- 未执行提交、推送、merge 或 rebase

是否执行？（是/否）
```

未经用户确认，不得执行 `git switch -c`。

## 执行

用户确认后执行：

```bash
git switch -c <new-branch> <source-ref>
git branch --show-current
git status -sb
```

不得自动推送新分支。

如果创建前执行过 stash，成功输出里必须提醒：

```text
创建分支前已执行 stash。
查看：git stash list
恢复：git stash pop
```

## 输出

成功时输出仓库路径、来源分支、新分支、当前分支、工作区状态，以及是否执行过 stash。

失败时输出失败步骤、失败原因、当前分支、来源分支、新分支和建议处理方式。不得自动切到其他分支补救。
