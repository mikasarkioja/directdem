# Authentication Guide

## How to Log In

DirectDem uses **Magic Link** authentication - a passwordless login system where you receive a secure link via email.

### Step-by-Step Login Process

1. **Enter Your Email**
   - Look for the authentication form in the sidebar (bottom of the left navigation)
   - Enter any valid email address (e.g., `yourname@example.com`)
   - Click "Kirjaudu" (Login) button

2. **Check Your Email**
   - Supabase will send you an email with a Magic Link
   - The email subject will be something like "Confirm your signup" or "Magic Link"
   - **Note**: Check your spam folder if you don't see it

3. **Click the Magic Link**
   - Open the email and click the link
   - You'll be redirected back to the app
   - You're now logged in!

4. **You're In!**
   - Once logged in, you'll see your email address in the sidebar
   - You can now vote on bills
   - Your votes will be saved to your account

## No Test User Needed

Unlike traditional login systems, there's **no test user or password**. You can use:
- Your personal email
- A test email address
- Any email you have access to

## Troubleshooting

### "I didn't receive the email"

1. **Check Spam Folder**: Magic Link emails sometimes go to spam
2. **Wait a Few Minutes**: Email delivery can take 1-2 minutes
3. **Check Supabase Settings**: 
   - Go to your Supabase dashboard
   - Check **Authentication** → **Email Templates**
   - Make sure email is enabled

### "The link expired"

Magic Links typically expire after 1 hour. Just request a new one by entering your email again.

### "I can't see the login form"

- Make sure you're not already logged in
- Check the bottom of the sidebar
- Try refreshing the page

### Email Not Sending?

If emails aren't being sent, check:

1. **Supabase Email Settings**:
   - Go to Supabase Dashboard → **Authentication** → **Providers**
   - Make sure **Email** is enabled
   - Check rate limits

2. **Development Mode**:
   - In development, Supabase has rate limits on emails
   - You might need to wait between requests

3. **Custom SMTP** (Optional):
   - For production, you can configure custom SMTP
   - Go to **Settings** → **Auth** → **SMTP Settings**

## For Testing

If you want to test without using your real email:

1. Use a temporary email service like:
   - [10minutemail.com](https://10minutemail.com)
   - [TempMail](https://temp-mail.org)
   - [Guerrilla Mail](https://www.guerrillamail.com)

2. Or use your own test email address

## Logging Out

Click the "Kirjaudu ulos" (Log out) button in the sidebar to sign out.

## Security Notes

- Magic Links are single-use and expire after 1 hour
- Each link can only be used once
- Your session persists until you log out or it expires
- All votes are tied to your user account

