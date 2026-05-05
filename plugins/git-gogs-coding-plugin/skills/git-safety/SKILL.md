---
name: git-safety
description: Use when 用户执行任何 Git Skill 或直接 Git 操作，尤其涉及检查、提交、分支、同步、发布、合并、PR、冲突或回滚。
---

# Git Safety

公共底线，不是工作流。任何 Git Skill 都必须先遵守本规则；工作流内容只能收紧，不能放宽。

- 禁止破坏性命令：不得执行 `git reset --hard`、`git clean -fd`、`git checkout .`、`git restore .`、`git branch -D` 或等价丢弃变更/历史的命令。
- 写操作必须确认：修改工作区、索引、本地历史、远端引用或代码平台状态前，必须先输出计划并获得用户明确确认。
- 保护分支禁止直接写：`master`、`main`、`dev`、`develop`、`release`、`staging`、`production` 不得直接 commit、merge、rebase 或 push。
- 修改远端引用、`merge`、`rebase`、`cherry-pick`、`create-pr` 前，工作区必须干净；其余写操作由对应 Skill 继续收紧。
- 禁止 `git push --force` 和 `git push --force-with-lease`。
- 不得自动切到已存在分支；`create-branch` 中已确认的 `git switch -c` 允许创建并切到新分支。
- `git stash push` 只有在用户明确选择 stash 并确认后才允许；不得自动 `stash pop`。
- 任何 `git fetch` 或远端刷新都需要单独确认。
- 不得自动解决高风险冲突；涉及业务逻辑、数据结构、接口、权限、配置/锁文件取舍或无法判断时，必须停止并让用户决策。
- 标准状态检查：写操作前至少读取 `git rev-parse --show-toplevel`、`git branch --show-current`、`git status -sb`、`git status --porcelain`，并检查 `MERGE_HEAD`、`REBASE_HEAD`、`CHERRY_PICK_HEAD`。
- 提交和 PR 标题 type 统一使用：`feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert`。
