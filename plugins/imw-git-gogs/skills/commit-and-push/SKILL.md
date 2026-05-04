---
name: commit-and-push
description: 当用户要求分析当前 Git 变更、生成 Conventional Commits 提交计划、确认后提交并推送当前分支时使用。
---

# Commit and Push

用于分析当前 Git 工作区变更，生成符合 Conventional Commits v1.0.0 的提交计划，并在用户确认后提交和推送当前分支。

核心流程：

```text
分析变更 → 识别提交意图 → 生成提交计划 → 用户确认 → 精确暂存 → 校验暂存内容 → git commit → git push
```

本 Skill 只负责：

- 分析当前 Git 工作区变更
- 判断是否需要拆分提交
- 生成符合 Conventional Commits v1.0.0 的提交计划
- 用户确认后执行提交
- 所有提交完成后推送当前分支

本 Skill 不负责：

- 创建分支
- 合并目标分支
- rebase
- 解决冲突
- 创建 Pull Request
- 修改远端保护分支策略

## 核心原则

- 默认使用中文提交说明
- 必须按单一意图拆分提交
- 未经用户明确确认，不得执行写操作
- 不得在保护分支提交或推送
- 不得使用破坏性 Git 命令
- 不得只根据文件名猜测提交意图
- 不得为了完成任务跳过 diff 分析
- 同文件多意图变更必须尝试自动拆分，但不能强行拆分

未经用户明确确认，不得执行：

```bash
git add
git apply --cached
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
同意
```

如果用户只要求“检查一下”“帮我看看”，不得执行提交。

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

不得自动切换分支。

不得自动创建分支。

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

## 读取变更

必须读取暂存、未暂存、未跟踪文件：

```bash
git status -sb
git diff --stat
git diff --name-status
git diff
git diff --staged --stat
git diff --staged --name-status
git diff --staged
git ls-files --others --exclude-standard
```

如果 diff 内容过大，必须先用以下命令识别变更范围：

```bash
git diff --stat
git diff --name-status
git diff --staged --stat
git diff --staged --name-status
git ls-files --others --exclude-standard
```

然后按文件、目录或模块分组读取关键 diff。

不得因为 diff 过大而跳过分析。

未跟踪文件必须列入变更清单，但是否纳入提交，必须基于文件内容和本次提交意图判断。

不得仅因为文件存在就加入提交计划。

## 提交格式

提交信息必须符合：

