#!/bin/bash

# Certificate Generation Script for AMA Order System
# This script generates:
# 1. CA (Certificate Authority) certificate
# 2. Server certificate with multiple SANs (Subject Alternative Names)
# 3. Employee client certificates for mTLS authentication

set -e

CERT_DIR="$(cd "$(dirname "$0")" && pwd)"
VALIDITY_DAYS=3650  # 10 years

echo "==================================="
echo "AMA Order System - Certificate Generation"
echo "==================================="
echo "Certificate directory: $CERT_DIR"
echo "Validity period: $VALIDITY_DAYS days (10 years)"
echo ""

# Clean up old certificates
echo "Cleaning up old certificates..."
rm -f "$CERT_DIR"/*.pem "$CERT_DIR"/*.crt "$CERT_DIR"/*.key "$CERT_DIR"/*.srl "$CERT_DIR"/*.csr

# 1. Generate CA (Certificate Authority)
echo ""
echo "Step 1: Generating CA certificate..."
openssl genrsa -out "$CERT_DIR/ca-key.pem" 4096

openssl req -new -x509 -days $VALIDITY_DAYS -key "$CERT_DIR/ca-key.pem" \
    -out "$CERT_DIR/ca-cert.pem" \
    -subj "/C=US/ST=State/L=City/O=AMA Company/OU=IT Department/CN=AMA Root CA"

echo "✓ CA certificate generated: ca-cert.pem"

# 2. Generate Server Certificate with SANs
echo ""
echo "Step 2: Generating server certificate with multiple SANs..."

# Create OpenSSL config for SAN
cat > "$CERT_DIR/server-cert.conf" <<EOF
[req]
default_bits = 4096
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=AMA Company
OU=IT Department
CN=AMA Order System Server

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = amaorders.work
IP.1 = 10.10.10.110
IP.2 = 213.6.226.163
IP.3 = 127.0.0.1
EOF

# Generate server private key
openssl genrsa -out "$CERT_DIR/server-key.pem" 4096

# Generate server CSR (Certificate Signing Request)
openssl req -new -key "$CERT_DIR/server-key.pem" \
    -out "$CERT_DIR/server-cert.csr" \
    -config "$CERT_DIR/server-cert.conf"

# Sign server certificate with CA
openssl x509 -req -in "$CERT_DIR/server-cert.csr" \
    -CA "$CERT_DIR/ca-cert.pem" \
    -CAkey "$CERT_DIR/ca-key.pem" \
    -CAcreateserial \
    -out "$CERT_DIR/server-cert.pem" \
    -days $VALIDITY_DAYS \
    -extensions v3_req \
    -extfile "$CERT_DIR/server-cert.conf"

echo "✓ Server certificate generated: server-cert.pem"

# 3. Generate Employee Client Certificate
echo ""
echo "Step 3: Generating employee client certificate..."

# Generate employee private key
openssl genrsa -out "$CERT_DIR/employee-key.pem" 4096

# Generate employee CSR
openssl req -new -key "$CERT_DIR/employee-key.pem" \
    -out "$CERT_DIR/employee-cert.csr" \
    -subj "/C=US/ST=State/L=City/O=AMA Company/OU=Employees/CN=AMA Employee Certificate"

# Sign employee certificate with CA
openssl x509 -req -in "$CERT_DIR/employee-cert.csr" \
    -CA "$CERT_DIR/ca-cert.pem" \
    -CAkey "$CERT_DIR/ca-key.pem" \
    -CAcreateserial \
    -out "$CERT_DIR/employee-cert.pem" \
    -days $VALIDITY_DAYS

echo "✓ Employee certificate generated: employee-cert.pem"

# 4. Create .p12 file for iOS installation (combines cert + key)
echo ""
echo "Step 4: Creating .p12 file for iOS installation..."
openssl pkcs12 -export \
    -out "$CERT_DIR/employee-cert.p12" \
    -inkey "$CERT_DIR/employee-key.pem" \
    -in "$CERT_DIR/employee-cert.pem" \
    -certfile "$CERT_DIR/ca-cert.pem" \
    -passout pass:ama2024

echo "✓ Employee .p12 certificate created: employee-cert.p12 (password: ama2024)"

# 5. Convert CA cert to .crt format for easier iOS installation
echo ""
echo "Step 5: Converting CA certificate to .crt format..."
openssl x509 -in "$CERT_DIR/ca-cert.pem" -out "$CERT_DIR/ca-cert.crt" -outform DER

echo "✓ CA certificate converted: ca-cert.crt"

# 6. Clean up temporary files
echo ""
echo "Cleaning up temporary files..."
rm -f "$CERT_DIR"/*.csr "$CERT_DIR"/*.srl "$CERT_DIR/server-cert.conf"

# 7. Display certificate information
echo ""
echo "==================================="
echo "Certificate Generation Complete!"
echo "==================================="
echo ""
echo "Generated certificates:"
echo "  CA Certificate:       ca-cert.pem / ca-cert.crt"
echo "  CA Private Key:       ca-key.pem (KEEP SECURE!)"
echo "  Server Certificate:   server-cert.pem"
echo "  Server Private Key:   server-key.pem"
echo "  Employee Certificate: employee-cert.pem"
echo "  Employee Private Key: employee-key.pem"
echo "  Employee .p12:        employee-cert.p12 (password: ama2024)"
echo ""
echo "Server certificate includes SANs for:"
openssl x509 -in "$CERT_DIR/server-cert.pem" -text -noout | grep -A1 "Subject Alternative Name" || echo "  (Check manually with: openssl x509 -in server-cert.pem -text -noout)"
echo ""
echo "Next steps:"
echo "  1. Copy server certificates to server/certs/ and frontend/certs/"
echo "  2. Distribute ca-cert.crt and employee-cert.p12 to employee devices"
echo "  3. Update server and frontend configurations"
echo ""
