# AMA Order System - Security Implementation

## 🔐 Security Features

This system includes:
1. **SSL/TLS Encryption** - All connections are encrypted using HTTPS
2. **Multi-Domain SSL Certificates** - No browser warnings on configured endpoints

> **Note**: Client certificate authentication (mTLS) has been disabled. The system now uses standard HTTPS encryption with username/password authentication.

---

## 📋 Quick Start

### Accessing the Application

**No certificate installation required** - just access the URLs directly:
- **Production**: `https://10.10.10.110:5173` or `https://213.6.226.163:5173`
- **Development**: `https://10.10.10.110:5174` or `https://213.6.226.163:5174`

**Detailed Guides**:
- iOS: See [INSTALL_CERTIFICATE_IOS.md](INSTALL_CERTIFICATE_IOS.md)
- All Platforms: See [EMPLOYEE_CERTIFICATE_SETUP.md](EMPLOYEE_CERTIFICATE_SETUP.md)

---

## 🌐 Supported Endpoints

All endpoints require employee certificates:

### Frontend
- **Production**: `https://10.10.10.110:5174` or `https://213.6.226.163:5174`
- **Development**: `https://10.10.10.110:5173` or `https://213.6.226.163:5173`

### Backend
- **Production**: `https://10.10.10.110:3004` or `https://213.6.226.163:3004`
- **Development**: `https://10.10.10.110:5001` or `https://213.6.226.163:5001`

---

## 🔧 For IT Administrators

### Certificate Management

**Generate New Certificates**:
```bash
cd certs
bash generate-certificates.sh
```

**Distribute Certificates**:
- Web: `https://10.10.10.110:5174/install-employee-cert.html`
- AirDrop: Share `ca-cert.crt` and `employee-cert.p12`
- Email: Send certificates with password `ama2024`

**Management Guide**: See [CERTIFICATE_MANAGEMENT.md](CERTIFICATE_MANAGEMENT.md)

### Certificate Files

| File | Purpose | Distribute? |
|------|---------|-------------|
| `ca-cert.pem` / `ca-cert.crt` | CA certificate | ✅ Yes |
| `ca-key.pem` | CA private key | ❌ **NEVER** |
| `server-cert.pem` | Server certificate | Public |
| `server-key.pem` | Server private key | ❌ Keep secure |
| `employee-cert.p12` | Employee certificate | ✅ Yes |
| `employee-key.pem` | Employee private key | ✅ Yes |

### Start Servers

**Backend**:
```bash
cd server
npm start
```

**Frontend**:
```bash
cd ama-order-system-front
npm run dev    # Development
npm run build  # Production
```

---

## 📚 Documentation

- **[EMPLOYEE_CERTIFICATE_SETUP.md](EMPLOYEE_CERTIFICATE_SETUP.md)** - Employee installation guide (all platforms)
- **[INSTALL_CERTIFICATE_IOS.md](INSTALL_CERTIFICATE_IOS.md)** - iOS-specific guide
- **[CERTIFICATE_MANAGEMENT.md](CERTIFICATE_MANAGEMENT.md)** - IT administrator guide
- **[install-employee-cert.html](ama-order-system-front/public/install-employee-cert.html)** - Interactive installation page

---

## 🔍 Troubleshooting

### Common Issues

| Error | Solution |
|-------|----------|
| "Client certificate required" | Install employee certificate (employee-cert.p12) |
| "Invalid client certificate" | Check password is `ama2024` |
| "Certificate expired" | Contact IT for new certificate |
| iOS "Load Failed" | Enable trust in Certificate Trust Settings |

### Get Help

- Employees: See [EMPLOYEE_CERTIFICATE_SETUP.md](EMPLOYEE_CERTIFICATE_SETUP.md)
- IT: See [CERTIFICATE_MANAGEMENT.md](CERTIFICATE_MANAGEMENT.md)

---

## ⚠️ Security Notes

### Critical

- **NEVER** distribute `ca-key.pem` or `server-key.pem`
- Keep employee certificates secure
- Report lost/stolen devices immediately

### Certificate Validity

- **Period**: 10 years
- **Renewal**: Contact IT 90 days before expiration

---

## 📊 Certificate Details

- **CA**: AMA Root CA
- **Organization**: AMA Company
- **Key Size**: 4096-bit RSA
- **Algorithm**: SHA-256
- **Validity**: 3650 days (10 years)

### Server Certificate SANs

- `DNS:localhost`
- `IP:10.10.10.110`
- `IP:213.6.226.163`
- `IP:127.0.0.1`

---

## 🚀 Deployment Checklist

- [ ] Distribute CA certificate to all employees
- [ ] Distribute employee certificate to all employees
- [ ] Verify employees can install certificates
- [ ] Restart backend server
- [ ] Restart frontend server
- [ ] Test access with employee certificates
- [ ] Verify devices without certificates are blocked
- [ ] Monitor server logs for issues

---

## 📞 Support

For assistance:
1. Check documentation above
2. Review troubleshooting sections
3. Contact IT support with:
   - Device type
   - Error message
   - Screenshots

---

**Last Updated**: 2025-11-27  
**Certificate Expiration**: 2035-11-27 (10 years)
