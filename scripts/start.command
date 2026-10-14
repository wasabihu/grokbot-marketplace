#!/bin/zsh
cd "$(dirname "$0")/.." || exit 1
task_node="$(command -v node)"
if [[ -z "$task_node" && -x "$HOME/.local/bin/node" ]]; then
  task_node="$HOME/.local/bin/node"
fi
if [[ -z "$task_node" && -x /opt/homebrew/bin/node ]]; then
  task_node=/opt/homebrew/bin/node
fi
if [[ -z "$task_node" ]]; then
  print '未找到 Node.js，请使用已安装 Node.js 的终端运行 npm start。'
  read '?按回车关闭'
  exit 1
fi
"$task_node" server.mjs
