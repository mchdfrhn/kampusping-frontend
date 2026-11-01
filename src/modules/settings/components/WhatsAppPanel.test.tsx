import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/core/auth/auth.store';
import type { AuthUser } from '@/core/auth/auth.type';
import { ApiError } from '@/core/http/api-error';
import { NotifyProvider } from '@/core/notify/NotifyProvider';

import { whatsappService } from '../services/whatsapp.service';
import type { WhatsAppStatus } from '../types';
import { WhatsAppPanel } from './WhatsAppPanel';

vi.mock('../services/whatsapp.service', () => ({
  whatsappService: { status: vi.fn(), logout: vi.fn() },
}));

const service = vi.mocked(whatsappService);

const QR_SECRET = '2@pairingSecretTokenDoNotRender,abc/def+ghi==,xyz';

const status = (overrides: Partial<WhatsAppStatus> = {}): WhatsAppStatus => ({
  state: 'connected',
  qr: null,
  paused_reason: null,
  ...overrides,
});

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 't',
    user: { id: 1, permissions } as unknown as AuthUser,
  });

const renderPanel = () =>
  render(
    <NotifyProvider>
      <WhatsAppPanel />
    </NotifyProvider>,
  );

let visibility: DocumentVisibilityState = 'visible';
const setVisibility = (next: DocumentVisibilityState) => {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
};

