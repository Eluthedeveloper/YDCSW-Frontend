import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useAsyncData } from './useAsyncData';

/** A promise whose settlement the test controls, so races can be ordered. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

interface HarnessProps<T> {
  load: () => Promise<T>;
  initial: T;
  deps?: readonly unknown[];
  onValue?: (value: { data: T; loading: boolean; error: string | null; reload: () => void; setData: (v: T) => void }) => void;
}

function Harness<T>({ load, initial, deps = [], onValue }: HarnessProps<T>) {
  const value = useAsyncData(load, initial, deps);
  onValue?.(value);
  return (
    <div>
      <span data-testid="data">{JSON.stringify(value.data)}</span>
      <span data-testid="loading">{String(value.loading)}</span>
      <span data-testid="error">{value.error ?? 'none'}</span>
      <button onClick={value.reload}>reload</button>
      <button onClick={() => value.setData(initial)}>setData</button>
    </div>
  );
}

const read = (id: string) => screen.getByTestId(id).textContent;

describe('useAsyncData', () => {
  it('starts in the loading state and resolves to the loaded value', async () => {
    const { promise, resolve } = deferred<string[]>();
    render(<Harness load={() => promise} initial={[]} />);

    expect(read('loading')).toBe('true');

    await act(async () => {
      resolve(['a', 'b']);
      await promise;
    });

    expect(read('loading')).toBe('false');
    expect(read('data')).toBe('["a","b"]');
    expect(read('error')).toBe('none');
  });

  it('surfaces the failure instead of leaving an empty list', async () => {
    const { promise, reject } = deferred<string[]>();
    render(<Harness load={() => promise} initial={[]} />);

    await act(async () => {
      reject(new Error('Network down'));
      await promise.catch(() => {});
    });

    // Before the fix this stayed 'none': the pages had no .catch, so a failed
    // request rendered the "no programs yet" empty state.
    expect(read('error')).toBe('Network down');
    expect(read('loading')).toBe('false');
  });

  it('reads a message out of an api error body', async () => {
    const { promise, reject } = deferred<string[]>();
    render(<Harness load={() => promise} initial={[]} />);

    await act(async () => {
      reject({ error: 'Program not found' });
      await promise.catch(() => {});
    });

    expect(read('error')).toBe('Program not found');
  });

  it('keeps already-rendered data when a reload fails', async () => {
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['a'])
      .mockRejectedValueOnce(new Error('boom'));
    render(<Harness load={load} initial={[]} />);

    await act(async () => {
      await Promise.resolve();
    });
    expect(read('data')).toBe('["a"]');

    await userEvent.click(screen.getByText('reload'));

    expect(read('data')).toBe('["a"]');
    expect(read('error')).toBe('boom');
  });

  it('re-runs the loader on reload', async () => {
    const load = vi.fn().mockResolvedValue(['a']);
    render(<Harness load={load} initial={[]} />);
    await act(async () => {
      await Promise.resolve();
    });

    await userEvent.click(screen.getByText('reload'));
    await act(async () => {
      await Promise.resolve();
    });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('hides a stale error while the next load is in flight', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    render(<Harness load={load} initial={[]} />);

    await act(async () => {
      first.reject(new Error('boom'));
      await first.promise.catch(() => {});
    });
    expect(read('error')).toBe('boom');

    await userEvent.click(screen.getByText('reload'));
    expect(read('loading')).toBe('true');
    expect(read('error')).toBe('none');

    await act(async () => {
      second.resolve(['ok']);
      await second.promise;
    });
    expect(read('error')).toBe('none');
    expect(read('data')).toBe('["ok"]');
  });

  it('discards a slow response that resolves after a newer one', async () => {
    const slow = deferred<string[]>();
    const fast = deferred<string[]>();
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise);

    function Route() {
      const [id, setId] = useState('first');
      return (
        <div>
          <Harness load={load} initial={[]} deps={[id]} />
          <button onClick={() => setId('second')}>navigate</button>
        </div>
      );
    }
    render(<Route />);

    await userEvent.click(screen.getByText('navigate'));

    await act(async () => {
      fast.resolve(['second']);
      await fast.promise;
    });
    expect(read('data')).toBe('["second"]');

    // The first request finally lands. Without the `cancelled` guard it would
    // clobber the newer result and the page would show the wrong program.
    await act(async () => {
      slow.resolve(['first']);
      await slow.promise;
    });
    expect(read('data')).toBe('["second"]');
  });

  it('updates data in place without refetching', async () => {
    const load = vi.fn().mockResolvedValue(['a']);
    render(<Harness load={load} initial={[]} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(load).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText('setData'));

    expect(read('data')).toBe('[]');
    expect(load).toHaveBeenCalledTimes(1);
  });
});