import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppDataGrid } from './AppDataGrid';

describe('AppDataGrid', () => {
  it('shows the Indonesian empty state, not the library typo', async () => {
    render(<AppDataGrid rows={[]} columns={[{ field: 'name', headerName: 'Nama', flex: 1 }]} />);

    expect(await screen.findByText('Tidak ada data')).toBeInTheDocument();
    expect(screen.queryByText('Tidak ad abaris')).not.toBeInTheDocument();
  });
});
