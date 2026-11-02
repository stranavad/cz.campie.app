import { createFormHookContexts } from '@tanstack/react-form';

// Separate file: field components import these, and use-app-form.hook imports the components.
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
