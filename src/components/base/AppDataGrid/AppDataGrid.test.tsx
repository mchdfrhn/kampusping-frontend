import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppDataGrid } from './AppDataGrid';

describe('AppDataGrid', () => {
  it('shows the Indonesian empty state, not the library typo', async () => {
    render(<AppDataGrid rows={[]} columns={[{ field: 'name', headerName: 'Nama', flex: 1 }]} />);

    expect(await screen.findByText('Tidak ada data')).toBeInTheDocument();
    expect(screen.queryByText('Tidak ad abaris')).not.toBeInTheDocument();
  });

  it('enables horizontal scrolling when fillWidth is true and columns exceed container width', async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    try {
      const { container } = render(
        <AppDataGrid
          fillWidth
          rows={[{ id: 1, code: 'INV-001', name: 'Budi' }]}
          columns={[
            { field: 'code', headerName: 'Kode', minWidth: 400, flex: 1 },
            { field: 'name', headerName: 'Nama', minWidth: 400, flex: 1 },
          ]}
        />,
      );

      const gridRoot = container.querySelector('.MuiDataGrid-root') as HTMLElement;
      const scroller = container.querySelector('.MuiDataGrid-virtualScroller') as HTMLElement;
      const scrollerContent = container.querySelector(
        '.MuiDataGrid-virtualScrollerContent',
      ) as HTMLElement;

      await waitFor(() => {
        expect(gridRoot.style.getPropertyValue('--DataGrid-columnsTotalWidth')).toBe('800px');
        expect(gridRoot.style.getPropertyValue('--DataGrid-hasScrollX')).toBe('1');
      });

      expect(scroller).toHaveClass('MuiDataGrid-virtualScroller--hasScrollX');
      expect(window.getComputedStyle(scroller).overflowX).toBe('auto');
      expect(window.getComputedStyle(scrollerContent).minWidth).toBe('100%');
      expect(
        window.getComputedStyle(container.querySelector('.MuiDataGrid-row') as HTMLElement).width,
      ).toBe('var(--DataGrid-columnsTotalWidth)');
      expect(
        window.getComputedStyle(
          container.querySelector('.MuiDataGrid-filler--horizontal') as HTMLElement,
        ).width,
      ).toBe('0px');
      expect(
        window.getComputedStyle(
          container.querySelector('.MuiDataGrid-columnHeader--last') as HTMLElement,
        ).overflow,
      ).toBe('hidden');
    } finally {
      rectSpy.mockRestore();
    }
  });
});
