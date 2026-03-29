# 🛡️ CloudShield: Enterprise-Grade Secure File Vault

**CloudShield** is a cybersecurity-focused file storage solution designed to provide maximum confidentiality and integrity for sensitive data. It implementes a **Zero-Trust architecture** by leveraging **AWS Key Management Service (KMS)** for hardware-backed encryption and **S3 Pre-signed URLs** for time-bound, secure access.

---

## 🔒 Security Architecture

CloudShield is built on the principle of **Defense-in-Depth**. Below are the core security pillars implemented in this project:

### 1. Encryption-at-Rest (AES-256-GCM)
Every file uploaded is encrypted server-side using **AWS KMS**.
- **Envelop Encryption**: A unique data key is generated for every object.
- **Hardware Security Modules (HSM)**: Keys are managed in FIPS 140-2 Level 3 validated hardware.
- **Automatic Rotation**: Supports KMS key rotation policies.

### 2. Secure Access Control (Least Privilege)
The system operates under the **Principle of Least Privilege (PoLP)**:
- **Zero Public Access**: The S3 bucket is strictly private; no public ACLs or bucket policies are allowed.
- **IAM Scoping**: The backend uses an IAM user with a strictly scoped policy (only `s3:PutObject` and `s3:GetObject`).
- **Temporary Authorization**: Users do not access S3 directly. The backend generates **Pre-signed URLs** that expire automatically after 15 minutes.

### 3. Data Integrity & Metadata Security
- **Secure Hash Tracking**: File metadata is indexed in a secured MongoDB instance.
- **MIME-Type Validation**: Strict validation of file types during the upload process to prevent malicious script injection.

---

## 🚀 Deployment & Testing

### 🧪 Cyber-Security Sandbox (Mock Mode)
For security researchers and developers who want to test the architecture without active AWS costs:

1.  **Configure Environment**: Set `MOCK_AWS=true` in `backend/.env`.
2.  **Run Sandbox**: `npm start` (Backend) and `npm run dev` (Frontend).
3.  **Observation**: All encryption calls are mocked, but the metadata flow mirrors the production security logic.

### 🛡️ Production Hardening
To deploy in a real-world secure environment:

1.  **IAM Policy**: Apply the least-privilege policy found in `README.md`.
2.  **S3 Hardening**: Enable "Block all public access" and "Bucket Versioning".
3.  **KMS Configuration**: Create a symmetric encryption key and grant the IAM user `kms:Encrypt` and `kms:Decrypt` permissions.

---

## 🛠️ Configuration (.env)

```env
# Security Switch
MOCK_AWS=true # Set to false for Production Hardening

# AWS Security Infrastructure
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-private-vault
KMS_KEY_ID=your-hsm-key-id

# Database Security
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/CloudShield
```

---

## 🏗️ Technical Stack
- **Backend API**: Node.js / Express (Security-hardened headers with Morgan).
- **Frontend UI**: React / Vite (State-driven security feedback).
- **Security Provider**: AWS SDK v3 (Modular & Secure).
- **Persistence**: MongoDB Atlas (Encrypted-at-rest).

---

## ⚖️ Disclaimer
*This project is intended for educational purposes in the field of Cybersecurity. Always perform a comprehensive security audit before using this architecture for highly sensitive production data.*

---
© 2026 CloudShield Security Labs. Infrastructure protected by AWS IAM & KMS.
