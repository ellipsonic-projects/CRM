'use client';

import { FormEvent, ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  Orbit,
  ShieldCheck,
} from 'lucide-react';
import PasswordInput from '../../components/form/PasswordInput';
import { adminSignup, AdminSignupInput } from '../../services/auth.api';
import {
  getPasswordPolicyMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateCreatedPassword,
} from '../../utils/password';
import styles from '../auth.module.css';

type OrganizationType = AdminSignupInput['organization']['organizationType'];

const organizationTypes: OrganizationType[] = [
  'Temple',
  'Trust',
  'NGO',
  'Community',
  'Association',
  'Educational Institution',
  'Other',
];

interface SignupState {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  organizationType: OrganizationType;
  state: string;
  city: string;
  area: string;
  logo: string;
}

const initialState: SignupState = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  organizationType: 'Temple',
  state: '',
  city: '',
  area: '',
  logo: '',
};

function optional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export default function AdminSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SignupState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const validateStep = (): boolean => {
    setError(undefined);

    if (step === 1) {
      if (
        !form.fullName ||
        !form.email ||
        !form.phone ||
        !form.password ||
        !form.confirmPassword
      ) {
        setError('Complete all administrator details.');
        return false;
      }

      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.');
        return false;
      }

      const passwordError = validateCreatedPassword(form.password);

      if (passwordError) {
        setError(passwordError);
        return false;
      }
    }

    if (step === 2) {
      if (!form.organizationName || !form.state || !form.city) {
        setError('Complete the organization setup.');
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (validateStep()) {
      setStep((current) => Math.min(current + 1, 4));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setError(undefined);

    const payload: AdminSignupInput = {
      admin: {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      },
      organization: {
        name: form.organizationName.trim(),
        organizationType: form.organizationType,
        state: form.state.trim(),
        city: form.city.trim(),
        area: optional(form.area),
        logo: optional(form.logo),
      },
    };

    try {
      await adminSignup(payload);
      router.replace('/app/network');
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not complete signup.',
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

      <div className={`${styles.authShell} ${styles.signupShell}`}>
        <section className={styles.storyPanel}>
          <div className={styles.eyebrow}>
            <ShieldCheck size={16} />
            Organization launch sequence
          </div>
          <h1>Create the command center for your community graph.</h1>
          <p>
            Set up the first administrator, define the organization boundary,
            and enter a workspace built for governed relationship data.
          </p>
          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <strong>01</strong>
              <span>admin</span>
            </div>
            <div className={styles.metric}>
              <strong>02</strong>
              <span>org setup</span>
            </div>
            <div className={styles.metric}>
              <strong>03</strong>
              <span>review</span>
            </div>
          </div>
          <MiniGraph />
        </section>

        <form
          className={`${styles.formCard} ${styles.wideFormCard}`}
          onSubmit={handleSubmit}
        >
          <div className={styles.formHeader}>
            <div>
              <h1>Admin Signup</h1>
              <p>Build your BondGrid tenant in four focused steps.</p>
            </div>
            <span className={styles.stepBadge}>Step {step} of 4</span>
          </div>

          <div className={styles.stepper} aria-hidden="true">
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`${styles.stepDot} ${
                  item <= step ? styles.stepDotActive : ''
                }`}
              />
            ))}
          </div>

          {error ? <div className={styles.alert}>{error}</div> : null}

          <div className={styles.signupContent}>
            {step === 1 ? (
              <div className={styles.fieldGrid}>
                <Field label="Full Name">
                  <input
                    className={styles.input}
                    value={form.fullName}
                    onChange={(event) =>
                      setForm({ ...form, fullName: event.target.value })
                    }
                    autoComplete="name"
                    required
                  />
                </Field>

                <Field label="Email">
                  <input
                    className={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    autoComplete="email"
                    required
                  />
                </Field>

                <Field label="Phone">
                  <input
                    className={styles.input}
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    autoComplete="tel"
                    required
                  />
                </Field>

                <Field label="Password">
                  <PasswordInput
                    className={styles.input}
                    value={form.password}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    required
                  />
                  <p className={styles.hint}>
                    {getPasswordPolicyMessage()} Longer passphrases are welcome.
                  </p>
                </Field>

                <Field label="Confirm Password">
                  <PasswordInput
                    className={styles.input}
                    value={form.confirmPassword}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        confirmPassword: event.target.value,
                      })
                    }
                    required
                  />
                </Field>
              </div>
            ) : null}

            {step === 2 ? (
              <div className={styles.fieldGrid}>
                <Field label="Organization Name">
                  <input
                    className={styles.input}
                    value={form.organizationName}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        organizationName: event.target.value,
                      })
                    }
                    required
                  />
                </Field>

                <Field label="Organization Type">
                  <select
                    className={styles.input}
                    value={form.organizationType}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        organizationType: event.target.value as OrganizationType,
                      })
                    }
                  >
                    {organizationTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="State">
                  <input
                    className={styles.input}
                    value={form.state}
                    onChange={(event) =>
                      setForm({ ...form, state: event.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="City">
                  <input
                    className={styles.input}
                    value={form.city}
                    onChange={(event) =>
                      setForm({ ...form, city: event.target.value })
                    }
                    required
                  />
                </Field>

                <Field label="Area">
                  <input
                    className={styles.input}
                    value={form.area}
                    onChange={(event) =>
                      setForm({ ...form, area: event.target.value })
                    }
                  />
                </Field>

                <Field label="Logo URL">
                  <input
                    className={styles.input}
                    value={form.logo}
                    onChange={(event) =>
                      setForm({ ...form, logo: event.target.value })
                    }
                  />
                </Field>
              </div>
            ) : null}

            {step >= 3 ? (
              <div>
                <p className={styles.summaryText}>
                  Review the administrator and organization details before
                  creating the workspace.
                </p>
                <div className={styles.summaryGrid}>
                  <Summary title="Administrator">
                    <SummaryRow label="Full Name" value={form.fullName} />
                    <SummaryRow label="Email" value={form.email} />
                    <SummaryRow label="Phone" value={form.phone} />
                  </Summary>

                  <Summary title="Organization">
                    <SummaryRow label="Name" value={form.organizationName} />
                    <SummaryRow label="Type" value={form.organizationType} />
                    <SummaryRow label="State" value={form.state} />
                    <SummaryRow label="City" value={form.city} />
                    <SummaryRow label="Area" value={form.area || 'Not added'} />
                  </Summary>
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={step === 1 || loading}
              onClick={() => setStep((current) => Math.max(current - 1, 1))}
            >
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={goNext}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button className={styles.primaryButton} disabled={loading}>
                {loading ? 'Creating...' : 'Create Organization'}
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          <p className={styles.formFooter}>
            Already have access? <Link href="/login">Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Summary({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.summaryCard}>
      <h2>{title}</h2>
      <dl>{children}</dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function MiniGraph() {
  return (
    <svg className={styles.miniGraph} viewBox="0 0 620 360" aria-hidden="true">
      <path className={styles.graphLine} d="M78 248 C180 82, 290 138, 390 96 S504 190, 562 112" />
      <path className={styles.graphLine} d="M130 128 C212 252, 356 244, 490 205" />
      <path className={styles.graphLine} d="M160 300 C250 184, 342 290, 452 126" />
      {[
        [78, 248],
        [130, 128],
        [212, 252],
        [290, 138],
        [356, 244],
        [390, 96],
        [452, 126],
        [490, 205],
        [562, 112],
      ].map(([cx, cy], index) => (
        <circle
          key={`${cx}-${cy}`}
          className={styles.graphNode}
          cx={cx}
          cy={cy}
          r={index % 3 === 0 ? 8 : 6}
          style={{ animationDelay: `${index * 130}ms` }}
        />
      ))}
    </svg>
  );
}
