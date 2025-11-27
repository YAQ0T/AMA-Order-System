# Employee Certificate Installation Guide

## Overview

The AMA Order System now requires **two certificates** to be installed on your device for security:

1. **CA Certificate** (`ca-cert.crt`) - Allows your device to trust the server
2. **Employee Certificate** (`employee-cert.p12`) - Proves your device is authorized to access the system

**Password for employee certificate: `ama2024`**

---

## iOS Installation (iPhone/iPad)

### Step 1: Download Certificates

1. **Option A: AirDrop from Mac**
   - Locate files on Mac: `/Users/yaqot/Documents/AMA-Order-System/certs/`
   - AirDrop both `ca-cert.crt` and `employee-cert.p12` to your iPhone

2. **Option B: Download from Server**
   - Open Safari on your iPhone
   - Go to: `https://10.10.10.110:5174/ca-cert.crt` (download CA certificate)
   - Go to: `https://10.10.10.110:5174/employee-cert.p12` (download employee certificate)

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

> [!IMPORTANT]
> This step is CRITICAL - the app will not work without it!

1. Go to **Settings** → **General** → **About**
2. Scroll down to **Certificate Trust Settings**
3. Find **AMA Root CA** in the list
4. Toggle the switch to **ON** (green)
5. Tap **Continue** on the warning dialog

### Step 5: Access the Application

You can now access the application at:
- **Production**: `https://10.10.10.110:5174` or `https://213.6.226.163:5174`
- **Development**: `https://10.10.10.110:5173` or `https://213.6.226.163:5173`

### Step 6: Add to Home Screen (Optional)

1. Open Safari and go to the application URL
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "AMA Orders"
5. Tap **Add**

The home screen app will now work without any certificate warnings!

---

## macOS Installation (Safari, Chrome)

### Step 1: Download Certificates

Download both certificates:
- `ca-cert.crt`
- `employee-cert.p12`

### Step 2: Install Certificates in Keychain

1. **Double-click `ca-cert.crt`**
   - Keychain Access will open
   - Select **System** keychain
   - Click **Add**
   - Enter your Mac password

2. **Double-click `employee-cert.p12`**
   - Enter password: `ama2024`
   - Select **System** keychain
   - Click **OK**
   - Enter your Mac password

### Step 3: Trust the CA Certificate

1. Open **Keychain Access** app
2. Select **System** keychain
3. Find **AMA Root CA**
4. Double-click it
5. Expand **Trust** section
6. Set **"When using this certificate"** to **Always Trust**
7. Close the window and enter your Mac password

### Step 4: Access the Application

Open Safari or Chrome and go to:
- `https://10.10.10.110:5174`
- `https://213.6.226.163:5174`

The browser will automatically use your employee certificate.

---

## Windows Installation (Chrome, Edge, Firefox)

### Step 1: Download Certificates

Download both certificates:
- `ca-cert.crt`
- `employee-cert.p12`

### Step 2: Install CA Certificate

1. **Double-click `ca-cert.crt`**
2. Click **Install Certificate**
3. Select **Local Machine**
4. Click **Next**
5. Select **Place all certificates in the following store**
6. Click **Browse** → Select **Trusted Root Certification Authorities**
7. Click **Next** → **Finish**
8. Click **Yes** on the security warning

### Step 3: Install Employee Certificate

1. **Double-click `employee-cert.p12`**
2. Select **Local Machine**
3. Click **Next**
4. Click **Next** (file path should be pre-filled)
5. Enter password: `ama2024`
6. Check **Mark this key as exportable**
7. Click **Next**
8. Select **Automatically select the certificate store**
9. Click **Next** → **Finish**

### Step 4: Access the Application

Open Chrome, Edge, or Firefox and go to:
- `https://10.10.10.110:5174`
- `https://213.6.226.163:5174`

---

## Android Installation

### Step 1: Download Certificates

1. Download `ca-cert.crt` and `employee-cert.p12` to your device

### Step 2: Install CA Certificate

1. Go to **Settings** → **Security** → **Encryption & credentials**
2. Tap **Install a certificate** → **CA certificate**
3. Tap **Install anyway**
4. Navigate to and select `ca-cert.crt`

### Step 3: Install Employee Certificate

1. Go to **Settings** → **Security** → **Encryption & credentials**
2. Tap **Install a certificate** → **VPN & app user certificate**
3. Navigate to and select `employee-cert.p12`
4. Enter password: `ama2024`
5. Give it a name: "AMA Employee"

### Step 4: Access the Application

Open Chrome and go to:
- `https://10.10.10.110:5174`
- `https://213.6.226.163:5174`

---

## Troubleshooting

### "Client certificate required" Error

**Problem**: You see an error message saying a client certificate is required.

**Solution**: Make sure you've installed the **employee certificate** (employee-cert.p12), not just the CA certificate.

### "Invalid client certificate" Error

**Problem**: You see an error saying your certificate is not authorized.

**Solution**: 
- Make sure you installed the correct employee certificate
- Verify the certificate password was entered correctly (`ama2024`)
- Contact IT support if the problem persists

### "Certificate expired" Error

**Problem**: Your certificate has expired.

**Solution**: Contact IT support for a new employee certificate.

### iOS: "Load Failed" in Home Screen App

**Problem**: The home screen app shows "Load Failed".

**Solution**:
1. Make sure you completed **Step 4** (Enable Full Trust)
2. Go to Settings → General → About → Certificate Trust Settings
3. Enable trust for **AMA Root CA**
4. Restart your iPhone
5. Delete and re-add the home screen app

### Certificate Not Showing in iOS Settings

**Problem**: The certificate doesn't appear in VPN & Device Management.

**Solution**:
- Make sure you're downloading the correct file
- Try downloading again
- For employee certificate, make sure it's the `.p12` file
- For CA certificate, make sure it's the `.crt` file

### Browser Doesn't Prompt for Certificate

**Problem**: The browser doesn't ask you to select a certificate.

**Solution**:
- Make sure the employee certificate is installed in the correct certificate store
- Try restarting your browser
- Clear browser cache and try again

---

## Security Notes

> [!CAUTION]
> **Keep Your Employee Certificate Secure!**
> - Do not share your employee certificate with anyone
> - Do not install it on non-work devices
> - If your device is lost or stolen, immediately contact IT support to revoke the certificate

> [!WARNING]
> **Certificate Validity**
> - Certificates are valid for 10 years
> - You will need to renew before expiration
> - IT will notify you when renewal is needed

---

## Support

If you encounter any issues not covered in this guide, please contact IT support with:
- Your device type (iPhone, Mac, Windows, Android)
- The exact error message you're seeing
- Screenshots if possible
