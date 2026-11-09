import { useState } from 'react';

import {
  saveRegistrationFormDraftBodySchema,
  type Declaration,
  type RegistrationForm,
  type ShownDeclaration,
} from '@repo/schema/camps';
import type {
  CampOption,
  CustomField,
  CustomFieldType,
  FormDefinition,
  StandardFieldState,
} from '@repo/schema/form-engine';

import {
  useDiscardRegistrationFormDraftMutation,
  useSaveRegistrationFormMutation,
} from '@/features/camps/api/camps.queries';
import { newCustomField } from '@/features/camps/components/registration-form-section/custom-field.helper';
import { HttpError } from '@/lib/api';

export type BuilderStatus =
  | 'saved'
  | 'published'
  | 'discarded'
  | 'invalid'
  | 'invalid_max'
  | 'form_field_changed'
  | 'form_definition_invalid'
  | 'declaration_file_unknown'
  | 'failed'
  | null;

const REFUSALS = ['form_field_changed', 'form_definition_invalid', 'declaration_file_unknown'] as const;

/**
 * Turn a declaration as shown back into what the draft stores.
 * @param declaration the declaration with its PDF's link
 */
function storedDeclaration({ file, ...declaration }: ShownDeclaration): Declaration {
  return { ...declaration, fileId: file?.id ?? null };
}

// The draft being edited, a copy of the saved one: the builder is one big form, saved as a whole.
export function useRegistrationFormBuilder(organisationId: string, campId: string, form: RegistrationForm) {
  const save = useSaveRegistrationFormMutation(organisationId, campId);
  const discard = useDiscardRegistrationFormDraftMutation(organisationId, campId);
  const [definition, setDefinition] = useState<FormDefinition>(form.draft);
  const [maxParticipants, setMaxParticipants] = useState(form.maxParticipants);
  const [declarations, setDeclarations] = useState<readonly ShownDeclaration[]>(form.declarations);
  const [status, setStatus] = useState<BuilderStatus>(null);
  // The custom field open in the editor, by id.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newType, setNewType] = useState<CustomFieldType>('short_text');
  const [isPreviewing, setPreviewing] = useState(false);

  const setCustom = (custom: CustomField[]) => setDefinition({ ...definition, custom });

  const submit = (publish: boolean) => {
    setStatus(null);
    // Checked here first with the contract, so a mistake is named before anything is sent.
    const draft = { definition, maxParticipants, declarations: declarations.map(storedDeclaration) };
    const checked = saveRegistrationFormDraftBodySchema.safeParse(draft);

    if (!checked.success) {
      setStatus(checked.error.issues.some(({ path }) => path[0] === 'maxParticipants') ? 'invalid_max' : 'invalid');

      return;
    }

    save.mutate(
      { draft, publish },
      {
        onSuccess: () => setStatus(publish ? 'published' : 'saved'),
        onError: (error) => {
          const code = error instanceof HttpError ? error.code : undefined;

          setStatus(REFUSALS.find((refusal) => refusal === code) ?? 'failed');
        },
      },
    );
  };

  // Links from the latest fetch, which refreshes them before they expire; an upload's own until then.
  const linkOf = (declaration: ShownDeclaration) =>
    declaration.file === null
      ? null
      : (form.declarations.find(({ file }) => file?.id === declaration.file?.id)?.file?.link.url ??
        declaration.file.link.url);

  return {
    linkOf,
    // The declarations as the preview shows them, each PDF with its current link.
    previewDeclarations: declarations.map((declaration) => ({
      ...declaration,
      file:
        declaration.file === null
          ? null
          : { ...declaration.file, link: { ...declaration.file.link, url: linkOf(declaration) ?? '' } },
    })),
    definition,
    maxParticipants,
    declarations,
    setDeclarations,
    status,
    isSaving: save.isPending || discard.isPending,
    setMaxParticipants,
    // A field keeps its place among the standard fields; a new one joins at the end.
    setStandardField: (key: string, entry: { state: StandardFieldState; options?: CampOption[] }) =>
      setDefinition({
        ...definition,
        standard: definition.standard.some((field) => field.key === key)
          ? definition.standard.map((field) => (field.key === key ? { key, ...entry } : field))
          : [...definition.standard, { key, ...entry }],
      }),
    selected: definition.custom.find((field) => field.id === selectedId) ?? null,
    select: (id: string | null) => setSelectedId(id),
    newType,
    setNewType,
    isPreviewing,
    togglePreview: () => setPreviewing(!isPreviewing),
    // A new field opens in the editor at once.
    addField: (label: string) => {
      const field = newCustomField(newType, label);

      setCustom([...definition.custom, field]);
      setSelectedId(field.id);
    },
    updateField: (field: CustomField) =>
      setCustom(definition.custom.map((current) => (current.id === field.id ? field : current))),
    removeField: (id: string) => {
      setCustom(definition.custom.filter((field) => field.id !== id));
      setSelectedId(null);
    },
    // Only custom fields move, and only among themselves.
    moveField: (id: string, by: -1 | 1) => {
      const from = definition.custom.findIndex((field) => field.id === id);
      const to = from + by;
      const moved = definition.custom[from];

      if (moved === undefined || to < 0 || to >= definition.custom.length) {
        return;
      }

      const rest = definition.custom.filter((field) => field.id !== id);
      setCustom([...rest.slice(0, to), moved, ...rest.slice(to)]);
    },
    save: () => submit(false),
    publish: () => submit(true),
    // The latest published version back as the draft, here and saved; nothing to go back to before one.
    discard: () => {
      if (form.latest === null) {
        return;
      }

      setStatus(null);
      discard.mutate(form.latest.version, {
        onSuccess: (saved) => {
          setDefinition(saved.draft);
          setMaxParticipants(saved.maxParticipants);
          setDeclarations(saved.declarations);
          setSelectedId(null);
          setStatus('discarded');
        },
        onError: () => setStatus('failed'),
      });
    },
  };
}
