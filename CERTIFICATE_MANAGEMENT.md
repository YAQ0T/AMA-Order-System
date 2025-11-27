# Certificate Management Guide

## Overview

This document provides instructions for IT administrators to manage certificates for the AMA Order System, including generating new certificates, distributing them to employees, and handling certificate-related issues.

---

## Certificate Structure

The AMA Order System uses a three-tier certificate structure:

1. **CA (Certificate Authority) Certificate** - Root certificate that signs all other certificates
2. **Server Certificate** - Multi-domain certificate for the application servers
3. **Employee Client Certificates** - Individual certificates for authorized devices

### Certificate Files

| File | Purpose | Location | Keep Secure? |
|------|---------|----------|--------------|
| `ca-key.pem` | CA private key | `/certs/` | ⚠️ **CRITICAL** - Never distribute |
| `ca-cert.pem` | CA certificate | `/certs/` | Distribute to all devices |
| `ca-cert.crt` | CA certificate (iOS format) | `/certs/` | Distribute to all devices |
| `server-key.pem` | Server private key | `/server/certs/` & `/frontend/certs/` | ⚠️ Keep secure |
| `server-cert.pem` | Server certificate | `/server/certs/` & `/frontend/certs/` | Public |
| `employee-key.pem` | Employee private key | `/certs/` | Distribute to authorized devices |
| `employee-cert.pem` | Employee certificate | `/certs/` | Distribute to authorized devices |
| `employee-cert.p12` | Employee cert (iOS/Windows) | `/certs/` | Distribute to authorized devices |

---

## Generating New Certificates

### Full Certificate Regeneration

If you need to regenerate all certificates (e.g., CA compromise, expiration):

```bash
cd /Users/yaqot/Documents/AMA-Order-System/certs
bash generate-certificates.sh
```

This will:
- Generate a new CA certificate
- Generate a new server certificate with SANs for all IPs
- Generate a new employee client certificate
- Create .p12 file for iOS/Windows installation

### Copying Certificates to Application

After generating certificates, copy them to the appropriate locations:

```bash
# Copy to server
cp ca-cert.pem server-cert.pem server-key.pem ../server/certs/

# Copy to frontend
cp ca-cert.pem server-cert.pem server-key.pem ../ama-order-system-front/certs/

# Copy to public folder for distribution
cp ca-cert.crt employee-cert.p12 ../ama-order-system-front/public/
```

### Generating Additional Employee Certificates

To generate additional employee certificates (e.g., for specific users):

```bash
cd /Users/yaqot/Documents/AMA-Order-System/certs

# Generate private key
openssl genrsa -out employee-john-key.pem 4096

# Generate certificate signing request
openssl req -new -key employee-john-key.pem \
    -out employee-john-cert.csr \
    -subj "/C=US/ST=State/L=City/O=AMA Company/OU=Employees/CN=John Doe"

# Sign with CA
openssl x509 -req -in employee-john-cert.csr \
    -CA ca-cert.pem \
    -CAkey ca-key.pem \
    -CAcreateserial \
    -out employee-john-cert.pem \
    -days 3650

# Create .p12 for iOS/Windows
openssl pkcs12 -export \
    -out employee-john-cert.p12 \
    -inkey employee-john-key.pem \
    -in employee-john-cert.pem \
    -certfile ca-cert.pem \
    -passout pass:ama2024

# Clean up
rm employee-john-cert.csr
```

---

## Certificate Distribution

### Method 1: Web-Based Distribution (Recommended)

1. Copy certificates to the public folder:
   ```bash
   cp ca-cert.crt employee-cert.p12 /Users/yaqot/Documents/AMA-Order-System/ama-order-system-front/public/
   ```

2. Direct employees to:
   `https://10.10.10.110:5174/install-employee-cert.html`

3. They can download and install directly from their device

### Method 2: AirDrop (iOS/macOS)

1. Locate certificates in `/Users/yaqot/Documents/AMA-Order-System/certs/`
2. AirDrop `ca-cert.crt` and `employee-cert.p12` to employee devices

### Method 3: Email (Not Recommended)

> **⚠️ Warning**: Email is less secure. Use only if other methods are unavailable.

1. Email `ca-cert.crt` and `employee-cert.p12` to employees
2. Provide password separately: `ama2024`

### Method 4: USB/Physical Transfer

1. Copy certificates to USB drive
2. Provide to employees with installation instructions

---

## Certificate Verification

### Verify Server Certificate

Check that the server certificate includes all required SANs:

```bash
openssl x509 -in /Users/yaqot/Documents/AMA-Order-System/certs/server-cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

Expected output:
```
X509v3 Subject Alternative Name: 
    DNS:localhost, IP Address:10.10.10.110, IP Address:213.6.226.163, IP Address:127.0.0.1
```

### Verify Certificate Chain

Verify that the server and employee certificates are signed by the CA:

```bash
# Verify server certificate
openssl verify -CAfile ca-cert.pem server-cert.pem

# Verify employee certificate
openssl verify -CAfile ca-cert.pem employee-cert.pem
```

Expected output: `OK`

### Test mTLS Connection

Test that the server requires and accepts client certificates:

```bash
# Should succeed with client certificate
curl --cert employee-cert.pem --key employee-key.pem \
     --cacert ca-cert.pem \
     https://10.10.10.110:3004/api/auth/me

