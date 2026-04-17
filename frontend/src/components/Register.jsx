import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('/api/auth/register', { username, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ _id: data._id, username: data.username, email: data.email }));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Shield size={64} color="var(--primary)" style={{ marginBottom: '1.25rem', filter: 'drop-shadow(0 0 15px var(--primary-glow))' }} />
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1] }}
              transition={{ repeat: Infinity, duration: 4 }}
              style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: 'var(--primary-glow)', filter: 'blur(20px)', zIndex: -1 }}
            />
          </div>
          <h1 style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }}>Secure Onboarding</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Initialize your encrypted agent credentials</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="card glass neon-shadow"
        >
          <div className="scan-line" />
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>AGENT ALIAS</label>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unique Identifier"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>SECURE EMAIL</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@cloudshield.node"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em' }}>MASTER PASSWORD</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Cipher Key"
                minLength={6}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="status status-error" 
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'INITIALIZE CLEARANCE'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Already authorized? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, marginLeft: '0.5rem' }}>Engage Login</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );

}

export default Register;
