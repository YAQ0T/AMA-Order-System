# Installing SSL Certificate on iPhone for Home Screen App

## Problem
When you add the AMA Order System to your iPhone home screen, it runs in standalone mode and doesn't recognize the certificate you accepted in Safari. This causes "Load Failed" errors.

## Solution: Install Certificate System-Wide on iPhone

### Step 1: Get the Certificate File

The certificate file is located at:
```
/Users/yaqot/Desktop/AMA Order System/ama-order-system-front/certs/cert.crt
```

### Step 2: Transfer Certificate to iPhone

Choose one of these methods:

**Option A: AirDrop (Easiest)**
1. On your Mac, locate the file: `AMA Order System/ama-order-system-front/certs/cert.crt`
2. Right-click → Share → AirDrop
3. Select your iPhone

**Option B: Email**
1. Email the `cert.crt` file to yourself
2. Open the email on your iPhone
3. Tap the attachment

**Option C: Host it temporarily**
You can also access it via: `https://10.10.10.56:5173/cert.crt` (if we copy it to the public folder)

### Step 3: Install the Certificate on iPhone

1. **Open the certificate file** on your iPhone
   - You'll see a warning: "Profile Downloaded"
   - Tap **Close**

2. **Go to Settings** → **General** → **VPN & Device Management**
   - You should see the certificate under "Downloaded Profile"
   - Tap on it
   - Tap **Install** (top right)
   - Enter your iPhone passcode if prompted
   - Tap **Install** again (confirmation)
   - Tap **Install** one more time
   - Tap **Done**

3. **Enable Full Trust for the Certificate**
   - Go to **Settings** → **General** → **About**
   - Scroll down to **Certificate Trust Settings**
   - Find your certificate in the list
   - Toggle the switch to **ON** (green)
   - Tap **Continue** on the warning dialog

### Step 4: Add App to Home Screen

1. Open Safari and go to `https://10.10.10.56:5173`
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Name it "AMA Orders" or whatever you prefer
5. Tap **Add**

### Step 5: Test the Home Screen App

1. Tap the app icon on your home screen
2. It should now load without "Load Failed" errors!

## Troubleshooting

**Still getting "Load Failed"?**
- Make sure you completed Step 3.3 (Certificate Trust Settings)
- Try restarting your iPhone
- Delete the home screen app and add it again

**Can't find Certificate Trust Settings?**
- Make sure you installed the profile first (Step 3.2)
- The Certificate Trust Settings only appears after installing a profile

**Certificate not showing in VPN & Device Management?**
- Try transferring the file again
- Make sure you're opening the `.crt` file, not the `.pem` file

## Alternative: Use HTTP Instead

If you don't want to install certificates, you can temporarily switch to HTTP for local development (less secure):
- This would require modifying the Vite config to disable HTTPS
- Not recommended for production use
