<p align="center">
  <img src="C:\Users\madhu\.gemini\antigravity\brain\d62e6914-7fe7-41d1-a553-3f7e12153049\cloudshield_cyber_banner_1774788125297.png" width="800" alt="CloudShield Banner">
</p>

<p align="center">
  <h1 align="center">🔐 CLOUDSHIELD: ENTERPRISE SECURITY</h1>
  <p align="center">
    <b>A High-Performance Cybersecurity File Vault with AWS KMS & S3 Integration</b>
    <br />
    <br />
    <a href="https://linkedin.com/in/pendalwar-sainath-598169349">
      <img src="https://img.shields.io/badge/LINKEDIN-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="linkedin">
    </a>
    <a href="mailto:24j45a6720@mallareddyuniversity.ac.in">
      <img src="https://img.shields.io/badge/GMAIL-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="gmail">
    </a>
    <a href="https://github.com/Sainath9391">
      <img src="https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white" alt="github">
    </a>
    <a href="https://instagram.com">
      <img src="https://img.shields.io/badge/INSTAGRAM-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="instagram">
    </a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Project_Status-Shield_Active-00FF00?style=flat-square" alt="Shield Status">
  <img src="https://img.shields.io/badge/Security-KMS_Encrypted-6366f1?style=flat-square" alt="Encryption Status">
  <img src="https://img.shields.io/badge/Infrastructure-AWS_S3-FF9900?style=flat-square" alt="Infrastructure">
</p>

---

## 👨‍💻 Project Infrastructure

<table align="center">
  <tr>
    <td width="50%" valign="top">
      <h3>🛡️ Security Protocols</h3>
      <ul>
        <li><b>Algorithm:</b> AES-256-GCM (Hardware-Backed)</li>
        <li><b>Keys:</b> Symmetric Multi-Region AWS KMS</li>
        <li><b>Access:</b> IAM Policy (Strictly Scoped)</li>
        <li><b>Transport:</b> TLS 1.3 / S3 Pre-signed URLs</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🏗️ Tech Stack</h3>
      <ul>
        <li><b>Frontend:</b> React 19 + Framer Motion</li>
        <li><b>Backend:</b> Node.js + Express + Multer</li>
        <li><b>Cloud:</b> AWS S3 & AWS KMS (SDK v3)</li>
        <li><b>Database:</b> MongoDB Atlas (Mongoose)</li>
      </ul>
    </td>
  </tr>
</table>

### 🔒 Core Cybersecurity Architecture

```mermaid
graph TD
    A[Public Web Client] -- Multipart-Upload --> B[Secure Backend Node]
    B -- Generate Request --> C((AWS KMS))
    C -- Data Key --> B
    B -- Encrypt @ Rest --> D{AWS S3 Vault}
    D -- 15m Expire Link --> A
    subgraph "Zero-Trust Environment"
    B
    C
    D
    end
    style D fill:#6366f1,stroke:#fff,stroke-width:2px
    style C fill:#FF9900,stroke:#fff,stroke-width:2px
```

---

## ⚡ Quick Start Deployment

### 🧪 Cyber-Security Sandbox (Mock Mode)
Test the full logic without active AWS credentials.
```bash
# Set MOCK_AWS=true in .env
cd backend && npm start
cd frontend && npm run dev
```

### 🛡️ Production Hardening
```env
MOCK_AWS=false
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-private-vault
KMS_KEY_ID=your-fips-140-key
```

---
<p align="center">
  © 2026 <b>CloudShield Security Labs</b>. Protected by <b>AWS Identity and Access Management</b>.
</p>
