# IMW Claude Code Plugins

IMW Git + Gogs 工作流插件，把高风险 Git 操作拆成可确认、可检查、可降级的 Skill。`git-safety` 是公共底线，其他 Skill 只写自己的工作流。

## 安装

```bash
claude plugin marketplace add .
claude plugin install imw-git-gogs@imw-tools
```

## Skills

- `/imw-git-gogs:git-safety`：所有 Git Skill 的公共底线，不是业务工作流。
- `/imw-git-gogs:create-branch`：从本地或远端来源分支创建新开发分支。
- `/imw-git-gogs:commit-and-push`：分析当前变更，生成提交计划，确认后提交并按需推送。
- `/imw-git-gogs:merge`：检查并确认后把来源分支合并到当前分支。
- `/imw-git-gogs:create-pr`：生成 PR 内容，优先通过 `gogs-pr` MCP 创建 Gogs PR。
- `/imw-git-gogs:sync-branch`：处理“同步 dev”“更新到目标分支”等方向不清的口语请求。
- `/imw-git-gogs:resolve-conflict`：分析并确认后处理 merge/rebase/cherry-pick 冲突。
- `/imw-git-gogs:rollback-safe`：用可审计方式撤销、回滚或放弃未完成 Git 操作。

## 结构

- `git-safety` 是所有 Git Skill 的公共底线，不是独立业务工作流。
- 其他 Skill 只描述各自工作流，并在执行前遵守 `git-safety`。

## Gogs MCP

`create-pr` 依赖运行环境提供 `gogs-pr` MCP 工具：

- `mcp__gogs-pr__gogs_create_pull_request`
- `mcp__gogs-pr__gogs_list_pull_requests`

如果 MCP 不可用、认证失败或无法从 `git remote` 解析 owner/repo，Skill 必须降级为输出手动创建 PR 的内容和原因。

## 维护

- macOS 开发者建议配置全局 gitignore 忽略 `.DS_Store`。
- 反馈渠道：通过 IMW 内部插件维护者或本仓库 issue 反馈 Skill 触发和流程问题。
