---
name: merge
description: 检查指定 Git 分支是否可以合并到当前分支，或在用户确认后将指定来源分支安全合并到当前工作分支。
---

# Merge

用于检查并执行“将指定来源分支合并到当前分支”的 Git 工作流。

核心流程：

```text
识别意图 → 识别来源分支 → 合并可行性检查 → 输出检查结果或合并计划 → 用户确认 → 执行 merge → 检查结果 → 如有冲突则进入冲突分析流程
```

## 职责边界

本 Skill 负责：

- 检查指定来源分支是否可以合并到当前分支
- 分析来源分支与当前分支差异
- 识别明显冲突风险
- 生成合并计划
- 用户确认后执行 merge
- merge 冲突后分析冲突并给出处理建议
- 用户确认后尝试解决低风险冲突

本 Skill 不负责：

- 创建分支
- 删除分支
- rebase
- squash
- cherry-pick
- 创建 Pull Request
- 提交普通业务代码
- 默认推送远端分支
- 未经确认自动解决冲突
- 未经确认自动放弃 merge

## 核心原则

- 默认语义是“将来源分支合并到当前分支”
- 检查类需求必须响应，但只能执行只读检查
- 任何 merge 执行前，都必须先完成合并可行性检查
- 合并可行性检查不通过，不得执行 merge
- 执行 merge 前，工作区必须干净
- 未经用户明确确认，不得执行写操作
- 不得在保护分支上执行 merge
- 不得自动切换分支
- 不得自动创建分支
- 不得自动解决冲突
- 不得执行破坏性 Git 命令
- merge 产生冲突后，必须停止自动 commit 和 push，但可以继续分析冲突
- 合并后默认不得 push，除非用户明确要求

未经用户明确确认，不得执行：

```bash
git merge
git add
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

## 用户意图规则

当用户表达以下意图时，只执行合并可行性检查，不得执行 merge：

```text
检查一下
帮我看看
能不能合并
看下有没有冲突
预检查合并
merge check
can merge
dry run merge
```

当用户明确表达以下意图时，才进入合并执行流程：

```text
合并 xxx
merge xxx
把 xxx 合进来
把 xxx 合到当前分支
从 xxx 同步最新代码
同步 xxx 到当前分支
执行合并
按计划合并
```

即使用户明确要求执行 merge，也必须先完成合并可行性检查，输出合并计划，并等待用户确认。

## 默认语义与模糊语义

当用户说：

```text
合并 dev
merge dev
把 dev 合进来
把 dev 合到当前分支
从 dev 同步最新代码
同步 dev 到当前分支
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

当用户说：

```text
更新当前分支到 dev
把当前分支更新到 dev
同步当前分支到 dev
让当前分支和 dev 一样
```

不得直接执行 merge。

这类表达可能表示：

- 将 dev 合并到当前分支
- 将当前分支合并到 dev
- 将当前分支重置为 dev 状态
- 切换到 dev 分支

必须先输出理解和计划，并等待用户确认。

默认优先按安全语义理解为：

```text
将 dev 合并到当前分支
```

但必须明确提示：

```text
我理解为：把 dev 的变更合并到当前分支，而不是切换到 dev，也不是把当前分支重置为 dev。
```

## 保护分支

如果当前分支是以下分支，必须终止 merge 执行流程：

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

如果用户确实要将功能分支合并到保护分支，应提示用户走 PR 流程。

注意：来源分支可以是保护分支。例如，在功能分支上执行“把 dev 合进来”是允许的。

## 来源分支识别

如果用户明确指定来源分支，使用用户指定的分支。

如果用户没有指定来源分支，不得猜测执行 merge，必须提示用户明确来源分支，例如：

```text
请指定要合并到当前分支的来源分支，例如 dev、develop、release/xxx。
```

执行合并分析前，必须先获取远端信息：

```bash
git fetch --all --prune
```

如果 fetch 失败，必须终止。

必须检查来源分支是否存在：

```bash
git show-ref --verify --quiet refs/heads/<source-branch>
git show-ref --verify --quiet refs/remotes/origin/<source-branch>
```

如果本地分支存在，使用：

```text
<source-branch>
```

如果只有远端分支存在，使用：

```text
origin/<source-branch>
```

不得自动创建本地跟踪分支。

如果本地和远端都不存在，必须终止。

## 合并可行性检查

任何 merge 执行前，都必须先进行合并可行性检查。

如果用户只要求检查，也必须执行本流程，但不得执行写操作。

