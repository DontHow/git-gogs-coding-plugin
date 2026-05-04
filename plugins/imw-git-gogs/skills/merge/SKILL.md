---
name: merge
description: 当用户需要将指定 Git 分支安全合并到当前工作分支时使用。本 Skill 会检查仓库状态、保护分支、远端分支、合并预览，并在用户确认后执行 merge。
---

# Merge

用于将指定来源分支安全合并到当前工作分支。

核心流程：

```text
检查仓库 → 检查当前分支 → 检查工作区 → 拉取远端信息 → 分析合并影响 → 生成合并计划 → 用户确认 → 执行 merge → 检查结果
```

本 Skill 只负责：

- 检查当前 Git 仓库状态
- 检查当前分支是否允许合并
- 检查来源分支是否存在
- 分析来源分支与当前分支差异
- 生成合并计划
- 用户确认后执行 merge
- 合并后输出结果

本 Skill 不负责：

- 创建分支
- 删除分支
- rebase
- squash
- cherry-pick
- 创建 Pull Request
- 提交业务代码
- 推送远端分支
- 自动解决冲突

## 核心原则

- 默认将指定来源分支合并到当前分支
- 未经用户明确确认，不得执行写操作
- 不得在保护分支上执行 merge
- 不得自动切换分支
- 不得自动创建分支
- 不得自动解决冲突
- 不得执行破坏性 Git 命令
- 合并前必须确保工作区干净
- 合并前必须分析来源分支与当前分支差异
- 合并后不得自动 push，除非用户明确要求

未经用户明确确认，不得执行：

```bash
git merge
git commit
git push
git merge --abort
```

用户确认可以是：

```text
是
确认
执行
按计划执行
可以
同意
```

如果用户只要求“检查一下”“帮我看看”“能不能合并”，不得执行 merge。

## 默认语义

当用户说：

```text
合并 dev
merge dev
把 dev 合进来
同步 dev
更新当前分支到 dev
```

默认理解为：

```text
将 dev 合并到当前分支
```

即：

```bash
git merge dev
```

不是将当前分支合并到 `dev`。

如果用户表达不明确，必须先根据当前分支和目标分支生成计划，不得直接执行。

## 保护分支

如果当前分支是以下分支，必须终止：

```text
master
main
dev
develop
release
staging
production
```

不得在保护分支上直接执行 merge。

不得自动切换分支。

不得自动创建分支。

如果用户确实要将功能分支合并到保护分支，应提示用户走 PR 流程。

## 执行前检查

执行任何写操作前，必须先检查：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
```

如果出现以下情况，必须终止：

- 当前目录不是 Git 仓库
- 当前分支为空
- 当前分支是保护分支
- 没有 remote
- 工作区存在未提交变更
- 当前处于 merge/rebase/cherry-pick 等未完成状态

检查是否处于未完成状态：

```bash
git status -sb
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
```

## 工作区要求

执行 merge 前，工作区必须干净。

必须检查：

```bash
git status --porcelain
```

如果存在任何输出，必须终止，并提示用户先提交、暂存、stash 或丢弃当前变更。

不得自动执行：

```bash
git stash
git add
git commit
git restore
git reset
```

## 来源分支识别

如果用户明确指定来源分支，使用用户指定的分支。

如果用户没有指定来源分支，不得猜测执行 merge。

可以提示用户明确来源分支，例如：

```text
请指定要合并到当前分支的来源分支，例如 dev、develop、release/xxx。
```

## 拉取远端信息

执行合并分析前，必须先获取远端信息：

```bash
git fetch --all --prune
```

如果 fetch 失败，必须终止。

不得因为 fetch 失败而继续使用过期本地分支信息。

## 分支存在性检查

必须检查来源分支是否存在。

优先检查本地分支：

```bash
git show-ref --verify --quiet refs/heads/<source-branch>
```

再检查远端分支：

```bash
git show-ref --verify --quiet refs/remotes/origin/<source-branch>
```

如果本地和远端都不存在，必须终止。

如果只有远端分支存在，默认使用：

```text
origin/<source-branch>
```

不得自动创建本地跟踪分支。

## 合并关系分析

合并前必须分析当前分支与来源分支关系：

```bash
git branch --show-current
git rev-parse --abbrev-ref HEAD
git rev-parse <source-ref>
git merge-base HEAD <source-ref>
git log --oneline --left-right --cherry-pick HEAD...<source-ref>
git diff --stat HEAD...<source-ref>
git diff --name-status HEAD...<source-ref>
```

必须判断：

- 当前分支是否已经包含来源分支
- 来源分支是否包含当前分支
- 是否存在双方独立提交
- 合并会影响哪些文件
- 是否可能产生大量冲突风险

如果当前分支已经包含来源分支，输出“无需合并”，不得执行 merge。

## 合并预检

必须尽量进行非破坏性冲突预检。

优先使用：

```bash
git merge-tree $(git merge-base HEAD <source-ref>) HEAD <source-ref>
```

如果当前 Git 版本不支持 `git merge-tree`，可以跳过该步骤，但必须说明未执行冲突预检。

如果预检结果显示明显冲突，必须在合并计划中标记高风险。

预检发现冲突时，默认不得直接执行 merge，除非用户明确确认继续尝试。

## 合并策略

默认使用 merge commit，不使用 rebase，不使用 squash。

执行 merge 时优先使用：

```bash
git merge --no-ff --no-commit <source-ref>
```

原因：

- 避免隐式 fast-forward
- 保留合并关系
- 合并后先检查结果
- 确认无误后再创建 merge commit

不得默认使用：

```bash
git merge --ff-only
git merge --squash
git rebase
```

除非用户明确要求。

## merge commit 信息

merge commit 信息默认使用中文，并尽量符合 Conventional Commits 风格。

格式：

```text
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留当前分支开发历史
```

示例：

```text
chore(merge): 合并 dev 到 feature-login

