---
name: commit-and-push
description: This skill should be used when the user wants to analyze current Git changes, generate Conventional Commits compliant commit plans, commit after confirmation, and push the current branch to remote in the IMW Git + Gogs workflow.
---

# Commit and Push

本 Skill 用于分析当前 Git 仓库中的未提交变更，按 Conventional Commits v1.0.0 生成提交计划，并在用户明确确认后执行提交和推送。

它只负责：

```text
分析变更 → 生成提交计划 → 用户确认 → git add → git commit → git push
```

它不负责创建分支、合并目标分支、创建 PR。

## 适用场景

当用户表达以下意图时，使用本 Skill：

- 提交并推送
- commit and push
- 帮我提交代码
- 把当前改动推上去
- 分析当前改动并提交
- 生成 commit message 并提交
- 按 Conventional Commits 提交

## 执行原则

必须严格遵循：

```text
Conventional Commits v1.0.0
```

默认使用中文提交说明。

未经用户明确确认，不得执行：

```bash
git add
git commit
git push
```

## 保护分支

禁止在以下分支直接提交或推送：

```text
master
main
dev
develop
release
staging
production
```

如果当前分支是保护分支，必须终止流程，并提示用户先创建开发分支。

不得自动切分支。

## 执行前检查

执行任何写操作前，必须先检查：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
```

如果当前目录不是 Git 仓库，必须终止。

如果当前分支为空，必须终止。

如果当前分支是保护分支，必须终止。

## 读取变更

必须读取暂存、未暂存、未跟踪文件：

```bash
git status -sb
git diff --stat
git diff
git diff --staged --stat
git diff --staged
git ls-files --others --exclude-standard
```

如果存在未跟踪文件，必须将文件名列入提交计划。

对于未跟踪文件，如果需要判断文件内容，必须读取文件内容后再决定是否加入提交。

不得只根据文件名猜测提交意图。

## 提交格式

提交信息必须符合以下格式：

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

## type 规则

`type` 必须为以下之一：

```text
feat
fix
docs
style
refactor
perf
test
build
ci
chore
revert
```

含义：

```text
feat: 新功能
fix: 修复问题
docs: 文档变更
style: 代码格式、空白、标点等不影响逻辑的变更
refactor: 不改变外部行为的代码重构
perf: 性能优化
test: 测试相关变更
build: 构建系统或依赖变更
ci: CI 配置或脚本变更
chore: 其他杂项维护
revert: 回滚提交
```

## scope 规则

`scope` 可选但推荐。

`scope` 只允许：

```text
小写字母
数字
短横线
```

示例：

```text
feat(login): 优化登录协议勾选逻辑
fix(patient-list): 修复筛选条件丢失问题
chore(pr-workflow): 调整 PR 创建流程
```

不允许：

```text
feat(Login): xxx
feat(login page): xxx
feat(login_page): xxx
```

## description 规则

`description` 必填，必须满足：

- 使用中文
- 祈使句风格
- 简洁明确
- 末尾不加句号
- 最长 50 个中文字符
- 不使用“本次提交”“修改了”等空泛表达

推荐：

```text
fix(login): 修复协议勾选状态丢失问题
```

不推荐：

```text
fix(login): 本次提交修改了一些登录问题。
```

## body 规则

如果一次提交包含多个文件，`body` 不能为空。

`body` 必须使用中文无序列表，说明变更动机或范围。

示例：

```text
- 调整登录协议勾选状态保存逻辑
- 补充异常状态下的按钮刷新处理
```

如果一次提交只包含单个文件，`body` 可选。

## footer 规则

如果存在破坏性变更，必须使用以下任一方式标记：

```text
feat(api)!: 调整患者列表接口入参
```

或：

```text
BREAKING CHANGE: 患者列表接口入参已调整
```

破坏性变更说明必须使用中文。

## 拆分提交规则

必须按“单一意图”拆分提交。

如果变更混合以下情况，不得合并成单条提交：

- `feat` + `fix`
- `feat` + `refactor`
- `fix` + `style`
- 逻辑变更 + 格式化变更
- 不相关模块变更
- 业务代码变更 + 构建配置变更
- 代码变更 + 文档变更
- 多个互不相关的问题修复

## 同文件多意图处理

如果多个意图出现在不同文件中，可以按文件路径拆分提交。

如果多个意图出现在同一个文件中，不能直接执行：

```bash
git add <file>
```

必须优先使用：

```bash
git add -p <file>
```

如果无法安全拆分 hunk，必须停止并提示用户手动整理，不得强行提交。

## 提交计划输出

执行提交前，必须先输出提交计划。

### 单一意图

输出格式：

```text
拟执行以下提交计划：

1. 类型：
   范围：
   文件：
   提交信息：

是否执行？（是/否）
```

### 多意图

输出格式：

```text
检测到多意图变更，建议拆分为以下提交：

1. 类型：
   范围：
   文件：
   提交信息：

