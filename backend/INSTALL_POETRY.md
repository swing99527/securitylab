# Poetry 安装指南

## macOS 安装 Poetry

Poetry 是 Python 的现代依赖管理和打包工具。

### 方法 1：使用 Homebrew（推荐）

```bash
brew install poetry
```

### 方法 2：官方安装脚本

```bash
curl -sSL https://install.python.poetry.org | python3 -
```

安装后需要将 Poetry 添加到 PATH：

```bash
# 如果使用 zsh (macOS 默认)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 如果使用 bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 验证安装

```bash
poetry --version
# 应该显示：Poetry (version 1.7.1)
```

### 配置 Poetry

```bash
# 在项目内创建虚拟环境（推荐）
poetry config virtualenvs.in-project true

# 查看配置
poetry config --list
```

## 安装完成后

运行本地开发环境设置脚本：

```bash
cd backend
./setup-local-dev.sh
```
