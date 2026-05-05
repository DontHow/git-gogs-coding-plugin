---
name: rollback-safe
description: Use when 用户要求撤销、回滚、还原、取消提交、取消暂存、放弃未完成 merge/rebase/cherry-pick，或处理误提交风险。
---

# Rollback Safe

先应用 `/git-gogs-coding-plugin:git-safety`。本 Skill 只使用可审计、可解释的回滚方式；默认不丢弃工作区变更，不重写远端历史。

## 意图识别

必须先明确用户想撤销什么：

- 取消暂存：只改 index，不改工作区内容。
- 回滚已提交内容：优先使用 `git revert` 产生反向提交。
- 放弃未完成操作：处理 merge/rebase/cherry-pick 的 abort。
- 撤销未提交工作区修改：高风险，默认只输出风险和手动建议，不自动执行。

如果用户只说“回滚一下”“撤销刚才的操作”，必须先检查状态并要求确认目标，不得猜测。

## 检查

必须读取：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git status --porcelain
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git log --oneline --decorate -n 30
git diff --staged --stat
git diff --staged --name-status
git diff --staged
git diff --stat
git diff --name-status
```

必须停止：

- 当前目录不是 Git 仓库
- 当前分支为空
- 用户要求在保护分支直接写入回滚提交
- 用户要求 force push、hard reset、clean 或直接丢弃全部工作区修改
- 用户要求 `git revert`，但工作区不干净（有未提交或未暂存变更）

## 计划

执行任何写操作前必须输出：

```text
拟执行安全回滚

当前分支：
回滚目标：
回滚方式：
影响范围：
将执行的命令：
不会执行的危险命令：
风险：

是否执行？（是/否）
```

## 允许方式

取消暂存：

```bash
git restore --staged <file>
```

回滚已提交内容前必须确认工作区干净（`git status --porcelain` 输出为空）。如果工作区不干净，先用 `commit-and-push` 提交需要保留的变更，或在用户确认后 `git stash push -u` 暂存，再执行 revert：

```bash
git revert <commit>
git revert <oldest>^..<newest>
```

放弃未完成操作时必须说明会丢弃已做的冲突解决编辑，用户确认后才允许：

```bash
git merge --abort
git rebase --abort
git cherry-pick --abort
```

执行后必须重新检查：

```bash
git status -sb
git log --oneline -n 5
```

## 禁止方式

不得执行：

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
git branch -D
git push --force
git push --force-with-lease
```

如果用户明确要求这些命令，必须先解释风险并停止，让用户自行决定是否手动执行。

## 输出

成功时输出回滚方式、涉及提交或文件、生成的新 revert 提交、当前工作区状态。

失败时输出失败步骤、失败原因、已执行命令和建议处理方式。不得隐瞒部分完成的 revert 或 abort。
