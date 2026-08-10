'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft, Fingerprint, Orbit } from 'lucide-react';
import PasswordInput from '../../components/form/PasswordInput';
import { login } from '../../services/auth.api';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      await login({ identifier, password });
      router.replace('/app/network');
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not log in.',
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
        <Link className={styles.backLink} href="/">
          <ChevronLeft size={16} />
          Landing
        </Link>
      </nav>

      <div className={styles.authShell}>
        <section className={styles.storyPanel}>
          <div className={styles.eyebrow}>
            <Fingerprint size={16} />
            Secure workspace access
          </div>
          <h1>Enter the graph where your organization remembers everything.</h1>
          <p>
            Sign in to manage people, relationships, events, roles, imports,
            audit trails, and the living community network behind your team.
          </p>
          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <strong>RBAC</strong>
              <span>role aware</span>
            </div>
            <div className={styles.metric}>
              <strong>Audit</strong>
              <span>tracked</span>
            </div>
            <div className={styles.metric}>
              <strong>Graph</strong>
              <span>ready</span>
            </div>
          </div>
          <MiniGraph />
        </section>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <div>
              <h1>Welcome back</h1>
              <p>Continue into your BondGrid organization workspace.</p>
            </div>
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}

          <div className={styles.fieldStack}>
            <label className={styles.field}>
              <span>Email or Phone</span>
              <input
                className={styles.input}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                required
              />
            </label>

            <label className={styles.field}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ marginBottom: 0 }}>Password</span>
                <Link
                  href="/forgot-password"
                  style={{ color: '#67e8f9', fontSize: '13px', fontWeight: 600 }}
                >
                  Forgot Password?
                </Link>
              </div>
              <PasswordInput
                className={styles.input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          <button
            className={`${styles.primaryButton} ${styles.fullButton}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
            <ArrowRight size={18} />
          </button>

          <p className={styles.formFooter}>
            Starting fresh? <Link href="/admin-signup">Create admin account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function MiniGraph() {
  return (
    <svg className={styles.miniGraph} viewBox="0 0 620 360" aria-hidden="true">
      <path className={styles.graphLine} d="M80 250 C160 110, 260 120, 350 210 S500 300, 560 110" />
      <path className={styles.graphLine} d="M115 145 C240 50, 350 80, 492 206" />
      <path className={styles.graphLine} d="M160 286 C260 220, 340 270, 455 128" />
      {[
        [80, 250],
        [115, 145],
        [190, 98],
        [282, 142],
        [350, 210],
        [455, 128],
        [492, 206],
        [560, 110],
        [160, 286],
      ].map(([cx, cy], index) => (
        <circle
          key={`${cx}-${cy}`}
          className={styles.graphNode}
          cx={cx}
          cy={cy}
          r={index % 3 === 0 ? 8 : 6}
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </svg>
  );
}
