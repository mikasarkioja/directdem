# Setup Guide for Fresh Windows Installation

This guide will help you set up everything needed to run the DirectDem project on a fresh Windows computer.

## Step 1: Install Node.js

1. **Download Node.js:**
   - Go to https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit is most common)

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard (accept defaults)
   - Make sure "Add to PATH" is checked (should be by default)
   - Complete the installation

3. **Verify Installation:**
   - Open PowerShell or Command Prompt
   - Run these commands to verify:
   ```powershell
   node --version
   npm --version
   ```
   - You should see version numbers (e.g., `v20.x.x` for Node.js and `10.x.x` for npm)

## Step 2: Install Git (Optional but Recommended)

1. **Download Git:**
   - Go to https://git-scm.com/download/win
   - Download the installer

2. **Install Git:**
   - Run the installer
   - Accept defaults (or customize if you prefer)
   - Complete the installation

3. **Verify Installation:**
   ```powershell
   git --version
   ```

## Step 3: Set Up the Project

1. **Navigate to Project Directory:**
   ```powershell
   cd C:\Users\mikas\Documents\Cursor\DirectDem
   ```

2. **Install Project Dependencies:**
   ```powershell
   npm install
   ```
   - This will install all packages listed in `package.json`
   - Wait for it to complete (may take a few minutes)

## Step 4: Run the Development Server

1. **Start the Development Server:**
   ```powershell
   npm run dev
   ```

2. **Open in Browser:**
   - The terminal will show: `- Local: http://localhost:3000`
   - Open your browser and go to: **http://localhost:3000**
   - You should see the DirectDem dashboard!

## Step 5: Verify Everything Works

- You should see the sidebar with "Active Bills", "Consensus Map", and "My Profile"
- Click on "Active Bills" to see the list of 5 mock bills
- Click on any bill to see the detailed comparison view
- Check that the "Discrepancy Gap" highlights in red when >15%

## Troubleshooting

### If `npm install` fails:
- Make sure Node.js is installed correctly
- Try running PowerShell as Administrator
- Clear npm cache: `npm cache clean --force`
- Try deleting `node_modules` folder and `package-lock.json` (if exists), then run `npm install` again

### If `npm run dev` fails:
- Make sure you're in the project directory
- Check that all dependencies installed correctly
- Look for error messages in the terminal

### Port 3000 already in use:
- Close any other applications using port 3000
- Or change the port by editing `package.json` and adding `-p 3001` to the dev script

## Quick Reference Commands

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## What Gets Installed

When you run `npm install`, these packages will be installed:

**Dependencies:**
- `next` - Next.js framework
- `react` & `react-dom` - React library
- `lucide-react` - Icon library

**Dev Dependencies:**
- `typescript` - TypeScript compiler
- `tailwindcss` - CSS framework
- `postcss` & `autoprefixer` - CSS processing
- `@types/*` - TypeScript type definitions

All packages are automatically downloaded to the `node_modules` folder.


