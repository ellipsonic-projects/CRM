'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Orbit } from 'lucide-react';
import { resetPassword } from '../../services/auth.api';
import PasswordInput from '../../components/form/PasswordInput';
import styles from '../auth.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    const storedToken = sessionStorage.getItem('resetToken');
    
    if (!storedEmail || !storedToken) {
      router.replace('/forgot-password');
    } else {
      setEmail(storedEmail);
      setToken(storedToken);
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !token) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setError('Password must be between 8 and 16 characters.');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await resetPassword({ email, token, newPassword });
      setSuccess(true);
      sessionStorage.removeItem('resetEmail');
      sessionStorage.removeItem('resetToken');
      
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Invalid or expired token.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) return null;

  if (success) {
    return (
      <main className={styles.authPage}>
        <div className={styles.authShell} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 0 }}>
          <div className={styles.formCard} style={{ maxWidth: '440px', width: '100%', textAlign: 'center' }}>
            <div className={styles.formHeader} style={{ justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px' }}>Success</h1>
                <p>Password reset successfully.</p>
              </div>
            </div>
            
            <p style={{ marginTop: '20px', color: '#94a3b8' }}>
              You will be redirected to the login page momentarily.
            </p>

            <button
              className={`${styles.primaryButton} ${styles.fullButton}`}
              onClick={() => router.push('/login')}
              style={{ marginTop: '30px' }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.authPage}>
      <nav className={styles.authNav}>
        <Link className={styles.brand} href="/">
          <span className={styles.logoMark}>
            <Orbit size={18} />
          </span>
          BondGrid
        </Link>
        <Link className={styles.backLink} href="/login">
          <ChevronLeft size={16} />
          Back to Login
        </Link>
      </nav>

      <div className={styles.authShell} style={{ display: 'flex', justifyContent: 'center' }}>
        <form className={styles.formCard} style={{ maxWidth: '440px', width: '100%' }} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <div>
              <h1>Create New Password</h1>
              <p>Please choose a new secure password.</p>
            </div>
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}

          <div className={styles.fieldStack}>
            <label className={styles.field}>
              <span>New Password</span>
              <PasswordInput
                className={styles.input}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <div className={styles.hint}>Must be between 8 and 16 characters.</div>
            </label>
            
            <label className={styles.field}>
              <span>Confirm Password</span>
              <PasswordInput
                className={styles.input}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </label>
          </div>

          <button
            className={`${styles.primaryButton} ${styles.fullButton}`}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