```text
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

允许的 type：

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

scope 可选但推荐。

scope 只允许：

```text
小写字母
数字
短横线
```

推荐：

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

description 必须满足：

- 使用中文
- 简洁明确
- 祈使句风格
- 末尾不加句号
- 最长 50 个中文字符
- 不使用“本次提交”“修改了”“调整了一些”等空泛表达

body 可选，但以下情况必须填写：

- 一次提交包含多个关键文件
- 一次提交涉及多个相关步骤
- 标题无法完整表达变更动机或范围
- 存在需要解释的兼容性、迁移、风险或限制
- 存在破坏性变更
- 提交内容包含自动拆分出来的同文件部分变更

body 必须使用中文无序列表。

示例：

```text
- 调整登录协议勾选状态保存逻辑
- 补充异常状态下的按钮刷新处理
```

如果存在破坏性变更，必须使用以下任一方式标记：

```text
feat(api)!: 调整患者列表接口入参
```

或：

```text
BREAKING CHANGE: 患者列表接口入参已调整
```

## 拆分提交规则

必须按单一意图拆分提交。

以下情况不得合并成一条提交：

- `feat` + `fix`
- `feat` + `refactor`
- `fix` + `style`
- 逻辑变更 + 格式化变更
- 业务代码 + 构建配置
- 代码变更 + 文档变更
- 不相关模块变更
- 多个互不相关的问题修复
- 自动生成文件 + 手写业务代码
- 测试代码 + 不相关业务代码

如果多个文件属于同一个明确意图，可以合并为一条提交。

如果多个文件属于不同意图，必须拆分提交。

## 同文件多意图自动拆分

如果多个意图出现在同一个文件中，必须尝试自动分析并拆分。

目标是将不同意图拆分到不同 commit 中，而不是因为文件相同就强行合并。

示例：

```text
M LoginViewController.swift
```

其中同时包含：

```text
- 修复登录按钮状态刷新
- 拆分协议视图处理逻辑
- 调整代码格式
```

应优先拆成：

```text
style(login): 调整登录页代码格式
refactor(login): 拆分协议视图处理逻辑
fix(login): 修复登录按钮状态刷新问题
```

### 自动拆分原则

必须基于 `git diff` 内容判断每一处变更属于哪个提交意图。

不得只按文件名判断。

允许自动拆分：

- 不同函数的变更
- 不同类型的变更
- 不同代码块的变更
- 同一函数内但逻辑独立的变更
- 可以安全生成 patch 的局部变更

必须停止，不得强行拆分：

- 同一行同时包含多个意图
- 强耦合上下文中的混合变更
- 拆分后代码可能无法编译
- 无法明确判断变更归属
- 需要用户业务判断
- 文件包含复杂重命名、移动或二进制变化

### 禁止默认使用交互式命令

不得默认执行：

```bash
git add -p <file>
```

只有用户明确要求使用交互式拆分时，才允许执行 `git add -p`。

### patch 暂存方式

对于可以安全拆分的同文件多意图变更，优先使用 patch 暂存方式。

先保存完整 diff 作为参考：

```bash
git diff -- <file> > /tmp/full.diff
```

然后基于完整 diff 生成当前提交意图对应的临时 patch：

```bash
cat > /tmp/commit-part.patch <<'EOF'
<当前提交意图对应的 patch 内容>
EOF
```

应用前必须检查 patch 是否可应用到暂存区：

```bash
git apply --cached --check /tmp/commit-part.patch
```

检查通过后，再将 patch 只应用到暂存区：

```bash
git apply --cached /tmp/commit-part.patch
```

暂存后必须检查：

```bash
git diff --staged --stat
git diff --staged
```

确认 staged 内容只包含当前提交意图后，才能执行 commit。

提交后继续处理同一文件中的其他意图变更。

### patch 生成要求

生成 patch 时必须满足：

- patch 必须来自真实 diff
- patch 不得凭空编造代码
- patch 不得包含当前提交意图之外的变更
- patch 必须保留必要上下文
- patch 必须能通过 `git apply --cached --check`
- patch 应尽量缩小到当前提交需要的 hunk
- patch 不得改变工作区内容，只能改变 index

如果 patch 无法稳定生成，必须停止。

### 同文件多意图提交顺序

如果同一个文件被拆分到多个提交中，必须优先提交基础性变更，再提交依赖性变更。

推荐顺序：

```text
style
refactor
fix
feat
test
docs
chore
build
ci
```

如果后一个提交依赖前一个提交的代码结构调整，必须先提交结构调整。

如果某个提交单独应用后明显无法编译，必须在提交计划中说明原因，并调整拆分方案。

### 自动拆分失败输出

如果同文件多意图变更无法安全自动拆分，必须停止并输出：

```text
同文件多意图变更无法安全自动拆分

文件：
- path/to/file

原因：
- 说明无法拆分的具体原因

已识别意图：
- 意图一
- 意图二

建议：
- 请手动整理该文件后重新执行
- 或明确授权使用 git add -p 交互式拆分
```

## 提交计划输出

执行提交前，必须先输出提交计划。

### 单一意图

```text
拟执行以下提交计划：

1. 类型：
   范围：
   文件：
   提交信息：

是否执行？（是/否）
```

### 多意图

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

### 同文件多意图

```text
检测到同文件多意图变更，将尝试使用 patch 暂存方式自动拆分：

- 文件：
- 识别出的意图：
- 拆分方式：
  - 基于 git diff 生成局部 patch
  - 使用 git apply --cached 暂存当前提交意图
  - 每次提交前校验 staged diff

