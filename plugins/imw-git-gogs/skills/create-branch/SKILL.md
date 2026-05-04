---
name: create-branch
description: 当用户需要基于现有本地或远端目标分支创建新的 Git 开发分支（feature/fix/hotfix/chore）时使用本技能。/ This skill should be used when the user wants to create a new Git development branch from an existing local or remote target branch for feature, fix, hotfix, or chore work in the IMW Git + Gogs workflow.
---

# Create Branch

本 Skill 用于创建新的 Git 开发分支。

它只负责“新建分支”相关流程，不负责直接提交、推送、合并目标分支、创建 PR。

## 适用场景

当用户表达以下意图时，使用本 Skill：

- 新建开发分支
- 创建分支
- 从某个目标分支拉新分支
- 创建 feature 分支
- 创建 fix 分支
- 创建 hotfix 分支
- 创建 chore 分支
- 开始一个新需求分支
- 开始一个 bugfix 分支

## 必须收集的信息

创建分支前必须明确两个信息：

```text
目标分支：
新分支名：
```

如果用户没有指定目标分支，必须从当前仓库的本地分支和远端分支中读取可选项，然后以选项的方式供给用户选择。

禁止写死目标分支选项。

## 目标分支来源

目标分支必须从真实存在的本地分支或远端分支中获取。

先同步远端信息：

```bash
git fetch --prune --all
```

读取本地分支：

```bash
git for-each-ref --format='%(refname:short)' refs/heads
```

读取远端分支：

```bash
git for-each-ref --format='%(refname:short)' refs/remotes | grep -vE '/HEAD$'
```

向用户展示时，必须区分本地分支和远端分支：

```text
请选择目标分支：

本地分支：
- dev
- feature/example

远端分支：
- origin/dev
- origin/master
- origin/release/v1.2.0
```

如果没有任何可用分支，必须终止流程。

如果用户手动输入目标分支，必须检查该分支是否真实存在。

## 目标分支解析规则

用户选择的目标分支可以是本地分支，也可以是远端分支。

### 本地分支

如果用户选择：

```text
dev
```

并且存在：

```bash
refs/heads/dev
```

创建分支时使用：

```bash
git switch -c <new_branch> dev
```

### 远端分支

如果用户选择：

```text
origin/dev
```

并且存在：

```bash
refs/remotes/origin/dev
```

创建分支时使用：

```bash
git switch -c <new_branch> origin/dev
```

### 裸分支名歧义

如果用户输入的是裸分支名，例如：

```text
dev
```

同时存在：

```text
本地：dev
远端：origin/dev
```

必须询问用户选择具体来源：

```text
检测到多个同名目标分支，请选择：

- 本地分支：dev
- 远端分支：origin/dev
```

禁止在存在歧义时自动选择。

## 新分支名规则

如果用户没有指定新分支名，可以根据用户描述生成一个分支名，但必须在执行前展示给用户确认。

新分支名优先使用以下格式：

```text
feature/<short-description>
fix/<short-description>
hotfix/<short-description>
chore/<short-description>
```

示例：

```text
feature/login-agreement-refactor
fix/patient-list-filter-lost
hotfix/app-crash-on-launch
chore/update-pr-workflow
```

新分支名必须满足：

- 使用小写英文
- 使用短横线 `-` 分隔单词
- 不使用中文
- 不使用空格
- 不使用特殊符号
- 不使用连续斜杠
- 不以斜杠结尾

## 保护分支

禁止创建与以下保护分支同名的新分支：

```text
master
main
dev
develop
release
staging
production
```

如果用户要求创建这些分支名作为新分支名，必须终止并说明原因。

注意：保护分支可以作为目标分支，但不能作为新分支名。

## 执行前检查

执行任何分支创建操作前，必须先检查当前仓库状态：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git remote -v
```

如果当前目录不是 Git 仓库，必须终止。

## 未提交变更处理

如果当前存在未提交变更，不能直接创建分支，也不能直接终止。

必须先展示当前变更：

```bash
git status --short
```

然后询问用户如何处理：

```text
当前存在未提交变更，请选择处理方式：

- 执行 /imw-git-gogs:commit-and-push，先提交并推送当前变更
- stash，临时保存当前变更后继续创建分支
- discard，丢弃当前未提交变更后继续创建分支
- cancel，终止创建分支
```

### 选择 commit-and-push

如果用户选择提交并推送，必须引导用户执行：

```text
/imw-git-gogs:commit-and-push
```

执行完成后，再重新运行本 Skill 创建分支。

不要在本 Skill 内部直接执行 commit 或 push。

### 选择 stash

如果用户选择 stash，可以执行：

```bash
git stash push -u -m "before-create-branch"
```

然后继续创建分支。

stash 完成后必须提醒用户：

```text
当前变更已 stash。创建分支完成后，如需恢复变更，请执行：

