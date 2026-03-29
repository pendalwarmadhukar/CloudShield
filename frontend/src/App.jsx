import React, { useState, useEffect } from 'react'
import { Shield, Upload, Download, Loader2, FileCheck, Lock, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Set base URL for axios
axios.defaults.baseURL = 'http://localhost:5000'

function App() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Fetch file list from MongoDB via backend
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await axios.get('/api/files')
      setFiles(response.data)
    } catch (err) {
      console.error('Fetch Error:', err)
      setError('Could not sync with secure vault. Please check your connection.')
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // Update state with the new file from MongoDB
      const uploadedFile = response.data.file
      setFiles(prev => [uploadedFile, ...prev])
      setSuccess('File uploaded and encrypted successfully!')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Failed to connect to secure server. Check AWS credentials.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (fileKey) => {
    try {
      const response = await axios.post('/api/download-link', { fileKey })
      window.open(response.data.url, '_blank')
    } catch (err) {
      setError('Failed to generate secure link. Link may have expired or permissions denied.')
    }
  }

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Shield size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
          <h1>CloudShield</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Secure, Encrypted, Professional File Storage</p>
        </motion.div>
      </header>

      <main>
        <div className="card glass neon-shadow" style={{ marginBottom: '2rem' }}>
          <div 
            className="upload-zone"
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              hidden 
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={40} color="#6366f1" />
                <p>Encrypting & Uploading...</p>
              </div>
            ) : (
              <div>
                <Upload size={40} color="rgba(255,255,255,0.3)" style={{ marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Click to select a secure file</p>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
                  Files are encrypted server-side using AWS KMS
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="status" 
                style={{ color: '#ef4444', marginTop: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}
              >
                <AlertCircle size={20} />
                <span>{error}</span>
              </motion.div>
            )}
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="status status-secure" 
                style={{ marginTop: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}
              >
                <FileCheck size={20} />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="file-list-section">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} /> Secure Vault
          </h2>
          
          {files.length === 0 ? (
            <div className="glass" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
              <p>No secure files found in your vault.</p>
            </div>
          ) : (
            <div className="file-list">
              <AnimatePresence>
                {files.map((file, index) => (
                  <motion.div 
                    key={file._id}
                    layout
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="file-item glass"
                  >
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{file.originalName}</p>
                      <div className="status status-secure" style={{ fontSize: '0.75rem', gap: '0.25rem' }}>
                        <Shield size={12} />
                        <span>KMS Encrypted</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.5rem' }}>|</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(file.uploadedAt).toLocaleString()}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0.5rem' }}>|</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{file.size}</span>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleDownload(file.s3Key)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      <Download size={16} /> 
                      Secure Link
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
        <p>&copy; 2026 CloudShield Infrastructure. All data is protected by AWS Identity and Access Management.</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  )
}

export default App
