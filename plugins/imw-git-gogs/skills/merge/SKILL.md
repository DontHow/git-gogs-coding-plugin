---
name: merge
description: Use when 用户要求检查某个 Git 来源分支能否合并到当前分支，或确认后把来源分支 merge 到当前分支。
---

# Merge

先应用 `/imw-git-gogs:git-safety`。本 Skill 只负责“来源分支合并到当前分支”，不负责口语化同步歧义、rebase、创建 PR、推送或冲突自动解决。

## 语义

默认语义：

```text
merge <source>
= 将 <source> 合并到当前分支
```

如果用户说“更新到 dev”“同步到 dev”“让当前分支和 dev 一样”，改用 `sync-branch` 先消除歧义，不得直接 merge。

如果未指定来源分支，必须要求用户补充来源分支。

## 检查

检查类请求只输出结果，不执行 merge。

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
git show-ref --verify --quiet refs/heads/<source-branch>
git show-ref --verify --quiet refs/remotes/<remote>/<source-branch>
git merge-base HEAD <source-ref>
git merge-base --is-ancestor <source-ref> HEAD
git merge-base --is-ancestor HEAD <source-ref>
git log --oneline --left-right --cherry-pick HEAD...<source-ref>
git diff --stat HEAD...<source-ref>
git diff --name-status HEAD...<source-ref>
```

远端来源分支必须基于 `git remote -v` 列出的 remote 名称逐个精确检查，不得硬编码 `origin`，也不得用正则假设 remote 名不含斜杠。

需要刷新远端引用时，先单独确认 `git fetch --all --prune`，执行后重新检查。

尽量执行冲突预检：

```bash
git merge-tree --write-tree HEAD <source-ref>
```

如果当前 Git 不支持 `--write-tree`，降级为旧式三参数预检：

```bash
git merge-tree $(git merge-base HEAD <source-ref>) HEAD <source-ref>
```

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空或是保护分支
- 工作区不干净
- 存在未完成 merge/rebase/cherry-pick
- 来源分支不存在
- 当前分支已经包含来源分支全部提交

## 合并计划

执行前必须输出：

```text
拟执行 merge

当前分支：
来源分支：
实际合并引用：
分支关系：
- 当前分支独有提交：
- 来源分支独有提交：
影响文件：
- path/to/file
冲突预检：
执行命令：
git merge --no-ff --no-commit <source-ref>
git commit -F /tmp/merge-commit-message.txt

merge commit 信息：
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史

说明：
- 无冲突时按计划创建上述 merge commit
- 有冲突立即停止，不得自动 commit

是否执行？（是/否）
```

如果存在明显冲突风险，必须在计划中列出风险文件和原因，并等待用户再次确认。

## 执行

用户确认后执行：

```bash
git merge --no-ff --no-commit <source-ref>
git status -sb
git diff --cached --stat
git diff --cached
git diff --stat
```

如果没有冲突，使用计划中已确认的提交信息创建 merge commit：

```text
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
```

```bash
cat > /tmp/merge-commit-message.txt <<'EOF'
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
EOF
git commit -F /tmp/merge-commit-message.txt
```

如果出现冲突，停止 commit 和 push，输出冲突文件列表，并切换到 `resolve-conflict` 流程。不得在本 Skill 内自动修改冲突文件。

## 输出

成功时输出当前分支、来源分支、merge commit、影响文件和工作区状态。

失败或冲突时输出失败步骤、原因、当前 Git 状态、冲突文件和建议的下一步。
