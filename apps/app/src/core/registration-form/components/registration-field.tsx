import { useId } from 'react';

import type { AnswerValue, FormField } from '@repo/schema/form-engine';

import { Alert } from '@/components/ui/alert';
import { FieldError } from '@/components/ui/field';
import { FieldInput } from '@/core/registration-form/components/field-input';

export interface RegistrationFieldProps {
  field: FormField;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  // What is wrong with the answer, already worded; shown under the field.
  message?: string | null;
  // More about the answer that is not an error, such as an age outside the Turnus's limits.
  note?: string | null;
}

// One field of the registration form, as guardians fill it in, with what is wrong with it; the builder's
// preview shows the same.
export function RegistrationField({ message = null, note = null, ...props }: RegistrationFieldProps) {
  const messageId = useId();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <FieldInput {...props} invalid={message !== null} describedBy={message === null ? undefined : messageId} />
      {note === null ? null : <Alert variant="warning">{note}</Alert>}
      {message === null ? null : <FieldError id={messageId}>{message}</FieldError>}
    </div>
  );
}
