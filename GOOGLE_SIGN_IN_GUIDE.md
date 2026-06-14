# Google Sign-In Setup Guide

This guide provides step-by-step instructions to configure Google OAuth 2.0 and enable Google Sheets synchronization in the Quiz & Performance Platform.

## Table of Contents
1. [Google Cloud Console Setup](#1-google-cloud-console-setup)
2. [Enable Google Sheets & Drive APIs](#2-enable-google-sheets--drive-apis)
3. [Configure OAuth Consent Screen](#3-configure-oauth-consent-screen)
4. [Create OAuth Credentials](#4-create-oauth-credentials)
5. [Configure the Codebase](#5-configure-the-codebase)
6. [Troubleshooting & Sandbox Mode](#6-troubleshooting--sandbox-mode)

---

## 1. Google Cloud Console Setup
To use Google Sign-In, you need to create a project in the Google Cloud Console:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. If you don't have a project, click the project dropdown at the top of the page (next to "Google Cloud") and select **New Project**.
3. Name your project (e.g., `Quiz & Performance Platform`) and click **Create**.
4. Make sure your new project is selected in the top navigation dropdown.

## 2. Enable Google Sheets & Drive APIs
This application writes student responses directly to Google Sheets and uses Drive file permissions, which requires enabling the corresponding APIs:
1. In the Google Cloud Console sidebar, navigate to **APIs & Services** > **Library**.
2. Search for **Google Sheets API**.
3. Click on **Google Sheets API** and then click the **Enable** button.
4. Return to the Library, search for **Google Drive API**, and click **Enable** (required for the `drive.file` scope).

## 3. Configure OAuth Consent Screen
Before creating credentials, you must configure the consent screen that users see when signing in:
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Choose **User Type**:
   - Select **External** if you want anyone with a Google Account to be able to sign in.
   - Select **Internal** if you have a Google Workspace organization and want to restrict it to members of your organization.
   - Click **Create**.
3. Fill in the **App Information**:
   - **App name**: `Quiz & Performance Platform`
   - **User support email**: Your email address.
   - **Developer contact information**: Your email address.
   - Click **Save and Continue**.
4. In the **Scopes** step, click **Add or Remove Scopes**:
   - Search for and check the following scopes (which are defined in [App.tsx](file:///Users/harshul/Projects/quiz-&-performance-platform/src/App.tsx#L93-L96)):
     - `.../auth/spreadsheets` (Google Sheets API)
     - `.../auth/drive.file` (Google Drive API - to create/edit spreadsheets)
   - Click **Update** at the bottom, then click **Save and Continue**.
5. In the **Test users** step:
   - While your app is in "Testing" mode, only authorized test users can log in.
   - Click **Add Users** and enter your Google Email address and any other testing accounts.
   - Click **Save and Continue**.
6. Review the summary and click **Back to Dashboard**.

## 4. Create OAuth Credentials
Now you can generate the Client ID needed for the application:
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Select **Application type** as **Web application**.
4. Name your client (e.g., `Quiz Platform Web Client`).
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:3000` (for local development)
6. Under **Authorized redirect URIs**, click **+ Add URI** and add:
   - `http://localhost:3000/` (ensure it matches your local development URL exactly, including any trailing slash)
7. Click **Create**.
8. A modal will display containing your **Client ID** and **Client Secret**. Copy the **Client ID** (you do not need the client secret for this client-side implicit flow).

## 5. Configure the Codebase
Now configure the Client ID inside the codebase:
1. Open the [App.tsx](file:///Users/harshul/Projects/quiz-&-performance-platform/src/App.tsx) file.
2. Locate the `handleGoogleLogin` function (starting at line 88).
3. Replace the placeholder client ID on line 91 with your newly created **Client ID**:
   ```typescript
   // src/App.tsx
   const clientId = 'YOUR_NEW_CLIENT_ID.apps.googleusercontent.com';
   ```
4. Save the file.

## 6. Troubleshooting & Sandbox Mode
### iFrame Redirection Blocked
If you run this application inside an `iframe` sandbox (such as the Google AI Studio applet preview environment), the browser may block popups and redirections to Google accounts.
To handle this:
- The app automatically detects if redirection is blocked or issues a sandbox warning at the top of the interface.
- You can use the **Manual Token paste** feature:
  1. Open a regular web browser tab to authenticate or generate a temporary OAuth access token.
  2. Paste it into the popup modal in the app (accessible via the **Manual Token paste** button) to activate real-time syncing.

### "Access Blocked: Project has not been configured" or "Unverified App"
- If you see a warning screen from Google during login, click **Advanced** and then click **Go to [App Name] (unsafe)**. This is normal because the app is in test mode and has not undergone Google verification.
- Make sure the account you are signing in with is listed under **Test users** in the OAuth Consent Screen configuration.
