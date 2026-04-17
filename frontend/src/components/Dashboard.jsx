import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, Download, Loader2, FileCheck, Lock, AlertCircle, Trash2, LogOut, File as FileIcon, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// Set base URL for backend requests
axios.defaults.baseURL = 'http://localhost:5000';

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // New States for Search and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userVaultKey = user._id ? (user._id + user.email) : 'default-fallback-key'; // Symmetrical Derivation Key

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      fetchFiles(token);
    }
  }, [navigate]);

  const fetchFiles = async (token) => {
    try {
      const response = await axios.get('/api/files', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(response.data);
    } catch (err) {
      console.error('Fetch Error:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      } else {
        setError('Connection to secure vault compromised. Check server status.');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const rawFile = event.target.files[0];
    if (!rawFile) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    // ZERO-KNOWLEDGE E2E CLIENT-SIDE ENCRYPTION (AES-256)
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const fileDataString = e.target.result;
        
        // Encrypt the raw data file via CryptoJS locally in browser
        const encryptedBase64Chunk = CryptoJS.AES.encrypt(fileDataString, userVaultKey).toString();
        const encryptedBlob = new Blob([encryptedBase64Chunk], { type: 'application/octet-stream' });
        
        const formData = new FormData();
        // Server only ever sees the encrypted AES blob.
        formData.append('file', encryptedBlob, rawFile.name);

        const token = localStorage.getItem('token');
        const response = await axios.post('/api/files/upload', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });

        const uploadedFile = response.data.file;
        setFiles(prev => [uploadedFile, ...prev]);
        setSuccess('Asset E2E encrypted and locked safely in vault!');
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 401) {
          handleLogout();
        } else {
          setError(err.response?.data?.error || 'E2E Encryption/Upload procedure failed.');
        }
      } finally {
        setUploading(false);
        event.target.value = null; // reset
      }
    };
    // Initialize standard DataURL processing for AES conversion
    reader.readAsDataURL(rawFile);
  };

  const handleDownload = async (fileId, fileName) => {
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/files/download', { fileId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const secureUrl = response.data.url;
      
      // If we are in MOCK mode, open directly
      if (secureUrl.includes('/mock/download/')) {
        window.open(secureUrl, '_blank');
        return;
      }
      
      // ZERO-KNOWLEDGE E2E CLIENT-SIDE DECRYPTION
      // 1. Fetch the raw encrypted blob from the S3 pre-signed URL (via backend CORS proxy)
      const fileFetch = await axios.post('/api/proxy-s3', { url: secureUrl });
      const encryptedText = fileFetch.data;
      
      // 2. Decrypt locally using the symmetrical user key
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedText, userVaultKey);
      const originalDataUrl = decryptedBytes.toString(CryptoJS.enc.Utf8);
      
      if (!originalDataUrl) {
         throw new Error("Local decryption failed. Bad integrity check.");
      }

      // 3. Re-assemble into a downloadable local a-tag mechanism
      const link = document.createElement('a');
      link.href = originalDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Detailed Decryption Error:', err);
      // Give the exact system error to see if it's CORS, Network, or Malformed UTF8
      setError(`Decryption Error: ${err.message || 'Unknown Network/Crypto failure'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("CRITICAL WARNING: This completely destroys the encrypted asset. Proceed?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/files/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFiles(prev => prev.filter(file => file._id !== id));
      setSuccess('Asset completely destroyed and eradicated from cloud.');
    } catch (err) {
      setError('Eradication sequence failed. Contact admin.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Derived state for Search & Filter
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      // Name match
      const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type match (mimeType checking)
      let matchesType = true;
      if (filterType === 'image') {
        matchesType = file.mimeType.startsWith('image/');
      } else if (filterType === 'pdf') {
        matchesType = file.mimeType === 'application/pdf';
      } else if (filterType === 'document') {
        matchesType = file.mimeType.includes('officedocument') || file.mimeType.includes('msword') || file.mimeType.includes('text');
      }

      return matchesSearch && matchesType;
    });
  }, [files, searchTerm, filterType]);



  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', marginTop: '1rem' }}>
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <Shield size={36} color="var(--primary)" filter="drop-shadow(0 0 10px rgba(99,102,241,0.5))" />
          <h1 style={{ fontSize: '1.75rem', margin: 0 }}>CloudShield</h1>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Agent <strong style={{ color: 'white' }}>{user.username}</strong></span>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
            <LogOut size={16} /> Disconnect
          </button>
        </motion.div>
      </header>

      <main>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card glass neon-shadow" 
          style={{ marginBottom: '2.5rem' }}
        >
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
                <Loader2 className="animate-spin" size={48} color="var(--primary)" />
                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Executing AES-256 Encryption & Upload...</p>
              </div>
            ) : (
              <div>
                <Upload size={48} color="var(--primary)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'white' }}>Engage file drop sequence</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Assets are encrypted server-side and cryptographically locked to Admin clearance.
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
                className="status status-error" 
                style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}
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
                className="status status-success" 
                style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}
              >
                <FileCheck size={20} />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* --- SEARCH AND FILTER UI INJECTED HERE --- */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', margin: 0 }}>
              <Lock size={22} color="var(--primary)" /> Encrypted Operations Vault
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', flex: '1 1 auto', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Query assets..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem', background: 'rgba(0,0,0,0.4)' }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <Filter size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ 
                    appearance: 'none', padding: '0.875rem 2rem 0.875rem 2.5rem', borderRadius: '0.75rem',
                    border: '1px solid var(--border-glass)', background: 'rgba(0, 0, 0, 0.4)', color: 'white',
                    fontFamily: 'inherit', fontSize: '1rem', outline: 'none', cursor: 'pointer'
                  }}
                >
                  <option value="all">All Assets</option>
                  <option value="pdf">PDFs</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                </select>
              </div>
            </div>
          </div>
          
          {files.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass" 
              style={{ padding: '4rem 2rem', textAlign: 'center' }}
            >
              <FileIcon size={48} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Operations Vault is completely empty.</p>
            </motion.div>
          ) : filteredFiles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass" 
              style={{ padding: '3rem 2rem', textAlign: 'center' }}
            >
              <Search size={36} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No assets match your query.</p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {filteredFiles.map((file, index) => (
                  <motion.div 
                    key={file._id}
                    layout // This enables smooth repositioning
                    initial={{ scale: 0.95, opacity: 0, x: -20 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: index * 0.05 }}
                    className="file-item glass"
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: '1rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {file.originalName}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span className="status status-success" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', border: 'none' }}>
                          <Shield size={10} style={{marginRight: 2}} /> Secured
                        </span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleDownload(file._id, file.originalName)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        <Download size={16} /> 
                        Generate Key Link
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(file._id)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        title="Eradicate Asset"
                      >
                        <Trash2 size={16} /> 
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <footer style={{ marginTop: '5rem', textAlign: 'center', opacity: 0.3, fontSize: '0.85rem' }}>
        <p>RESTRICTED ACCESS. All operations are monitored through JWT authentication protocols.</p>
      </footer>
    </div>
  );
}

export default Dashboard;
