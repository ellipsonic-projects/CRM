'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Orbit } from 'lucide-react';
import { forgotPassword } from '../../services/auth.api';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);
    setSuccess(false);

    try {
      await forgotPassword({ email });
      setSuccess(true);
      sessionStorage.setItem('resetEmail', email);
      
      // Short delay before moving to verify OTP so user sees success message
      setTimeout(() => {
        router.push('/verify-otp');
      }, 1500);
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Something went wrong.',
      );
    } finally {
      setLoading(false);
    }
  };

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
              <h1>Reset Password</h1>
              <p>Enter your email address to receive a verification code.</p>
            </div>
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}
          {success ? (
            <div className={styles.alert} style={{ borderColor: 'rgba(52, 211, 153, 0.32)', background: 'rgba(6, 78, 59, 0.32)', color: '#a7f3d0' }}>
              If an account exists, a verification code has been sent.
            </div>
          ) : null}

          <div className={styles.fieldStack}>
            <label className={styles.field}>
              <span>Email Address</span>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={loading || success}
              />
            </label>
          </div>

          <button
            className={`${styles.primaryButton} ${styles.fullButton}`}
            disabled={loading || success}
          >
            {loading ? 'Sending...' : 'Send OTP'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
