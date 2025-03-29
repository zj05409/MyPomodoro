# 贡献指南

感谢您考虑为MyPomodoro项目做出贡献！这是一个为开源社区创建的项目，我们欢迎任何形式的贡献。

## 如何贡献

有多种方式可以贡献到这个项目：

1. **报告Bug**：如果您发现了bug，请通过GitHub Issue报告，使用提供的bug模板。
2. **提出功能请求**：通过GitHub Issue提交新功能建议。
3. **提交PR**：您可以fork仓库，实现新功能或修复问题，然后提交PR。

## 开发指南

### 环境设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/MyPomodoro.git
cd MyPomodoro

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动Electron应用（开发模式）
npm run electron:dev
```

### 代码风格

- 使用ESLint提供的规则
- 保持一致的代码格式
- 使用有意义的变量和函数名

### 提交信息规范

我们使用约定式提交规范（Conventional Commits）格式化提交信息：

- `feat:`：新功能
- `fix:`：bug修复
- `docs:`：文档更改
- `style:`：不影响代码含义的更改（空格、格式、缺少分号等）
- `refactor:`：既不修复bug也不添加功能的代码更改
- `perf:`：提高性能的代码更改
- `test:`：添加或修改测试
- `chore:`：更改构建过程或辅助工具和库

例如：`feat: 添加自动保存功能`

### 分支策略

- `main`：主分支，保持稳定
- `develop`：开发分支，所有功能开发都基于此分支
- `feature/xxx`：新功能开发
- `bugfix/xxx`：bug修复
- `docs/xxx`：文档更新

## Pull Request流程

1. Fork存储库
2. 创建您的功能分支：`git checkout -b feature/amazing-feature`
3. 提交您的更改：`git commit -m 'feat: 添加一些令人惊叹的功能'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交Pull Request
6. 等待审查和反馈

## 版本控制

我们遵循[语义化版本控制](https://semver.org/lang/zh-CN/)：

- 主版本号（MAJOR）：当你做了不兼容的API更改
- 次版本号（MINOR）：当你做了向下兼容的功能性新增
- 修订号（PATCH）：当你做了向下兼容的问题修正

## 联系方式

如有任何问题，可以通过GitHub Issues联系我们。

感谢您的贡献！ 