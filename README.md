# coding-plugin

Claude Code 插件市场，提供基于 Git + Gogs 的工作流 Skill。

把高风险 Git 操作拆成可确认、可检查、可降级的 Skill：`git-safety` 是所有 Git Skill 的公共底线，其他 Skill 各负其责。

## 仓库结构

```
.claude-plugin/marketplace.json          # 市场清单
plugins/git-gogs-coding-plugin/
  .claude-plugin/plugin.json             # 插件清单
  skills/
    git-safety/SKILL.md                  # 公共安全底线
    create-branch/SKILL.md               # 创建开发分支
    commit-and-push/SKILL.md             # 分析变更、提交并推送
    merge/SKILL.md                       # 合并分支
    create-pr/SKILL.md                   # 创建 Gogs PR
    sync-branch/SKILL.md                 # 同步分支
    resolve-conflict/SKILL.md            # 处理冲突
    rollback-safe/SKILL.md               # 安全回滚
```

## 安装

在仓库根目录执行：

```bash
# 添加本地市场（建议限定到当前项目，避免污染全局配置）
claude plugin marketplace add --scope project .

# 安装插件
claude plugin install --scope project git-gogs-coding-plugin@coding-plugin
```

安装后，Skill 通过自然语言描述自动触发。例如：

- "我要创建一个新分支" → 触发 `create-branch`
- "提交当前改动并推送" → 触发 `commit-and-push`
- "合并 dev 到当前分支" → 触发 `merge`
- "创建 PR 到 main" → 触发 `create-pr`

## 验证

```bash
# 验证市场清单
claude plugin validate .

# 验证插件清单
claude plugin validate plugins/git-gogs-coding-plugin
```

## Skill 一览

| Skill | 用途 |
|---|---|
| `git-safety` | 公共底线：禁止破坏性命令、保护分支、写操作必须确认 |
| `create-branch` | 从本地或远端来源分支创建新开发分支 |
| `commit-and-push` | 分析当前变更，生成提交计划，确认后提交并按需推送 |
| `merge` | 检查并确认后把来源分支合并到当前分支 |
| `create-pr` | 生成 PR 内容，优先通过 `gogs-pr` MCP 创建 Gogs PR |
| `sync-branch` | 处理"同步 dev""更新到目标分支"等方向不清的口语请求 |
| `resolve-conflict` | 分析并确认后处理 merge/rebase/cherry-pick 冲突 |
| `rollback-safe` | 用可审计方式撤销、回滚或放弃未完成 Git 操作 |

## 反馈

通过本仓库 issue 反馈 Skill 触发和流程问题。