是否按以上计划执行？（是/否）
```

如果用户拒绝、要求调整、要求合并或要求拆分，必须重新生成提交计划，再次确认。

## 执行规则

### 普通文件级提交

按计划精确添加文件：

```bash
git add <file1> <file2>
```

禁止无脑执行：

```bash
git add .
git add -A
```

只有用户明确要求“提交全部变更”时，才允许使用：

```bash
git add -A
```

即使用户要求“提交全部变更”，也必须先完成提交计划分析。

暂存后必须检查：

```bash
git diff --staged --stat
git diff --staged
```

确认 staged 内容只包含当前提交意图后，才能提交。

### patch 级提交

如果同一个文件包含多个意图，并且可以安全拆分，使用：

```bash
git apply --cached --check /tmp/commit-part.patch
git apply --cached /tmp/commit-part.patch
git diff --staged --stat
git diff --staged
```

确认 staged 内容只包含当前提交意图后，才能提交。

### 未跟踪文件提交

未跟踪文件不能通过 patch 暂存拆分。

如果未跟踪文件属于当前提交意图，可以使用：

```bash
git add <file>
```

如果未跟踪文件内容复杂或包含多个意图，必须停止并提示用户手动拆分文件。

### 暂存区污染处理

每次提交前，必须检查暂存区：

```bash
git diff --staged --stat
git diff --staged
```

如果暂存区包含当前提交意图之外的内容，必须停止。

不得使用以下命令清空暂存区或破坏工作区：

```bash
git reset --hard
git restore .
git checkout .
```

如需取消暂存，只允许使用不破坏工作区的方式，并必须说明原因：

```bash
git restore --staged <file>
```

## commit 执行方式

优先使用 `git commit -F`，避免多行 body、引号、反引号导致 shell 转义问题。

如果提交信息只有标题，可以使用：

```bash
git commit -m "<type>(<scope>): <description>"
```

如果提交信息包含 body 或 footer，推荐使用：

```bash
cat > /tmp/commit-message.txt <<'EOF'
<type>(<scope>): <description>

- body 第一项
- body 第二项

<footer>
EOF

git commit -F /tmp/commit-message.txt
```

提交后必须记录 commit hash：

```bash
git log -1 --oneline
```

## 多提交执行

如果提交计划包含多条提交，必须按顺序执行。

每次提交前都要检查：

```bash
git diff --staged --stat
git diff --staged
```

每次提交后都要检查：

```bash
git log -1 --oneline
git status -sb
```

确保不会把下一条提交的文件误放入当前提交。

如果中途失败，必须停止，不得继续执行后续提交。

必须记录已经完成的 commit hash。

## 推送规则

所有提交完成后，必须推送当前分支。

推送前先检查当前分支是否已有 upstream：

```bash
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

如果已有 upstream，执行：

```bash
git push
```

如果没有 upstream，执行：

```bash
git push -u origin HEAD
```

如果 push 失败，必须停止并输出失败原因。

不得执行：

```bash
git push --force
git push --force-with-lease
```

不得修改远端分支名。

不得推送到非当前分支。

## 提交后检查

提交和推送完成后，必须执行：

```bash
git status -sb
git log --oneline -n 5
```

输出最终状态。

## 禁止行为

禁止执行：

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

除取消暂存外，不得使用 `git restore`。

允许在必要时取消暂存：

```bash
git restore --staged <file>
```

但必须说明原因，且不得影响工作区内容。

## 失败输出

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

如果已有部分提交成功，但 push 失败，必须明确说明本地提交已经产生。

如果 patch 拆分失败，必须明确说明失败文件和失败原因。

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

## 标准执行顺序

### 分析阶段

```bash
git rev-parse --show-toplevel
git branch --show-current
git status -sb
git remote -v
git diff --stat
git diff --name-status
git diff
git diff --staged --stat
git diff --staged --name-status
git diff --staged
git ls-files --others --exclude-standard
```

然后生成提交计划并等待用户确认。

### 普通文件级提交

```bash
git add <files>
git diff --staged --stat
git diff --staged
git commit -F /tmp/commit-message.txt
git log -1 --oneline
git status -sb
```

### 同文件多意图 patch 级提交

```bash
git diff -- <file> > /tmp/full.diff

cat > /tmp/commit-part.patch <<'EOF'
<当前提交意图对应的 patch 内容>
EOF

git apply --cached --check /tmp/commit-part.patch
git apply --cached /tmp/commit-part.patch
git diff --staged --stat
git diff --staged
git commit -F /tmp/commit-message.txt
git log -1 --oneline
git status -sb
```

### 推送阶段

如果已有 upstream：

```bash
git push
```

如果没有 upstream：

```bash
git push -u origin HEAD
```

最后执行：

```bash
git status -sb
git log --oneline -n 5
```