必须执行：

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
git merge-base --is-ancestor <source-ref> HEAD
git merge-base --is-ancestor HEAD <source-ref>
git log --oneline --left-right --cherry-pick HEAD...<source-ref>
git diff --stat HEAD...<source-ref>
git diff --name-status HEAD...<source-ref>
```

尽量执行冲突预检：

```bash
git merge-tree $(git merge-base HEAD <source-ref>) HEAD <source-ref>
```

如果当前 Git 版本不支持 `git merge-tree`，可以跳过，但必须说明：

```text
未执行 merge-tree 冲突预检：当前 Git 版本不支持
```

检查目标：

- 当前目录是否是 Git 仓库
- 当前分支是否有效
- 当前分支是否为保护分支
- 工作区是否干净
- 是否存在未完成的 merge/rebase/cherry-pick
- remote 是否存在
- 来源分支是否存在
- 当前分支是否已包含来源分支
- 当前分支是否落后于来源分支
- 双方是否存在独立提交
- 合并影响哪些文件
- 是否存在明显冲突风险

## 工作区不干净处理

执行 merge 前，工作区必须干净。

如果：

```bash
git status --porcelain
```

存在任何输出，说明工作区存在未提交变更，必须暂停 merge 流程，不得继续执行合并。

此时不得自动执行：

```bash
git stash
git add
git commit
git push
git restore
git reset
```

必须输出：

```text
暂不能合并

原因：当前工作区存在未提交变更，执行 merge 前必须先处理这些变更。

当前分支：
来源分支：
未提交变更：
- path/to/file

建议：
- 先执行 commit-and-push，提交并推送当前变更
- 或手动清理、stash、提交后重新执行 merge

是否先执行 commit-and-push？（是/否）
```

如果用户确认执行 `commit-and-push`，必须切换到 `commit-and-push` Skill 流程。

`commit-and-push` 完成后，必须重新执行完整的合并可行性检查。

不得复用之前的检查结果。

如果 `commit-and-push` 失败，必须停止 merge 流程，不得继续合并。

如果用户拒绝执行 `commit-and-push`，必须停止 merge 流程，并提示用户先手动处理工作区变更。

## 检查结果输出

如果当前分支已包含来源分支，输出：

```text
无需合并

当前分支：
来源分支：
原因：当前分支已包含来源分支的所有提交
工作区状态：
```

如果工作区不干净，输出“暂不能合并”，并询问是否先执行 `commit-and-push`。

如果存在未完成 merge/rebase/cherry-pick，输出：

```text
暂不能合并

原因：仓库存在未完成操作
当前分支：
来源分支：
当前状态：
建议：
- 先完成或放弃当前 Git 操作后重新检查
```

如果来源分支不存在，输出：

```text
暂不能合并

原因：来源分支不存在
当前分支：
来源分支：
建议：
- 检查分支名是否正确
- 确认远端是否已推送该分支
```

如果发现明显冲突风险，输出：

```text
可以尝试合并，但存在冲突风险

当前分支：
来源分支：
实际合并引用：
冲突风险：
- 说明可能冲突的文件或原因

影响文件：
- path/to/file

建议：
- 可以继续执行 merge，但需要准备处理冲突
- 执行前必须再次确认
```

如果检查通过，输出：

```text
可以合并

当前分支：
来源分支：
实际合并引用：
分支关系：
- 当前分支独有提交数：
- 来源分支独有提交数：

影响文件：
- path/to/file

冲突预检：
- 未发现明显冲突

建议：
- 可以执行 merge
```

## 合并计划输出

执行 merge 前，必须输出合并计划。

格式：

```text
拟执行以下合并计划：

当前分支：
来源分支：
实际合并引用：
合并方式：merge commit
执行策略：git merge --no-ff --no-commit

合并可行性：
- 工作区是否干净：
- 是否存在未完成 Git 操作：
- 来源分支是否存在：
- 当前分支是否已包含来源分支：
- 冲突预检结果：

分支关系：
- 当前分支独有提交数：
- 来源分支独有提交数：

影响文件：
- path/to/file

风险判断：
- 是否存在冲突风险：
- 是否建议继续：

执行命令：
git merge --no-ff --no-commit <source-ref>

是否执行？（是/否）
```

如果检查结果不是“可以合并”，不得执行 merge。

如果检查结果是“可以尝试合并，但存在冲突风险”，必须明确提示风险，并等待用户再次确认。

## 执行 merge

默认使用 merge commit，不使用 rebase，不使用 squash。

用户确认后，执行：

```bash
git merge --no-ff --no-commit <source-ref>
```

不得默认使用：

```bash
git merge --ff-only
git merge --squash
git rebase
```

执行后必须检查：

```bash
git status -sb
git diff --cached --stat
git diff --cached
git diff --stat
```

如果没有冲突，创建 merge commit。

merge commit 信息默认使用中文，并尽量符合 Conventional Commits 风格：

```text
chore(merge): 合并 <source-branch> 到 <current-branch>

