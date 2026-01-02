# GitHub Setup Instructions

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `directdem` (or your preferred name)
   - **Description**: "Shadow Direct Democracy Platform - Next.js 15 + Supabase"
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Initialize with README" (we already have files)
4. Click **"Create repository"**

## Step 2: Copy Your Repository URL

After creating the repository, GitHub will show you a URL like:
- `https://github.com/yourusername/directdem.git` (HTTPS)
- `git@github.com:yourusername/directdem.git` (SSH)

**Copy the HTTPS URL** (easier for first-time setup)

## Step 3: Connect and Push

Run these commands (replace `yourusername` and `directdem` with your actual values):

```bash
# Add the remote repository
git remote add origin https://github.com/yourusername/directdem.git

# Rename branch to 'main' (GitHub's default)
git branch -M main

# Push to GitHub
git push -u origin main
```

If prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)
  - Get one at: https://github.com/settings/tokens
  - Click "Generate new token (classic)"
  - Select scopes: `repo` (full control)
  - Copy the token and use it as your password

## Alternative: Use GitHub CLI

If you have GitHub CLI installed:

```bash
gh repo create directdem --private --source=. --remote=origin --push
```

## Done! ✅

Your code is now on GitHub. You can:
- View it at: `https://github.com/yourusername/directdem`
- Connect it to Vercel for deployment
- Share it with collaborators


