#!/usr/bin/env bash
# npm run start-module: run once, right after cloning a module branch.
# Makes the branch your local main, keeps the course repo as the "course" remote,
# and creates your public copper-mN repo on GitHub and pushes to it.
# If a step fails, fix the problem and run it again: it picks up where it stopped.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

config() { node -p "require('./course.config.json').$1"; }
module="$(config module)"
repo="$(config repoPrefix)${module}"

fail() { echo "start-module: $*" >&2; exit 1; }

command -v gh >/dev/null || fail "install the GitHub CLI first: https://cli.github.com"
gh auth status >/dev/null 2>&1 || fail "log in to GitHub first: gh auth login"
if git remote get-url course >/dev/null 2>&1 && git remote get-url origin >/dev/null 2>&1; then
  fail "this clone is already set up (it has \"course\" and \"origin\" remotes)."
fi

owner="$(gh api user --jq .login)"

git branch -M main
if ! git remote get-url course >/dev/null 2>&1; then
  git remote rename origin course
fi

if ! gh repo view "${owner}/${repo}" >/dev/null 2>&1; then
  gh repo create "$repo" --public >/dev/null ||
    fail "could not create ${repo} on GitHub. Fix the problem above, then run npm run start-module again."
fi

field=url
[ "$(gh config get git_protocol 2>/dev/null || true)" = ssh ] && field=sshUrl
git remote add origin "$(gh repo view "${owner}/${repo}" --json "$field" --jq ".${field}")"
if ! git push -u origin main; then
  git remote remove origin
  fail "could not push to ${owner}/${repo}. If that repo already has other work in it, delete it on GitHub (Settings > Delete this repository), then run npm run start-module again."
fi

echo "Done: https://github.com/${owner}/${repo}"
