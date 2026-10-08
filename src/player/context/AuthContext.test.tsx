import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerAuthProvider, usePlayerAuth } from './AuthContext';
import { api } from '../utils/api';
import type { AuthUser } from '../utils/types';

vi.mock('../utils/api', () => ({
  api: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

const admin: AuthUser = { id: '1', username: 'root', email: 'r@e.c', role: 'super_admin' };

function Probe() {
  const { user, isChecking, login, logout, isSuperAdmin } = usePlayerAuth();
  return (
    <div>
      <span data-testid="checking">{String(isChecking)}</span>
      <span data-testid="user">{user?.username ?? 'anonymous'}</span>
      <span data-testid="super">{String(isSuperAdmin)}</span>
      <button onClick={() => login('root', 'pw').catch(() => {})}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const originalFetch = globalThis.fetch;

describe('PlayerAuthProvider', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
    vi.mocked(api.getMe).mockReset();
    vi.mocked(api.login).mockReset();
    vi.mocked(api.logout).mockReset();
  });

  it('reports not signed in when the session check is rejected', async () => {
    vi.mocked(api.getMe).mockRejectedValue(new Error('Unauthorized'));
    render(
      <PlayerAuthProvider>
        <Probe />
      </PlayerAuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('checking')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('anonymous');
  });

  it('restores the user from the cookie session', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ ...admin });
    render(
      <PlayerAuthProvider>
        <Probe />
      </PlayerAuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('root'));
    expect(screen.getByTestId('super')).toHaveTextContent('true');
  });

  it('never puts the token in localStorage after login', async () => {
    vi.mocked(api.getMe).mockRejectedValue(new Error('Unauthorized'));
    vi.mocked(api.login).mockResolvedValue({ user: admin });

    render(
      <PlayerAuthProvider>
        <Probe />
      </PlayerAuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('checking')).toHaveTextContent('false'));

    await userEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('root'));
    expect(localStorage.getItem('token')).toBeNull();
    expect(vi.mocked(api.login).mock.calls[0]?.[0]).toEqual({ username: 'root', password: 'pw' });
  });

  it('clears the local user even when the logout request fails', async () => {
    vi.mocked(api.getMe).mockResolvedValue({ ...admin });
    vi.mocked(api.logout).mockRejectedValue(new Error('offline'));

    render(
      <PlayerAuthProvider>
        <Probe />
      </PlayerAuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('root'));

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('anonymous'));
  });
});