2. 类型：
   范围：
   文件：
   提交信息：

是否按以上计划依次执行？（是/否）
```

如果存在需要 `git add -p` 的同文件多意图变更，必须明确标出：

```text
注意：以下文件包含多意图变更，需要使用 git add -p 交互式拆分：

- path/to/file
```

## 用户确认

未经用户明确确认，不得执行：

```bash
git add
git add -p
git commit
git push
```

用户确认可以是：

```text
是
确认
执行
按计划执行
可以
```

如果用户拒绝或要求调整，必须根据用户反馈重新生成提交计划，再次确认。

## 执行提交

### 普通文件级提交

按计划精确添加文件：

```bash
git add <file1> <file2>
```

禁止无脑执行：

```bash
git add .
```

禁止无脑执行：

```bash
git add -A
```

只有用户明确要求“提交全部变更”时，才允许使用：

```bash
git add -A
```

### 同文件 hunk 级提交

如果同一个文件包含多个意图，使用：

```bash
git add -p <file>
```

执行后必须检查暂存内容：

```bash
git diff --staged --stat
git diff --staged
```

确认暂存内容只包含当前提交意图后，才能提交。

## commit 执行方式

如果提交信息只有标题：

```bash
git commit -m "<type>(<scope>): <description>"
```

如果提交信息包含 body：

```bash
git commit -m "<type>(<scope>): <description>" -m "<body>"
```

如果提交信息包含 footer：

```bash
git commit -m "<type>(<scope>): <description>" -m "<body>" -m "<footer>"
```

提交后必须记录 commit hash：

```bash
git log -1 --oneline
```

## 多提交执行

如果提交计划包含多条提交，必须按顺序执行。

每次提交后都要检查：

```bash
git status -sb
```

确保不会把下一条提交的文件误放入当前提交。

如果中途失败，必须停止，不得继续执行后续提交。

## 推送规则

所有提交完成后，必须推送当前分支：

```bash
git push -u origin HEAD
```

如果当前分支没有远端，使用：

```bash
git push -u origin HEAD
```

如果 push 失败，必须停止并输出失败原因。

不得执行：

```bash
git push --force
git push --force-with-lease
```

## 提交后检查

提交和推送完成后，必须执行：

```bash
git status -sb
git log --oneline -n 5
```

输出最终状态。

## 禁止行为

本 Skill 禁止执行：

```bash
git reset --hard
git clean -fd
git checkout .
git restore .
git branch -D
git rebase
git merge
git push --force
git push --force-with-lease
```

本 Skill 不负责修复冲突，不负责合并目标分支，不负责创建 PR。

## 失败处理

如果失败，必须输出：

```text
提交并推送失败

失败步骤：
失败原因：
当前分支：
已完成提交：
未完成提交：
工作区状态：
建议处理：
```

不得隐瞒部分提交成功的情况。

## 成功输出

成功时输出：

```text
提交并推送完成

当前分支：
提交数量：
提交记录：
是否已推送：
远端分支：
工作区状态：
```

## 标准流程

推荐执行顺序：

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
git diff --stat
git diff
git diff --staged --stat
git diff --staged
git ls-files --others --exclude-standard
```

然后生成提交计划并等待用户确认。

用户确认后，按计划执行：

```bash
git add <files>
git diff --staged --stat
git diff --staged
git commit -m "<title>" -m "<body>"
git status -sb
```

所有提交完成后执行：

```bash
git push -u origin HEAD
git status -sb
git log --oneline -n 5
```

## 示例

### 单一意图

变更：

```text
M LoginViewController.swift
M UserAgreementView.swift
```

提交计划：

```text
拟执行以下提交计划：

1. 类型：feat
   范围：login
   文件：
   - LoginViewController.swift
   - UserAgreementView.swift
   提交信息：
   feat(login): 优化登录协议勾选逻辑

   - 调整登录页协议勾选状态处理
   - 拆分协议视图相关逻辑

是否执行？（是/否）
```

执行：

```bash
git add LoginViewController.swift UserAgreementView.swift
git commit -m "feat(login): 优化登录协议勾选逻辑" -m "- 调整登录页协议勾选状态处理
- 拆分协议视图相关逻辑"
git push -u origin HEAD
```

### 多意图

变更：

```text
M LoginViewController.swift
M NetworkClient.swift
M README.md
```

提交计划：

```text
检测到多意图变更，建议拆分为以下提交：

1. 类型：feat
   范围：login
   文件：
   - LoginViewController.swift
   提交信息：
   feat(login): 优化登录协议勾选逻辑

2. 类型：fix
   范围：network
   文件：
   - NetworkClient.swift
   提交信息：
   fix(network): 修复请求超时重试判断问题

3. 类型：docs
   范围：readme
   文件：
   - README.md
   提交信息：
   docs(readme): 更新本地开发说明

是否按以上计划依次执行？（是/否）
```