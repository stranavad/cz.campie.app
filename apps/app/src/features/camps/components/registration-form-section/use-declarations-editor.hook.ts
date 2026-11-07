import type { Dispatch, SetStateAction } from 'react';

import type { ShownDeclaration } from '@repo/schema/camps';

import { useUploadDeclarationFileMutation } from '@/features/camps/api/camps.queries';
import { uuidv7 } from '@/lib/utils';

export type DeclarationsUpdate = Dispatch<SetStateAction<readonly ShownDeclaration[]>>;

export function useDeclarationsEditor(
  organisationId: string,
  campId: string,
  declarations: readonly ShownDeclaration[],
  onChange: DeclarationsUpdate,
) {
  const upload = useUploadDeclarationFileMutation(organisationId, campId);
  const replace = (index: number, declaration: ShownDeclaration) =>
    onChange(declarations.map((current, at) => (at === index ? declaration : current)));

  return {
    replace,
    add: () => onChange([...declarations, { id: uuidv7(), text: '', mandatory: true, url: null, file: null }]),
    remove: (index: number) => onChange(declarations.filter((_, at) => at !== index)),
    move: (index: number, by: -1 | 1) => {
      const moved = declarations[index];
      const to = index + by;

      if (moved === undefined || to < 0 || to >= declarations.length) {
        return;
      }

      const rest = declarations.filter((_, at) => at !== index);
      onChange([...rest.slice(0, to), moved, ...rest.slice(to)]);
    },
    // The PDF is stored at once and lands on its declaration by id, whatever was edited meanwhile; the
    // draft names it from the next save.
    attach: (declarationId: string, file: File) =>
      upload.mutate(file, {
        onSuccess: ({ fileId, link }) =>
          onChange((current) =>
            current.map((declaration) =>
              declaration.id === declarationId
                ? { ...declaration, url: null, file: { id: fileId, link } }
                : declaration,
            ),
          ),
      }),
    uploadFailed: upload.isError,
  };
}