/** Let pending promises settle and fire the timers due within `ms`. */
const advance = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => visibility,
  });
  signIn(['settings:read', 'settings:update']);
  service.status.mockResolvedValue(status());
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WhatsAppPanel states', () => {
  it('shows Terhubung when connected', async () => {
    renderPanel();

    expect(await screen.findByText('Terhubung')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows Menyambungkan… while connecting', async () => {
    service.status.mockResolvedValue(status({ state: 'connecting' }));
    renderPanel();

    expect(await screen.findByText('Menyambungkan…')).toBeInTheDocument();
  });

  it('shows Terputus with help text when disconnected', async () => {
    service.status.mockResolvedValue(status({ state: 'disconnected' }));
    renderPanel();

    expect(await screen.findByText('Terputus')).toBeInTheDocument();
    expect(screen.getByText(/dijeda otomatis/)).toBeInTheDocument();
    expect(screen.getByText(/restart gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/tekan Putuskan sesi/)).toBeInTheDocument();
  });

  it('renders the QR as an svg, with instructions, and never as plain text', async () => {
    service.status.mockResolvedValue(status({ state: 'qr', qr: QR_SECRET }));
    const { container } = renderPanel();

    const code = await screen.findByRole('img', { name: /kode QR/i });
    expect(code.tagName.toLowerCase()).toBe('svg');
    expect(container.querySelector('svg path')).not.toBeNull();
    expect(
      screen.getByText(
        'Buka WhatsApp di ponsel → Perangkat tertaut → Tautkan perangkat → pindai kode ini',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/nomor WhatsApp khusus/)).toBeInTheDocument();
    // the pairing token is rendered only as drawing, not as text, attribute or title
    expect(document.body.innerHTML).not.toContain(QR_SECRET);
    expect(document.body.textContent).not.toContain('pairingSecretToken');
  });

  it('waits for the code when the state is qr but no code arrived yet', async () => {
    service.status.mockResolvedValue(status({ state: 'qr', qr: null }));
    renderPanel();

    expect(await screen.findByText('Menyiapkan kode QR…')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('drops the QR as soon as the state is no longer qr', async () => {
    vi.useFakeTimers();
    service.status.mockResolvedValueOnce(status({ state: 'qr', qr: QR_SECRET }));
    service.status.mockResolvedValue(status({ state: 'connected' }));
    renderPanel();
    await advance(0);
    expect(screen.getByRole('img', { name: /kode QR/i })).toBeInTheDocument();

    await advance(3000);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Terhubung')).toBeInTheDocument();
  });

  it('never writes the QR to the console or to storage', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    service.status.mockResolvedValue(status({ state: 'qr', qr: QR_SECRET }));
    renderPanel();
    await screen.findByRole('img', { name: /kode QR/i });

    for (const spy of spies) {
      expect(JSON.stringify(spy.mock.calls)).not.toContain('pairingSecretToken');
      spy.mockRestore();
    }
    expect(JSON.stringify({ ...localStorage })).not.toContain('pairingSecretToken');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('pairingSecretToken');
  });
});

describe('WhatsAppPanel polling', () => {
  it('polls every 3 seconds', async () => {
    vi.useFakeTimers();
    renderPanel();
    await advance(0);
    expect(service.status).toHaveBeenCalledTimes(1);

    await advance(2999);
    expect(service.status).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(service.status).toHaveBeenCalledTimes(2);
    await advance(3000);
    expect(service.status).toHaveBeenCalledTimes(3);
  });

  it('stops polling and leaves no timer behind when it unmounts', async () => {
    vi.useFakeTimers();
    const { unmount } = renderPanel();
    await advance(3000);
    const calls = service.status.mock.calls.length;

    unmount();
    await advance(60000);

    expect(service.status).toHaveBeenCalledTimes(calls);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('aborts the request that is still in flight when it unmounts', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    service.status.mockImplementation((given) => {
      signal = given;
      return new Promise<WhatsAppStatus>(() => {});
    });
    const { unmount } = renderPanel();
    await advance(0);
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it('does not poll while the tab is hidden and catches up when it is visible again', async () => {
    vi.useFakeTimers();
    renderPanel();
    await advance(0);
    expect(service.status).toHaveBeenCalledTimes(1);

    act(() => setVisibility('hidden'));
    await advance(30000);
    expect(service.status).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    await advance(0);
    expect(service.status).toHaveBeenCalledTimes(2);
    await advance(3000);
    expect(service.status).toHaveBeenCalledTimes(3);
  });

  it('does not start a second request while one is still in flight', async () => {
    vi.useFakeTimers();
    let resolveFirst: (value: WhatsAppStatus) => void = () => {};
    service.status.mockImplementationOnce(
      () => new Promise<WhatsAppStatus>((resolve) => (resolveFirst = resolve)),
    );
    renderPanel();
    await advance(0);

    await advance(20000);
    expect(service.status).toHaveBeenCalledTimes(1);

    resolveFirst(status());
    await advance(0);
    await advance(3000);
    expect(service.status).toHaveBeenCalledTimes(2);
  });

  it('backs off exponentially up to 30 seconds after errors and recovers on success', async () => {
    vi.useFakeTimers();
    const times: number[] = [];
    service.status.mockImplementation(async () => {
      times.push(Date.now());
      throw new ApiError('Tidak dapat terhubung ke server.', 0, 'network_error');
    });
    renderPanel();
    await advance(0);

    expect(screen.getByText('Tidak dapat memuat status WhatsApp.')).toBeInTheDocument();
    await advance(200000);

    const gaps = times.slice(1).map((time, index) => time - times[index]);
    expect(gaps.slice(0, 6)).toEqual([6000, 12000, 24000, 30000, 30000, 30000]);

    service.status.mockResolvedValue(status());
    await advance(30000);
    expect(screen.getByText('Terhubung')).toBeInTheDocument();
    expect(screen.queryByText('Tidak dapat memuat status WhatsApp.')).not.toBeInTheDocument();
    const before = service.status.mock.calls.length;
    await advance(3000);
    expect(service.status).toHaveBeenCalledTimes(before + 1);
  });

  it('retries at once when Coba lagi is pressed', async () => {
    vi.useFakeTimers();
    service.status.mockRejectedValueOnce(new ApiError('Gagal', 500));
    renderPanel();
    await advance(0);
    expect(screen.getByText('Tidak dapat memuat status WhatsApp.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    await advance(0);

    expect(service.status).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Terhubung')).toBeInTheDocument();
  });
});

describe('WhatsAppPanel logout', () => {
  it('asks for confirmation before disconnecting and calls the service after confirming', async () => {
    service.logout.mockResolvedValue({ status: 'logged_out' });
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Terhubung');

    await user.click(screen.getByRole('button', { name: 'Putuskan sesi' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Sesi WhatsApp akan diputus dan Anda perlu memindai ulang kode QR.'),
    ).toBeInTheDocument();
    expect(service.logout).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Putuskan sesi' }));

    await waitFor(() => expect(service.logout).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Sesi WhatsApp diputus.')).toBeInTheDocument();
    // the status is refreshed straight away
    await waitFor(() => expect(service.status.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('does not disconnect when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Terhubung');

    await user.click(screen.getByRole('button', { name: 'Putuskan sesi' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Batal' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(service.logout).not.toHaveBeenCalled();
  });

  it('shows the server message in a snackbar when the gateway cannot be reached (502)', async () => {
    service.logout.mockRejectedValue(
      new ApiError('Gagal memutuskan sesi WhatsApp.', 502, 'application_error'),
    );
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('Terhubung');

    await user.click(screen.getByRole('button', { name: 'Putuskan sesi' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Putuskan sesi' }));

    expect(await screen.findByText('Gagal memutuskan sesi WhatsApp.')).toBeInTheDocument();
  });
});

describe('WhatsAppPanel permissions', () => {
  it('shows the status but no Putuskan sesi button without settings:update', async () => {
    signIn(['settings:read']);
    renderPanel();

    expect(await screen.findByText('Terhubung')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Putuskan sesi' })).not.toBeInTheDocument();
  });

  it('renders nothing and never polls without settings:read', async () => {
    vi.useFakeTimers();
    signIn(['settings:update']);
    const { container } = renderPanel();
    await advance(10000);

    expect(container).toBeEmptyDOMElement();
    expect(service.status).not.toHaveBeenCalled();
  });
});