- 同步 <source-branch> 分支变更
- 保留 <current-branch> 分支开发历史
```

提交信息必须使用 `git commit -F`：

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

## 冲突处理

如果 merge 产生冲突，必须停止自动 commit 和 push，但不得停止分析。

必须先执行：

```bash
git diff --name-only --diff-filter=U
git status -sb
```

然后读取冲突文件内容，分析每个冲突块。

不得在未分析冲突内容的情况下直接要求用户手动处理。

冲突分类：

```text
低风险：格式、注释、导入顺序、明显重复内容
中风险：配置文件、依赖锁文件、项目文件、资源引用
高风险：业务逻辑、接口模型、数据结构、状态流转、权限判断
无法判断：缺少上下文或需要业务决策
```

未经用户确认，不得执行：

```bash
git add
git commit
git merge --continue
git push
git merge --abort
```

未经用户确认，不得修改冲突文件。

只有满足以下条件时，才允许提出自动解决方案：

- 冲突块较小
- 双方意图清晰
- 不涉及业务取舍
- 不会丢弃任一侧关键逻辑
- 可以保留双方变更
- 修改后可以通过 diff 清楚验证

以下情况不得自动修改冲突文件：

- 涉及业务逻辑取舍
- 涉及接口字段、枚举、模型结构
- 涉及权限、登录、支付、医疗业务流程
- 涉及 `.pbxproj` 且冲突复杂
- 涉及锁文件且无法判断依赖来源
- 同一代码块双方都做了逻辑修改
- Agent 无法明确判断应该保留哪一侧
- 需要产品、业务或测试判断

产生冲突后，必须输出：

```text
合并产生冲突，已停止自动提交流程

当前分支：
来源分支：
冲突文件：
- path/to/file

冲突分析：
1. 文件：
   类型：低风险 / 中风险 / 高风险 / 无法判断
   当前分支变更：
   来源分支变更：
   推荐处理：
   是否建议 Agent 自动解决：

当前状态：
- 仓库处于 merge 冲突状态
- 未创建 merge commit
- 未推送远端

可选操作：
- 确认后由 Agent 尝试解决低风险冲突
- 手动解决冲突后让 Agent 继续检查并提交
- 明确要求执行 git merge --abort 放弃本次合并
```

## 冲突解决后继续

如果用户明确确认由 Agent 解决冲突，Agent 只能修改已确认的冲突文件。

修改后必须执行：

```bash
git diff
git diff --check
git status -sb
```

如果冲突已解决，必须执行：

```bash
git add <resolved-files>
git diff --cached --stat
git diff --cached
```

确认暂存内容只包含冲突解决结果后，才能询问用户是否创建 merge commit。

未经用户再次确认，不得执行：

```bash
git commit
```

如果用户表示已经手动解决冲突，必须重新检查：

```bash
git status -sb
git diff --check
git diff --cached --stat
git diff --cached
```

如果仍有未解决冲突，继续输出冲突文件。

如果冲突已解决，输出 merge commit 计划，并等待用户确认。

## 放弃 merge

只有用户明确要求放弃本次合并时，才允许执行：

```bash
git merge --abort
git status -sb
```

输出：

```text
已放弃本次合并

当前分支：
来源分支：
工作区状态：
```

## 推送规则

本 Skill 默认不执行 push。

如果用户明确要求“合并并推送”，必须在 merge 成功后再次确认是否推送。

确认后检查 upstream：

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

不得未经确认自动修改冲突文件。

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

如果已有部分操作成功，必须明确说明。

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

merge commit 完成后，必须执行：

```bash
git status -sb
git log --oneline -n 5
```

## 标准执行顺序

1. 识别用户意图和来源分支
2. 执行合并可行性检查
3. 如果只是检查，输出检查结果后结束
4. 如果工作区不干净，询问是否执行 `commit-and-push`
5. 如果要执行 merge，输出合并计划并等待确认
6. 用户确认后执行 `git merge --no-ff --no-commit <source-ref>`
7. 无冲突则创建 merge commit
8. 有冲突则进入冲突分析流程
9. 冲突解决后再次确认是否创建 merge commit
10. 完成后输出成功或失败结果