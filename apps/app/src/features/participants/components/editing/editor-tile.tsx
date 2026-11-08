import type { ReactNode } from 'react';

// One editor within the editing card: a titled, bordered block.
export function EditorTile({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-border-subtle p-4">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}
