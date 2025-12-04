#!/bin/bash

# Check if a commit message was provided
if [ -z "$1" ]
then
  # Default message if none provided
  msg="Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
else
  msg="$1"
fi

echo "🚀 Deploying to GitHub..."
git add .
git commit -m "$msg"
git push

echo "✅ Done! Vercel will update your site shortly."