git stash list
git stash pop
```

### 选择 discard

如果用户选择 discard，必须再次确认。

提示：

```text
discard 会丢弃当前所有未提交变更，无法通过普通 Git 操作恢复。请确认是否继续。
```

只有用户明确确认后，才允许执行：

```bash
git restore .
git clean -fd
```

执行后必须重新检查：

```bash
git status --short
```

### 选择 cancel

如果用户选择 cancel，必须终止流程，不执行任何分支创建操作。

## 目标分支检查

创建分支前必须检查目标分支是否存在。

如果目标分支是本地分支，例如：

```text
dev
```

检查：

```bash
git show-ref --verify --quiet refs/heads/dev
```

如果目标分支是远端分支，例如：

```text
origin/dev
```

检查：

```bash
git show-ref --verify --quiet refs/remotes/origin/dev
```

如果目标分支不存在，必须终止，并提示目标分支不存在。

不要自动改用其他分支。

## 新分支冲突检查

创建前必须检查本地是否已存在同名分支：

```bash
git show-ref --verify --quiet refs/heads/<new_branch>
```

如果本地已存在同名分支，必须终止，并提示用户换一个分支名。

创建前必须检查远端是否已存在同名分支：

```bash
git show-ref --verify --quiet refs/remotes/origin/<new_branch>
```

如果远端已存在同名分支，必须终止，并提示用户换一个分支名或切换到已有分支。

## 创建分支

确认目标分支和新分支名后，从用户选择的目标分支创建新分支。

如果目标分支是本地分支：

```bash
git switch -c <new_branch> <target_branch>
```

如果目标分支是远端分支：

```bash
git switch -c <new_branch> <remote>/<target_branch>
```

示例：

```bash
git switch -c feature/login-agreement-refactor origin/dev
```

创建完成后检查当前分支和工作区状态：

```bash
git branch --show-current
git status --short
```

## 禁止行为

本 Skill 默认禁止执行：

```bash
git add
git commit
git push
git merge
git rebase
git reset --hard
git branch -D
git push --force
git push --force-with-lease
```

本 Skill 只有在用户选择 stash 时，才允许执行：

```bash
git stash push -u -m "before-create-branch"
```

本 Skill 只有在用户选择 discard 并二次确认后，才允许执行：

```bash
git restore .
git clean -fd
```

## 失败处理

如果流程失败，必须停止，不要尝试自动修复，不要继续执行其他 Git 操作。

失败时输出：

```text
创建开发分支失败

失败步骤：
失败原因：
当前分支：
目标分支：
新分支：
工作区状态：
建议处理：
```

## 成功输出

成功时输出：

```text
创建开发分支完成

仓库路径：
来源分支：
新分支：
当前分支：
工作区状态：
```

如果执行过 stash，必须在成功输出的「工作区状态」之后、流程结束前追加以下提示，不可作为额外输出：

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 注意：创建分支前已执行 stash

查看 stash：
  git stash list

恢复 stash：
  git stash pop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 标准执行流程

推荐执行顺序：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git remote -v
```

如果用户未指定目标分支，执行：

```bash
git fetch --prune --all
git for-each-ref --format='%(refname:short)' refs/heads
git for-each-ref --format='%(refname:short)' refs/remotes | grep -vE '/HEAD$'
```

然后让用户从真实存在的本地分支或远端分支中选择目标分支。

如果存在未提交变更，先询问处理方式。

确认可以继续后执行：

```bash
git show-ref --verify --quiet refs/heads/<target_branch>
```

或：

```bash
git show-ref --verify --quiet refs/remotes/<remote>/<target_branch>
```

然后检查新分支是否冲突：

```bash
git show-ref --verify --quiet refs/heads/<new_branch>
git show-ref --verify --quiet refs/remotes/origin/<new_branch>
```

最后创建分支：

```bash
git switch -c <new_branch> <resolved_target_ref>
```

## 示例

用户输入：

```text
新建一个登录协议重构的开发分支
```

如果用户没有指定目标分支，必须先读取真实分支列表：

```bash
git fetch --prune --all
git for-each-ref --format='%(refname:short)' refs/heads
git for-each-ref --format='%(refname:short)' refs/remotes | grep -vE '/HEAD$'
```

然后询问：

```text
请选择目标分支：

本地分支：
- dev

远端分支：
- origin/dev
- origin/master
```

用户选择：

```text
origin/dev
```

生成分支名：

```text
feature/login-agreement-refactor
```

执行前确认：

```text
将从 origin/dev 创建新分支：

feature/login-agreement-refactor

是否继续？
```

用户确认后执行：

```bash
git switch -c feature/login-agreement-refactor origin/dev
```