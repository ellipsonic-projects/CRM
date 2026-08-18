'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Orbit } from 'lucide-react';
import { forgotPassword, verifyResetOtp } from '../../services/auth.api';
import styles from '../auth.module.css';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (!storedEmail) {
      router.replace('/forgot-password');
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  useEffect(() => {
    const timer =
      countdown > 0
        ? setTimeout(() => setCountdown(countdown - 1), 1000)
        : undefined;

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(undefined);

    try {
      const result = await verifyResetOtp({ email, otp });
      sessionStorage.setItem('resetToken', result.token);
      router.push('/reset-password');
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Invalid or expired OTP.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;

    setResending(true);
    setError(undefined);

    try {
      await forgotPassword({ email });
      setCountdown(60); // Reset countdown
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not resend OTP.',
      );
    } finally {
      setResending(false);
    }
  };

  if (!email) return null; // Prevent hydration mismatch or flash

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
              <h1>Verify OTP</h1>
              <p>Enter the 6-digit code sent to {email}.</p>
            </div>
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}

          <div className={styles.fieldStack}>
            <label className={styles.field}>
              <span>Verification Code</span>
              <input
                className={styles.input}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
                placeholder="000000"
                style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem' }}
              />
            </label>
          </div>

          <button
            className={`${styles.primaryButton} ${styles.fullButton}`}
            disabled={loading || otp.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
            <ArrowRight size={18} />
          </button>

          <div className={styles.formFooter} style={{ marginTop: '32px' }}>
            {countdown > 0 ? (
              <span style={{ color: '#94a3b8' }}>Resend OTP in {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#67e8f9',
                  fontWeight: 800,
                  cursor: resending ? 'not-allowed' : 'pointer',
                  opacity: resending ? 0.5 : 1,
                  padding: 0,
                }}
              >
                {resending ? 'Resending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
