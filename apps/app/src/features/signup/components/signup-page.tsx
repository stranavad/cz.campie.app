import { SignupForm } from '@/features/signup/components/signup-form/signup-form';
import { SignupPitch } from '@/features/signup/components/signup-pitch/signup-pitch';

// What the platform gives and the form beside it on a wide screen; on a phone the pitch comes first.
export function SignupPage() {
  return (
    <div className="grid items-start gap-6 py-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-4">
      <SignupPitch />
      <SignupForm />
    </div>
  );
}
