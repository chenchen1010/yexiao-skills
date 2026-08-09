#!/usr/bin/env bash

set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
user_home="${HOME:?HOME is required}"

codex_root="$user_home/.codex/skills"
agents_root="$user_home/.agents/skills"
claude_root="$user_home/.claude/skills"
workbuddy_root="${WORKBUDDY_SKILLS_DIR:-$user_home/.workbuddy/skills}"

skill_names=(
  nightschool-video
  douyin-publish
  wechat-channels-publish
)

ensure_link() {
  local target="$1"
  local link_path="$2"

  mkdir -p "$(dirname "$link_path")"

  if [[ -L "$link_path" ]]; then
    if [[ "$(readlink "$link_path")" == "$target" ]]; then
      echo "ok: $link_path"
      return
    fi
    unlink "$link_path"
  elif [[ -e "$link_path" ]]; then
    echo "skip: $link_path is a real file or directory" >&2
    return
  fi

  ln -s "$target" "$link_path"
  echo "linked: $link_path -> $target"
}

for skill_root in "$codex_root" "$agents_root" "$claude_root" "$workbuddy_root"; do
  for skill_name in "${skill_names[@]}"; do
    ensure_link "$repo_dir/$skill_name" "$skill_root/$skill_name"
  done
done

# Backward-compatible repository path used by earlier Codex sessions.
ensure_link "$repo_dir" "$codex_root/yexiao-skills"

# remotion-best-practices may already be managed by another shared source.
# Only install the yexiao copy when the runtime has no live dependency.
for skill_root in "$codex_root" "$agents_root" "$claude_root" "$workbuddy_root"; do
  dependency_link="$skill_root/remotion-best-practices"
  if [[ -e "$dependency_link" ]]; then
    echo "keep: $dependency_link"
  elif [[ -L "$dependency_link" ]]; then
    unlink "$dependency_link"
    ensure_link "$repo_dir/remotion-best-practices" "$dependency_link"
  else
    ensure_link "$repo_dir/remotion-best-practices" "$dependency_link"
  fi
done
