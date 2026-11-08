import { FileLockIcon, Trash2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { InternalDocument } from '@repo/schema/documents';
import { czechDateTime } from '@repo/schema/shared';

import { FileButton } from '@/components/file-button';
import { Button } from '@/components/ui/button';
import { useOpenInternalDocumentMutation } from '@/features/participants/api/participants.queries';
import { participantsService } from '@/features/participants/api/participants.service';

interface InternalDocumentsProps {
  organisationId: string;
  registrationId: string;
  participantId: string;
  documents: InternalDocument[];
  canWrite: boolean;
  run: (job: () => Promise<unknown>) => void;
  isBusy: boolean;
  // The link to open by hand when the browser blocked the new tab.
  onBlocked: (url: string) => void;
}

// A child's Internal documents, which the family never sees; each opening is audited.
export function InternalDocuments(props: InternalDocumentsProps) {
  const { t } = useTranslation('participants');
  const openInternal = useOpenInternalDocumentMutation(props.organisationId);
  const open = (documentId: string) => {
    // Opened at the click, where browsers allow it, and pointed at the link once it comes. A noopener tab
    // would come back as null, so the tab is cut from this page by hand.
    const tab = window.open('', '_blank');

    if (tab !== null) {
      tab.opener = null;
    }

    openInternal.mutate(documentId, {
      onSuccess: ({ url }) => (tab === null ? props.onBlocked(url) : tab.location.assign(url)),
      onError: () => tab?.close(),
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-[20px] bg-muted p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <FileLockIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        {t('documents.internal')}
      </p>
      {props.documents.length === 0 ? <p className="text-muted-foreground">{t('documents.noInternal')}</p> : null}
      {props.documents.map((document) => (
        <div key={document.id} className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button
            type="button"
            className="min-h-9 cursor-pointer text-left font-semibold underline underline-offset-2 disabled:opacity-50"
            disabled={openInternal.isPending}
            onClick={() => open(document.id)}
          >
            {document.name}
          </button>
          <span className="text-[13px] text-muted-foreground">{czechDateTime(document.uploadedAt)}</span>
          {props.canWrite ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="ml-auto"
              aria-label={t('documents.removeInternal', { name: document.name })}
              disabled={props.isBusy}
              onClick={() =>
                props.run(() => participantsService.removeInternalDocument(props.organisationId, document.id))
              }
            >
              <Trash2Icon aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ))}
      {props.canWrite ? (
        <FileButton
          size="sm"
          accept="application/pdf,image/jpeg,image/png"
          className="self-start"
          label={t('documents.addInternal')}
          disabled={props.isBusy}
          onFile={(file) =>
            props.run(() =>
              participantsService.addInternalDocument(
                props.organisationId,
                props.registrationId,
                props.participantId,
                file,
              ),
            )
          }
        />
      ) : null}
      {openInternal.isError ? <p className="text-destructive">{t('documents.openFailed')}</p> : null}
    </div>
  );
}
