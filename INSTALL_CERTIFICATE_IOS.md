d# Installing SSL Certificates on iPhone for AMA Order System

## Overview

The AMA Order System now uses **multi-domain SSL certificates** and requires **employee certificates** for security. This guide will help you install the necessary certificates on your iPhone.

## What You Need to Install

1. **CA Certificate** (`ca-cert.crt`) - Allows your device to trust the server
2. **Employee Certificate** (`employee-cert.p12`) - Required for access (password: `ama2024`)

## Supported Endpoints

After installation, you can access the application without warnings on:

**Frontend (Production):**
- `https://10.10.10.110:5174`
- `https://213.6.226.163:5174`

**Frontend (Development):**
- `https://10.10.10.110:5173`
- `https://213.6.226.163:5173`

**Backend:**
- `https://10.10.10.110:3004`
- `https://213.6.226.163:3004`
- `https://10.10.10.110:5001`
- `https://213.6.226.163:5001`

---

## Installation Steps

### Step 1: Download Certificates

**Option A: Download from Server (Easiest)**
1. Open Safari on your iPhone
2. Go to: `https://10.10.10.110:5174/install-employee-cert.html`
3. Download both certificates from the page

**Option B: AirDrop from Mac**
1. On your Mac, locate the files in: `/Users/yaqot/Documents/AMA-Order-System/certs/`
2. AirDrop both `ca-cert.crt` and `employee-cert.p12` to your iPhone

**Option C: Direct Download**
1. Go to: `https://10.10.10.110:5174/ca-cert.crt`
2. Go to: `https://10.10.10.110:5174/employee-cert.p12`

### Step 2: Install CA Certificate

1. After downloading `ca-cert.crt`, you'll see **"Profile Downloaded"**
2. Tap **Close**
3. Go to **Settings** → **General** → **VPN & Device Management**
4. Under "Downloaded Profile", tap **AMA Root CA**
5. Tap **Install** (top right)
6. Enter your iPhone passcode
7. Tap **Install** again (confirmation)
8. Tap **Install** one more time
9. Tap **Done**

### Step 3: Install Employee Certificate

1. After downloading `employee-cert.p12`, you'll see **"Profile Downloaded"**
2. Tap **Close**
3. Go to **Settings** → **General** → **VPN & Device Management**
4. Under "Downloaded Profile", tap **AMA Employee Certificate**
5. Tap **Install** (top right)
6. Enter your iPhone passcode
7. **Enter certificate password: `ama2024`**
8. Tap **Install** again (confirmation)
9. Tap **Install** one more time
10. Tap **Done**

### Step 4: Enable Full Trust for CA Certificate

> **⚠️ CRITICAL STEP - The app will NOT work without this!**

1. Go to **Settings** → **General** → **About**
2. Scroll down to **Certificate Trust Settings**
3. Find **AMA Root CA** in the list
4. Toggle the switch to **ON** (green)
5. Tap **Continue** on the warning dialog

### Step 5: Access the Application

You can now access the application at any of these URLs:
- **Production**: `https://10.10.10.110:5174` or `https://213.6.226.163:5174`
- **Development**: `https://10.10.10.110:5173` or `https://213.6.226.163:5173`

### Step 6: Add to Home Screen (Optional)

1. Open Safari and go to your preferred application URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "AMA Orders"
5. Tap **Add**

The home screen app will now work perfectly without any certificate warnings!

---

## Troubleshooting

### "Client certificate required" Error

**Problem**: You see an error message saying a client certificate is required.

**Solution**: Make sure you've installed the **employee certificate** (employee-cert.p12), not just the CA certificate. Both are required.

### "Invalid client certificate" Error

**Problem**: You see an error saying your certificate is not authorized.

**Solution**: 
- Verify you installed the correct employee certificate
- Make sure you entered the password correctly (`ama2024`)
- Try reinstalling the employee certificate
- Contact IT support if the problem persists

### Still Getting "Load Failed" in Home Screen App?

**Solutions**:
1. Make sure you completed **Step 4** (Certificate Trust Settings)
2. Try restarting your iPhone
3. Delete the home screen app and add it again
4. Verify both certificates are installed in Settings → VPN & Device Management

### Can't Find Certificate Trust Settings?

**Solution**:
- Make sure you installed the CA certificate first (Step 2)
- The Certificate Trust Settings only appears after installing a profile
- Restart your iPhone and check again

### Certificate Not Showing in VPN & Device Management?

**Solutions**:
- Try downloading the files again
- Make sure you're opening the correct files:
  - CA certificate: `.crt` file
  - Employee certificate: `.p12` file
- Try using a different download method (AirDrop vs direct download)

### Browser Still Shows Security Warning?

**Solutions**:
1. Verify you enabled trust in Certificate Trust Settings
2. Make sure you're accessing the correct URLs (listed above)
3. Clear Safari cache: Settings → Safari → Clear History and Website Data
4. Restart Safari

---

## Security Notes

> **🔒 Keep Your Employee Certificate Secure!**
> - Do not share your employee certificate with anyone
> - Do not install it on non-work devices
> - If your device is lost or stolen, immediately contact IT support

> **⏰ Certificate Validity**
> - Certificates are valid for 10 years
> - You will be notified when renewal is needed

---

## Alternative: Use the Installation Web Page

For the easiest installation experience, visit:
`https://10.10.10.110:5174/install-employee-cert.html`

This page provides:
- Direct download links for both certificates
- Platform-specific installation instructions
- Interactive guide for your device type

---

## Need More Help?

For detailed installation instructions for other platforms (macOS, Windows, Android), see:
- **EMPLOYEE_CERTIFICATE_SETUP.md** - Comprehensive guide for all platforms

For IT support, contact the IT department with:
- Your device type
- The exact error message
- Screenshots if possible
