import { DownloadIcon, FileTextIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { DocumentType } from '@repo/schema/documents';
import { czechDate } from '@repo/schema/shared';

import { IconTile } from '@/components/icon-tile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { DescriptionItem, DescriptionList } from '@/components/ui/description-list';

interface DocumentTypeCardProps {
  type: DocumentType;
  // Null when the type is for every Turnus.
  turnusNames: string | null;
  canWrite: boolean;
  onEdit: () => void;
}

// A Document type at a glance: what it is, by when or for whom, and its file.
export function DocumentTypeCard({ type, turnusNames, canWrite, onEdit }: DocumentTypeCardProps) {
  const { t } = useTranslation('camps');
  const isDownload = type.kind === 'download';

  return (
    <Card>
      <div className="flex items-start gap-3">
        <IconTile>{isDownload ? <DownloadIcon /> : <FileTextIcon />}</IconTile>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <h3 className="text-heading break-words">{type.name}</h3>
          <span className="text-sm text-muted-foreground">
            {isDownload ? t('documentTypes.kinds.download') : t('documentTypes.perChild')}
          </span>
        </div>
      </div>
      {type.description === '' ? null : (
        <p className="text-sm whitespace-pre-line text-muted-foreground">{type.description}</p>
      )}
      <DescriptionList>
        {isDownload ? (
          <DescriptionItem label={t('documentTypes.turnusyShort')}>
            {turnusNames ?? t('documentTypes.everyTurnus')}
          </DescriptionItem>
        ) : (
          <DescriptionItem label={t('documentTypes.due')}>
            {type.dueDate === null ? t('documentTypes.noDueDate') : czechDate(type.dueDate)}
          </DescriptionItem>
        )}
        <DescriptionItem label={isDownload ? t('documentTypes.fileShort') : t('documentTypes.blankFormShort')}>
          {type.file !== null ? (
            <a
              href={type.file.link.url}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-brand-text"
            >
              {t('documentTypes.openFile')}
            </a>
          ) : isDownload ? (
            <Badge variant="danger" className="h-auto py-1 whitespace-normal">
              {t('documentTypes.noFile')}
            </Badge>
          ) : (
            t('documentTypes.withoutFile')
          )}
        </DescriptionItem>
      </DescriptionList>
      {canWrite ? (
        <CardFooter className="mt-auto">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            {t('documentTypes.edit')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
