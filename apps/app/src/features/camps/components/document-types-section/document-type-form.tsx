import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DOCUMENT_TYPE_KINDS,
  documentTypeBodySchema,
  type DocumentType,
  type DocumentTypeKind,
} from '@repo/schema/documents';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDocumentTypeMutations, useTurnusyQuery } from '@/features/camps/api/camps.queries';

interface DocumentTypeFormProps {
  organisationId: string;
  campId: string;
  type: DocumentType | null;
  canWrite: boolean;
  onDone: () => void;
}

// One Document type: its kind, name and description, a requirement's due date or a download's Turnusy, and
// its file once it exists.
export function DocumentTypeForm({ organisationId, campId, type, canWrite, onDone }: DocumentTypeFormProps) {
  const { t } = useTranslation('camps');
  const turnusy = useTurnusyQuery(organisationId, campId);
  const mutations = useDocumentTypeMutations(organisationId, campId);
  const [kind, setKind] = useState<DocumentTypeKind>(type?.kind ?? 'requirement');
  const [name, setName] = useState(type?.name ?? '');
  const [description, setDescription] = useState(type?.description ?? '');
  const [dueDate, setDueDate] = useState(type?.dueDate ?? '');
  const [turnusIds, setTurnusIds] = useState<readonly string[]>(type?.turnusIds ?? []);
  // A Turnus removed since is dropped, so saving never names one the Camp no longer has.
  const existing = new Set((turnusy.data ?? []).map(({ id }) => id));
  const body = documentTypeBodySchema.safeParse({
    kind,
    name,
    description,
    dueDate: kind === 'requirement' && dueDate !== '' ? dueDate : null,
    turnusIds: kind === 'download' ? turnusIds.filter((id) => existing.has(id)) : [],
  });

  return (
    <fieldset disabled={!canWrite} className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
      <select
        aria-label={t('documentTypes.kind')}
        className="h-9 self-start rounded-lg border border-input bg-transparent px-2"
        value={kind}
        onChange={(event) => setKind(DOCUMENT_TYPE_KINDS.find((known) => known === event.target.value) ?? kind)}
      >
        {DOCUMENT_TYPE_KINDS.map((known) => (
          <option key={known} value={known}>
            {t(`documentTypes.kinds.${known}`)}
          </option>
        ))}
      </select>
      <label className="flex flex-col gap-1">
        {t('documentTypes.name')}
        <Input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        {t('documentTypes.description')}
        <textarea
          rows={2}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base md:text-sm"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      {kind === 'requirement' ? (
        <label className="flex flex-col gap-1 sm:max-w-xs">
          {t('documentTypes.dueDate')}
          <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </label>
      ) : (
        <div className="flex flex-col gap-1">
          <span>{t('documentTypes.turnusy')}</span>
          {(turnusy.data ?? []).map((turnus) => (
            <label key={turnus.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={turnusIds.includes(turnus.id)}
                onChange={(event) =>
                  setTurnusIds(
                    event.target.checked ? [...turnusIds, turnus.id] : turnusIds.filter((id) => id !== turnus.id),
                  )
                }
              />
              {turnus.name}
            </label>
          ))}
          <span className="text-muted-foreground">{t('documentTypes.allTurnusy')}</span>
        </div>
      )}
      {type === null ? null : (
        <div className="flex flex-wrap items-center gap-3">
          {type.file === null ? (
            <label className="flex flex-col gap-1">
              {kind === 'download' ? t('documentTypes.file') : t('documentTypes.blankForm')}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                disabled={mutations.setFile.isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file !== undefined) {
                    mutations.setFile.mutate({ id: type.id, file });
                  }
                }}
              />
            </label>
          ) : (
            <>
              <a href={type.file.link.url} target="_blank" rel="noreferrer" className="underline">
                {t('documentTypes.openFile')}
              </a>
              <Button type="button" size="sm" variant="outline" onClick={() => mutations.removeFile.mutate(type.id)}>
                {t('documentTypes.removeFile')}
              </Button>
            </>
          )}
          {mutations.setFile.isError ? (
            <span className="text-destructive">{t('documentTypes.uploadFailed')}</span>
          ) : null}
        </div>
      )}
      {type === null ? <p className="text-muted-foreground">{t('documentTypes.fileAfterSave')}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!body.success || mutations.save.isPending}
          onClick={() => {
            if (body.success) {
              mutations.save.mutate({ id: type?.id ?? null, body: body.data }, { onSuccess: onDone });
            }
          }}
        >
          {t('documentTypes.save')}
        </Button>
        {type === null ? null : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => mutations.remove.mutate(type.id, { onSuccess: onDone })}
          >
            {t('documentTypes.remove')}
          </Button>
        )}
      </div>
      {mutations.save.isError || mutations.remove.isError ? (
        <p role="alert" className="text-destructive">
          {t('documentTypes.saveFailed')}
        </p>
      ) : null}
    </fieldset>
  );
}