- 同步 dev 分支变更
- 保留 feature-login 分支开发历史
```

提交信息必须使用 `git commit -F`：

```bash
cat > /tmp/merge-commit-message.txt <<'EOF'
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
EOF

git commit -F /tmp/merge-commit-message.txt
```

## 合并计划输出

执行 merge 前，必须输出合并计划。

格式：

```text
拟执行以下合并计划：

当前分支：
来源分支：
实际合并引用：
合并方式：
是否需要 merge commit：
影响文件：
- path/to/file

分支关系：
- 当前分支独有提交数：
- 来源分支独有提交数：

风险判断：
- 是否存在冲突风险：
- 是否涉及关键文件：
- 是否建议继续：

执行命令：
git merge --no-ff --no-commit <source-ref>

是否执行？（是/否）
```

如果来源分支已经被当前分支包含，输出：

```text
无需合并

当前分支：
来源分支：
原因：当前分支已包含来源分支的所有提交
工作区状态：
```

## 执行 merge

用户确认后，执行：

```bash
git merge --no-ff --no-commit <source-ref>
```

执行后必须检查：

```bash
git status -sb
git diff --cached --stat
git diff --cached
git diff --stat
```

如果没有冲突，创建 merge commit：

```bash
cat > /tmp/merge-commit-message.txt <<'EOF'
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
EOF

git commit -F /tmp/merge-commit-message.txt
```

提交后必须记录 commit hash：

```bash
git log -1 --oneline
```

## 冲突处理

如果 merge 产生冲突，必须停止，不得自动解决冲突。

必须输出冲突文件：

```bash
git diff --name-only --diff-filter=U
git status -sb
```

默认不得继续 commit。

默认不得自动执行：

```bash
git merge --abort
```

除非用户明确要求放弃本次 merge。

冲突输出格式：

```text
合并产生冲突，已停止自动流程

当前分支：
来源分支：
冲突文件：
- path/to/file

当前状态：
- 仓库处于 merge 冲突状态
- 未创建 merge commit
- 未推送远端

可选处理：
- 手动解决冲突后继续提交
- 或明确要求执行 git merge --abort 放弃本次合并
```

## 放弃 merge

只有用户明确要求放弃本次合并时，才允许执行：

```bash
git merge --abort
```

执行后必须检查：

```bash
git status -sb
```

输出：

```text
已放弃本次合并

当前分支：
来源分支：
工作区状态：
```

## 合并后检查

merge commit 完成后，必须执行：

```bash
git status -sb
git log --oneline -n 5
```

如果合并成功但工作区仍有异常，必须明确说明。

## 推送规则

本 Skill 默认不执行 push。

如果用户明确要求“合并并推送”，必须在 merge 成功后再次确认是否推送。

推送前检查 upstream：

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

如果已有 upstream：

```bash
git push
```

如果没有 upstream：

```bash
git push -u origin HEAD
```

禁止：

```bash
git push --force
git push --force-with-lease
```

## 禁止行为

禁止执行：

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
git branch -D
git rebase
git merge --squash
git push --force
git push --force-with-lease
```

除用户明确要求放弃本次合并外，不得执行：

```bash
git merge --abort
```

不得自动解决冲突。

不得自动修改冲突文件。

不得自动切换分支。

不得自动创建分支。

## 失败输出

如果失败，必须输出：

```text
合并失败

失败步骤：
失败原因：
当前分支：
来源分支：
是否已进入 merge 状态：
冲突文件：
工作区状态：
建议处理：
```

不得隐瞒已经进入 merge 状态的事实。

## 成功输出

成功时输出：

```text
合并完成

当前分支：
来源分支：
合并方式：
merge commit：
是否已推送：
工作区状态：
最近提交：
```

## 标准执行顺序

### 分析阶段

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
git status --porcelain
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git fetch --all --prune
git show-ref --verify --quiet refs/heads/<source-branch>
git show-ref --verify --quiet refs/remotes/origin/<source-branch>
git merge-base HEAD <source-ref>
git log --oneline --left-right --cherry-pick HEAD...<source-ref>
git diff --stat HEAD...<source-ref>
git diff --name-status HEAD...<source-ref>
git merge-tree $(git merge-base HEAD <source-ref>) HEAD <source-ref>
```

然后生成合并计划并等待用户确认。

### 合并阶段

```bash
git merge --no-ff --no-commit <source-ref>
git status -sb
git diff --cached --stat
git diff --cached
git diff --stat
```

如果无冲突：

```bash
cat > /tmp/merge-commit-message.txt <<'EOF'
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
EOF

git commit -F /tmp/merge-commit-message.txt
git log -1 --oneline
git status -sb
```

如果有冲突：

```bash
git diff --name-only --diff-filter=U
git status -sb
```

停止流程，等待用户处理。