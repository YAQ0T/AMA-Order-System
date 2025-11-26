#!/bin/bash

# Directory for certs
CERT_DIR="/Users/yaqot/Documents/AMA Order System/server/certs"
mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

echo "🔐 Generating mTLS Certificates..."

# 1. Create a Private Certificate Authority (CA)
if [ ! -f "ca-key.pem" ]; then
    echo "Creating CA Private Key..."
    openssl genrsa -out ca-key.pem 4096
fi

if [ ! -f "ca-cert.pem" ]; then
    echo "Creating CA Certificate..."
    openssl req -new -x509 -sha256 -days 3650 -key ca-key.pem -out ca-cert.pem -subj "/C=PS/ST=Nablus/L=Nablus/O=AMA Systems/OU=IT/CN=AMA Root CA"
fi

# 2. Generate Client Certificate
CLIENT_NAME="ama-employee"
if [ ! -f "client-key.pem" ]; then
    echo "Creating Client Private Key..."
    openssl genrsa -out client-key.pem 4096
fi

if [ ! -f "client-req.pem" ]; then
    echo "Creating Client Certificate Request..."
    openssl req -new -key client-key.pem -out client-req.pem -subj "/C=PS/ST=Nablus/L=Nablus/O=AMA Systems/OU=Employees/CN=$CLIENT_NAME"
fi

if [ ! -f "client-cert.pem" ]; then
    echo "Signing Client Certificate with CA..."
    openssl x509 -req -in client-req.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out client-cert.pem -days 3650 -sha256
fi

# 3. Package Client Cert into .p12 (for browser/mobile installation)
# We'll use a simple password "123456" for import convenience, user can change it later if needed
EXPORT_PASS="123456"
if [ ! -f "ama-access.p12" ]; then
    echo "Packaging Client Certificate into .p12 file..."
    openssl pkcs12 -export -out ama-access.p12 -inkey client-key.pem -in client-cert.pem -certfile ca-cert.pem -passout pass:$EXPORT_PASS
    echo "✅ Created 'ama-access.p12' (Password: $EXPORT_PASS)"
fi

echo "🎉 All certificates generated in $CERT_DIR"
echo "👉 CA Cert: ca-cert.pem (Load this in server)"
echo "👉 Client Bundle: ama-access.p12 (Send this to employees)"
