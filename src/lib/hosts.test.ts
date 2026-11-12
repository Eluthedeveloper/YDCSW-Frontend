import { describe, it, expect, afterEach, vi } from 'vitest';
import { isStreamHost, mainSiteUrl, STREAM_HOST } from './hosts';

describe('isStreamHost', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('matches the stream subdomain exactly', () => {
    vi.stubGlobal('location', { hostname: 'listen.yemisrachdimts.org' });
    expect(isStreamHost()).toBe(true);
  });

  it('matches a hostname supplied directly, ignoring window.location', () => {
    vi.stubGlobal('location', { hostname: 'yemisrachdimts.org' });
    expect(isStreamHost('listen.yemisrachdimts.org')).toBe(true);
  });

  it('does not match the main domain or its www variant', () => {
    expect(isStreamHost('yemisrachdimts.org')).toBe(false);
    expect(isStreamHost('www.yemisrachdimts.org')).toBe(false);
  });

  it('does not match hosts that merely contain the stream host name', () => {
    expect(isStreamHost(`not${STREAM_HOST}`)).toBe(false);
  });

  it('does not match the API subdomain', () => {
    expect(isStreamHost('audiostreaming.yemisrachdimts.org')).toBe(false);
  });
});

describe('mainSiteUrl', () => {
  it('turns news routes into absolute marketing-site URLs', () => {
    expect(mainSiteUrl('/blog/some-post')).toBe('https://yemisrachdimts.org/blog/some-post');
    expect(mainSiteUrl('/events/42')).toBe('https://yemisrachdimts.org/events/42');
  });

  it('maps the bare root to the marketing home', () => {
    expect(mainSiteUrl('/')).toBe('https://yemisrachdimts.org/');
    expect(mainSiteUrl()).toBe('https://yemisrachdimts.org/');
  });
});
