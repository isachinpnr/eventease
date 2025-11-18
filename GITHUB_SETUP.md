# GitHub Repository Setup Guide

## Step 1: Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `EventEase` (or your preferred name)
   - **Description**: "Full-stack event booking platform with React, Node.js, and MongoDB"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands:

### Option A: If you haven't created the repo yet (recommended)
```bash
cd /home/kali/Projects/Event_Plateform
git remote add origin https://github.com/YOUR_USERNAME/EventEase.git
git push -u origin main
```

### Option B: If you already created the repo with README
```bash
cd /home/kali/Projects/Event_Plateform
git remote add origin https://github.com/YOUR_USERNAME/EventEase.git
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Step 3: Replace YOUR_USERNAME

Replace `YOUR_USERNAME` in the commands above with your actual GitHub username.

## Step 4: Authentication

When you run `git push`, GitHub will ask for authentication:
- **Personal Access Token** (recommended) or
- **GitHub CLI** authentication

### To create a Personal Access Token:
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name and select scopes: `repo` (full control)
4. Copy the token and use it as your password when pushing

## Quick Commands Summary

```bash
# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/EventEase.git

# Push to GitHub
git push -u origin main
```

## Verify

After pushing, refresh your GitHub repository page. You should see all your files!

## Future Updates

To push future changes:
```bash
git add .
git commit -m "Your commit message"
git push
```

