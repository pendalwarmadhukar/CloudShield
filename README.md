# 🔐 CloudShield: Secure File Storage System

CloudShield is a premium, secure file storage application that leverages **AWS S3** for industry-standard storage and **AWS KMS** for advanced server-side encryption. This project demonstrates modern cloud security practices, including pre-signed URLs, IAM least privilege, and server-side encryption.

---

## ✨ Features
- **🚀 Advanced Security**: All files are encrypted at rest using AWS KMS (Key Management Service).
- **🛡️ Secure Access**: Temporary pre-signed URLs that expire after 15 minutes, ensuring zero public access to your bucket.
- **☁️ AWS Integration**: Native integration with S3 and KMS for professional-grade cloud storage.
- **📦 MongoDB Indexing**: Persistent storage of file metadata for lightning-fast retrieval.
- **🧪 Development Mock Mode**: Full functionality testing without needing real AWS credentials.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+) & **npm**
- **MongoDB** (Atlas or Local)
- **AWS Account** (Required for production mode only)

### 2. Quick Start (Mock Mode)
If you want to test the application immediately without setting up AWS, use **Mock Mode**:

1. Clone the repository and navigate to the `backend/` directory.
2. Create a `.env` file and set `MOCK_AWS=true`.
3. Fill in your `MONGODB_URI`.
4. Run `npm start`.

### 3. Production AWS Setup
1. Create an **S3 Bucket** (Block all public access).
2. Create a **KMS Key** in the AWS Key Management Service (Symmetric, Encrypt/Decrypt).
3. Create an **IAM User** with the following policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       },
       {
         "Effect": "Allow",
         "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
         "Resource": "arn:aws:kms:region:account-id:key/your-key-id"
       }
     ]
   }
   ```

---

## 🛠️ Configuration (.env)

Navigate to the `backend/` directory and configure your `.env` file:

```env
# Server Settings
PORT=5000
MOCK_AWS=true # Set to false to use real AWS S3/KMS

# Database
MONGODB_URI=your_mongodb_connection_string

# AWS Credentials (Required if MOCK_AWS=false)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
KMS_KEY_ID=your_kms_key_id
```

---

## 💻 Running the Application

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Tech Stack
- **Frontend**: React, Vite, Framer Motion, Axios, Lucide Icons.
- **Backend**: Node.js, Express, Multer, Morgan, Dotenv.
- **Database**: MongoDB (Mongoose).
- **Cloud**: AWS S3 & AWS KMS (SDK v3).

---

## 🔒 Security Principles
- **Encryption at Rest**: Every file is encrypted server-side with a unique KMS key.
- **Least Privilege Access**: backend uses IAM credentials to perform specific tasks without exposing the bucket.
- **Time-Bound Links**: Secure links are generated on-the-fly and expire automatically to prevent unauthorized sharing.
- **Zero Public Access**: The S3 bucket remains strictly private; no direct internet access is permitted.

---
© 2026 CloudShield Infrastructure. All data is protected by AWS Identity and Access Management.
