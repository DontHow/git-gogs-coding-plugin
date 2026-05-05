---
name: resolve-conflict
description: Use when 用户遇到 Git merge、rebase 或 cherry-pick 冲突，或要求分析、规划、确认后处理冲突文件。
---

# Resolve Conflict

先应用 `/git-gogs-coding-plugin:git-safety`。本 Skill 只负责冲突分析和确认后的低风险处理，不负责发起 merge/rebase/cherry-pick，也不默认继续提交或推送。

## 检查

必须读取：

```bash
git status -sb
git rev-parse -q --verify MERGE_HEAD
git rev-parse -q --verify REBASE_HEAD
git rev-parse -q --verify CHERRY_PICK_HEAD
git diff --name-only --diff-filter=U
git diff --check
```

然后读取每个冲突文件的冲突块。不得在未分析冲突内容时直接要求用户手动处理。

如果没有冲突文件但存在未完成操作，先输出当前状态，并询问用户是继续、放弃还是手动处理。

## 风险分类

- 低风险：格式、注释、导入顺序、明显重复内容、无业务含义的生成顺序。
- 中风险：配置、项目文件、资源引用、锁文件、测试快照。
- 高风险：业务逻辑、接口模型、数据结构、状态流转、权限判断、数据迁移。
- 无法判断：缺少上下文、双方意图不清、需要产品或业务决策。

高风险或无法判断冲突不得自动解决。必须输出冲突块摘要、两边差异、需要用户决策的问题。

风险等级也决定是否允许进入 `--continue`：只有所有冲突已解决、无冲突标记、用户确认 staged 计划后，才允许继续 merge/rebase/cherry-pick。

## 处理计划

对每个冲突文件输出：

```text
冲突文件：
冲突类型：
风险等级：
双方意图：
建议方案：
需要用户决策：
是否允许修改？（是/否）
```

只有低风险，或用户对中风险给出明确选择后，才允许修改文件。

## 执行

用户确认后修改冲突文件。修改后必须检查：

```bash
git diff --check
git diff
git diff --name-only --diff-filter=U
git status -sb
```

确认没有冲突标记后，输出 staged 计划。未经再次确认，不得执行：

```bash
git add <file>
git commit
git merge --continue
git rebase --continue
git cherry-pick --continue
git merge --abort
git rebase --abort
git cherry-pick --abort
```

继续操作规则：

- merge：确认后可以 `git add <file>`，再由用户确认是否创建 merge commit。
- rebase：确认后可以 `git add <file>`，再由用户确认是否 `git rebase --continue`。
- cherry-pick：确认后可以 `git add <file>`，再由用户确认是否 `git cherry-pick --continue`。

## 输出

成功时输出已处理文件、风险等级、是否已 staged、是否已继续 Git 操作、当前状态。

停止时输出剩余冲突、需要用户决策的问题和下一步可选命令。不得声称冲突已解决，除非 `git diff --name-only --diff-filter=U` 没有输出。
