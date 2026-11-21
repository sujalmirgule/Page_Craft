import type { BlockSchema, PageSchema, PortfolioDocument } from '@pagecraft/types';

/**
 * Implements deterministic drag-and-drop block reordering
 * Updates `order` properties sequentially (0, 1, 2, ...)
 */
export function reorderBlocks<T extends { id: string; order: number }>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] {
  if (startIndex < 0 || startIndex >= items.length || endIndex < 0 || endIndex >= items.length) {
    return items;
  }

  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    order: index,
  }));
}

export function findBlock(page: PageSchema, blockId: string): BlockSchema | undefined {
  return page.blocks.find(b => b.id === blockId);
}

export function updateBlockInPage(
  page: PageSchema,
  blockId: string,
  updater: (prev: BlockSchema) => BlockSchema
): PageSchema {
  return {
    ...page,
    blocks: page.blocks.map(b => (b.id === blockId ? updater(b) : b)),
  };
}

export function removeBlockFromPage(page: PageSchema, blockId: string): PageSchema {
  const filtered = page.blocks.filter(b => b.id !== blockId);
  return {
    ...page,
    blocks: filtered.map((b, idx) => ({ ...b, order: idx })),
  };
}

export function generateSnapshotFingerprint(doc: PortfolioDocument): string {
  // Simple deterministic structural hash key
  const structuralPayload = {
    schemaVersion: doc.schemaVersion,
    slug: doc.slug,
    pagesCount: doc.pages.length,
    blocks: doc.pages.map(p => p.blocks.map(b => `${b.id}:${b.type}:${b.order}`)),
  };
  return JSON.stringify(structuralPayload);
}
