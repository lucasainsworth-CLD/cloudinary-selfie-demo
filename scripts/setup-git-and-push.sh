#!/usr/bin/env bash
# Run from your Mac Terminal (outside restricted sandboxes) if git init fails in the IDE.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -d .git ]] && git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Git repo already initialized."
else
  rm -rf .git
  git init -b main
  git add -A
  git commit -m "Initial commit: Cloudinary selfie wall (display + mobile upload)"
fi

echo ""
echo "Next (after: gh auth login -h github.com):"
echo "  gh repo create cloudinary-selfie-demo --public --source=. --remote=origin --push \\"
echo "    --description \"1080p selfie wall + Cloudinary Upload Widget (GitHub Pages)\""
echo ""
echo "Or create an empty repo on github.com/new, then:"
echo "  git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git"
echo "  git push -u origin main"
