# Fix PowerShell Execution Policy Error

## The Problem
PowerShell is blocking npm from running because script execution is disabled by default on Windows.

## The Solution

You need to change the PowerShell execution policy. Here are two options:

### Option 1: Change Policy for Current User (Recommended - Safer)

1. **Open PowerShell as Administrator:**
   - Press `Windows Key + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
   - Click "Yes" when prompted by User Account Control

2. **Run this command:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Type `Y` and press Enter** when prompted

4. **Close the admin PowerShell window**

5. **Go back to your regular PowerShell** in the project directory and try:
   ```powershell
   npm install
   ```

### Option 2: Bypass for Current Session Only (Quick Fix)

If you don't want to change the policy permanently, you can bypass it just for this session:

1. **In your current PowerShell window**, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

2. **Then run:**
   ```powershell
   npm install
   ```

   Note: This only works for the current PowerShell session. You'll need to run it again if you open a new terminal.

### Option 3: Use Command Prompt Instead (Alternative)

If you prefer not to change PowerShell settings:

1. **Open Command Prompt (cmd)** instead of PowerShell
2. **Navigate to your project:**
   ```cmd
   cd C:\Users\mikas\Documents\Cursor\DirectDem
   ```
3. **Run npm install:**
   ```cmd
   npm install
   ```

## Recommended Approach

I recommend **Option 1** (RemoteSigned for CurrentUser) because:
- It's secure (only affects your user account)
- It allows locally created scripts to run
- It requires downloaded scripts to be signed
- You only need to do it once

## After Fixing

Once you've changed the execution policy, you should be able to run:
```powershell
npm install
npm run dev
```

without any issues!

