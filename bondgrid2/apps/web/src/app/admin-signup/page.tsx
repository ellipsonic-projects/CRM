'use client';

import { FormEvent, ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '../../components/form/PasswordInput';
import { adminSignup, AdminSignupInput } from '../../services/auth.api';
import {
  getPasswordPolicyMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateCreatedPassword,
} from '../../utils/password';

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
    <main className="min-h-screen bg-[#0B1220] px-6 py-10 text-white">
      <form
        className="mx-auto w-full max-w-3xl rounded-xl border border-slate-800 bg-slate-950 p-6"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Admin Signup</h1>
            <p className="mt-1 text-sm text-slate-400">Step {step} of 4</p>
          </div>

          <Link className="text-sm text-slate-400 hover:text-white" href="/">
            Back
          </Link>
        </div>

        {error ? (
          <div className="mt-5 whitespace-pre-line rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-8">
          {step === 1 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Full Name">
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Phone">
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Password">
                <PasswordInput
                  className="input"
                  value={form.password}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="new-password"
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  {getPasswordPolicyMessage()} Longer passphrases are welcome.
                </p>
              </Field>

              <Field label="Confirm Password">
                <PasswordInput
                  className="input"
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Organization Name">
                <input
                  className="input"
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
                  className="input"
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
                  className="input"
                  value={form.state}
                  onChange={(event) =>
                    setForm({ ...form, state: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="City">
                <input
                  className="input"
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Area">
                <input
                  className="input"
                  value={form.area}
                  onChange={(event) =>
                    setForm({ ...form, area: event.target.value })
                  }
                />
              </Field>

              <Field label="Logo">
                <input
                  className="input"
                  value={form.logo}
                  onChange={(event) =>
                    setForm({ ...form, logo: event.target.value })
                  }
                />
              </Field>
            </div>
          ) : null}

          {step >= 3 ? (
            <div className="grid gap-5 md:grid-cols-2">
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
          ) : null}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900 disabled:opacity-40"
            disabled={step === 1 || loading}
            onClick={() => setStep((current) => Math.max(current - 1, 1))}
          >
            Back
          </button>

          {step < 4 ? (
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
              onClick={goNext}
            >
              Continue
            </button>
          ) : (
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="mb-2 block text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Summary({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="font-semibold">{title}</h2>
      <dl className="mt-4 space-y-3">{children}</dl>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-200">{value}</dd>
    </div>
  );
}