# Should fail without client certificate
curl --cacert ca-cert.pem https://10.10.10.110:3004/api/auth/me
```

---

## Certificate Revocation

### Immediate Revocation (Emergency)

If a device is lost or compromised:

1. **Generate a new employee certificate** (see above)
2. **Distribute the new certificate** to all authorized devices
3. **Optionally**: Implement a Certificate Revocation List (CRL)

### Implementing CRL (Advanced)

For production environments, consider implementing a CRL:

1. Create a CRL file listing revoked certificates
2. Update server configuration to check CRL
3. Distribute CRL to all servers

> **Note**: CRL implementation is beyond the scope of this basic setup. Contact a security professional for production CRL implementation.

---

## Certificate Renewal

Certificates are valid for 10 years. To renew before expiration:

### Option 1: Full Regeneration

```bash
cd /Users/yaqot/Documents/AMA-Order-System/certs
bash generate-certificates.sh
```

Then redistribute all certificates to employees.

### Option 2: Extend Existing Certificates

To extend the validity of existing certificates:

```bash
# Extend server certificate
openssl x509 -in server-cert.pem -days 3650 -out server-cert-renewed.pem \
    -signkey server-key.pem

# Replace old certificate
mv server-cert-renewed.pem server-cert.pem
```

> **Note**: This method only works for self-signed certificates.

---

## Troubleshooting

### Server Won't Start After Certificate Update

**Problem**: Server fails to start with certificate error.

**Solutions**:
1. Verify certificate files exist in `/server/certs/`:
   - `ca-cert.pem`
   - `server-cert.pem`
   - `server-key.pem`

2. Check file permissions:
   ```bash
   chmod 644 /Users/yaqot/Documents/AMA-Order-System/server/certs/*.pem
   ```

3. Verify certificate chain:
   ```bash
   openssl verify -CAfile ca-cert.pem server-cert.pem
   ```

### Employees Can't Access System

**Problem**: Employees get "Client certificate required" error.

**Solutions**:
1. Verify they installed **both** certificates (CA and employee)
2. Check certificate password is correct (`ama2024`)
3. Verify certificates are not expired:
   ```bash
   openssl x509 -in employee-cert.pem -noout -dates
   ```

### Certificate Not Trusted on iOS

**Problem**: iOS shows "Not Trusted" even after installation.

**Solutions**:
1. Verify employee enabled trust in Certificate Trust Settings
2. Check that CA certificate is installed
3. Restart the device

### "Certificate has expired" Error

**Problem**: Certificate expiration error.

**Solutions**:
1. Check certificate expiration date:
   ```bash
   openssl x509 -in employee-cert.pem -noout -enddate
   ```

2. If expired, generate new certificates (see Certificate Renewal)

---

## Security Best Practices

### Protect the CA Private Key

> **⚠️ CRITICAL**: The `ca-key.pem` file is the most sensitive file in your certificate infrastructure.

- **Never** distribute the CA private key
- **Never** commit it to version control
- Store it in a secure location with restricted access
- Consider encrypting it with a passphrase
- Back it up securely (encrypted backup)

### Rotate Certificates Regularly

- Review certificate expiration dates quarterly
- Plan renewal 90 days before expiration
- Test new certificates in development before production deployment

### Monitor Certificate Usage

- Log all certificate authentication attempts
- Review logs for suspicious activity
- Track which devices have which certificates

### Secure Certificate Distribution

- Use secure channels for distribution (HTTPS, AirDrop)
- Avoid email when possible
- Use unique passwords for each employee certificate (advanced)
- Confirm receipt and installation with employees

---

## Backup and Recovery

### Backup Certificates

Regularly backup all certificates:

```bash
# Create backup
tar -czf ama-certs-backup-$(date +%Y%m%d).tar.gz \
    /Users/yaqot/Documents/AMA-Order-System/certs/

# Store in secure location
mv ama-certs-backup-*.tar.gz /path/to/secure/backup/location/
```

### Restore from Backup

```bash
# Extract backup
tar -xzf ama-certs-backup-YYYYMMDD.tar.gz

# Copy to application directories
cd /Users/yaqot/Documents/AMA-Order-System/certs
cp ca-cert.pem server-cert.pem server-key.pem ../server/certs/
cp ca-cert.pem server-cert.pem server-key.pem ../ama-order-system-front/certs/
```

---

## Certificate Information Reference

### Current Certificate Details

- **CA Common Name**: AMA Root CA
- **Server Common Name**: AMA Order System Server
- **Employee Common Name**: AMA Employee Certificate
- **Organization**: AMA Company
- **Validity Period**: 10 years (3650 days)
- **Key Size**: 4096 bits
- **Algorithm**: RSA with SHA-256

### Server Certificate SANs

The server certificate includes the following Subject Alternative Names:
- `DNS:localhost`
- `IP:10.10.10.110`
- `IP:213.6.226.163`
- `IP:127.0.0.1`

This allows the certificate to be valid for all these addresses.

---

## Support

For additional help with certificate management:
- Review the `generate-certificates.sh` script for certificate generation details
- Consult OpenSSL documentation: https://www.openssl.org/docs/
- Contact a security professional for production deployments
