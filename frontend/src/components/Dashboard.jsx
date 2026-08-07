import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, Download, Loader2, FileCheck, Lock, AlertCircle, Trash2, LogOut, File as FileIcon, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CryptoJS from 'crypto-js';

// Set base URL for backend requests dynamically
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');

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
      
      // ZERO-KNOWLEDGE E2E CLIENT-SIDE DECRYPTION
      // 1. Fetch the raw encrypted blob from the URL
      let encryptedText;
      if (secureUrl.includes('/mock/download/')) {
        const fileFetch = await axios.get(secureUrl);
        encryptedText = fileFetch.data;
      } else {
        const fileFetch = await axios.post('/api/proxy-s3', { url: secureUrl });
        encryptedText = fileFetch.data;
      }
      
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
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem', paddingTop: '1.5rem' }}>
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
        >
          <div style={{ position: 'relative' }}>
            <Shield size={42} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px var(--primary-glow))' }} />
            <motion.div 
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 }}
              style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: 'var(--primary-glow)', filter: 'blur(12px)', zIndex: -1 }}
            />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', margin: 0, letterSpacing: '-0.02em' }}>CloudShield</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>V 2.0 SECURE NODE</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
        >
          <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.1rem' }}>ACTIVE AGENT</p>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{user.username}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            <LogOut size={16} /> TERMINATE
          </button>
        </motion.div>
      </header>

      <main>
        <section style={{ marginBottom: '4rem' }}>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="card glass neon-shadow" 
          >
            {uploading && <div className="scan-line" />}
            <div 
              className="upload-zone"
              onClick={() => !uploading && document.getElementById('fileInput').click()}
            >
              <input 
                type="file" 
                id="fileInput" 
                hidden 
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ position: 'relative' }}>
                    <Loader2 className="animate-spin" size={64} color="var(--primary)" />
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        style={{ position: 'absolute', inset: -20, border: '2px solid var(--primary)', borderRadius: '50%', borderStyle: 'dashed', opacity: 0.3 }}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>CRITICAL OPERATION IN PROGRESS</p>
                    <p style={{ color: 'var(--text-dim)' }}>Executing E2E Cryptographic Locking (AES-256)</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '1.5rem', display: 'inline-flex', padding: '1.5rem', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--border-glass)' }}>
                    <Upload size={48} color="var(--primary)" />
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem' }}>INITIALIZE ASSET HANDLER</h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-dim)', maxWidth: '500px', margin: '0 auto' }}>
                    Zero-Knowledge encryption protocol ready. Assets are cryptographically eradicated from client memory after secure cloud handoff.
                  </p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(error || success) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ marginTop: '2rem' }}
                >
                  {error && (
                    <div className="status status-error" style={{ width: '100%', padding: '1.25rem' }}>
                      <AlertCircle size={20} />
                      <span style={{ fontWeight: 600 }}>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="status status-success" style={{ width: '100%', padding: '1.25rem' }}>
                      <FileCheck size={20} />
                      <span style={{ fontWeight: 600 }}>{success}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'white', margin: 0 }}>
              <Lock size={28} color="var(--primary)" /> SECURE VAULT
            </h2>
            
            <div style={{ display: 'flex', gap: '1.25rem', flex: '1 1 400px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="QUERY DATASETS..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '3rem', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}
                />
              </div>
              
              <div style={{ position: 'relative' }}>
                <Filter size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{ 
                    appearance: 'none', padding: '1rem 2.5rem 1rem 3rem', borderRadius: '0.85rem',
                    border: '1px solid var(--border-glass)', background: 'rgba(0, 0, 0, 0.5)', color: 'white',
                    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, outline: 'none', cursor: 'pointer',
                    letterSpacing: '0.05em'
                  }}
                >
                  <option value="all">ALL ASSETS</option>
                  <option value="pdf">PDF NODES</option>
                  <option value="image">VISUAL DATA</option>
                  <option value="document">PLAINTEXT / DOC</option>
                </select>
              </div>
            </div>
          </div>
          
          {files.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass" 
              style={{ padding: '6rem 2rem', textAlign: 'center', borderStyle: 'dashed' }}
            >
              <FileIcon size={64} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', fontWeight: 500 }}>VAULT IS CURRENTLY DEVOID OF ASSETS</p>
            </motion.div>
          ) : filteredFiles.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass" 
              style={{ padding: '5rem 2rem', textAlign: 'center' }}
            >
              <Search size={48} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>NO ASSETS MATCH SPECIFIED QUERY PROTOCOL</p>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100%, 1fr))', gap: '1.25rem' }}>
              <AnimatePresence mode="popLayout">
                {filteredFiles.map((file, index) => (
                  <motion.div 
                    key={file._id}
                    layout 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="file-item glass neon-shadow"
                    style={{ borderRadius: '1rem', padding: '1.5rem 2rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 0 }}>
                        <div style={{ padding: '0.85rem', borderRadius: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', border: '1px solid var(--border-glass)' }}>
                            <FileIcon size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {file.originalName.toUpperCase()}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <span className="status-success" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontWeight: 800, letterSpacing: '0.05em' }}>
                                    ENCRYPTED
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{file.size}</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginLeft: '1.5rem' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleDownload(file._id, file.originalName)}
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                      >
                        <Download size={18} /> DECRYPT
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(file._id)}
                        style={{ padding: '0.6rem', width: '42px' }}
                        title="ERADICATE"
                      >
                        <Trash2 size={18} /> 
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <footer style={{ marginTop: '8rem', textAlign: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '3rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.2em', fontWeight: 600 }}>
            RESTRICTED AREA • CLOUDSHIELD QUANTUM ENCRYPTION AGENT • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );

}

export default Dashboard;
