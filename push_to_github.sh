#!/bin/bash

echo "=================================================="
echo "      Pushing AbiLang to GitHub Profile"
echo "=================================================="

# 1. Initialize Git Repository
if [ ! -d ".git" ]; then
    echo "Initializing local Git repository..."
    git init
    git checkout -b main
fi

# 2. Add and Commit files
echo "Staging files..."
git add .
git commit -m "Initial release of AbiLang compiler platform"

# 3. Create Public Repository via GitHub CLI or guide manual creation
echo "Creating repository on GitHub..."
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    # Create the repository on GitHub and push
    gh repo create abinashmofficial/abilang --public --source=. --remote=origin --push
    echo "Successfully created and pushed to: https://github.com/abinashmofficial/abilang"
else
    echo ""
    echo "--------------------------------------------------"
    echo "GitHub CLI (gh) is not authenticated."
    echo "--------------------------------------------------"
    echo "Step 1: Go to: https://github.com/new"
    echo "Step 2: Create a public repository named: abilang"
    echo "Step 3: Run these terminal commands to push your code:"
    echo ""
    echo "  git remote add origin https://github.com/abinashmofficial/abilang.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo "--------------------------------------------------"
fi
