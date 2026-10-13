import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '../i18n';
import { BlogPage, BlogPostPage } from './blog';
import { api } from '../player/utils/api';
import type { BlogPost } from '../player/utils/types';

vi.mock('../player/utils/api', () => ({
  api: {
    getBlogPosts: vi.fn(),
    getBlogPost: vi.fn(),
    getWhatsNew: vi.fn(),
  },
  uploadUrl: (path: string) => `/api/uploads/${path}`,
}));

const getBlogPosts = api.getBlogPosts as ReturnType<typeof vi.fn>;
const getBlogPost = api.getBlogPost as ReturnType<typeof vi.fn>;
const getWhatsNew = api.getWhatsNew as ReturnType<typeof vi.fn>;

const POSTS: BlogPost[] = [
  {
    id: 'p1',
    slug: 'radio-anniversary',
    title: 'Sixty Years on the Air',
    excerpt: 'How the radio ministry began and where it goes next.',
    category: 'Radio',
    cover_image: 'cover.jpg',
    published: 1,
    created_at: '2026-10-01 09:30:00',
    body: 'A long article about the anniversary of the radio ministry.',
  },
  {
    id: 'p2',
    slug: 'choir-festival',
    title: 'National Choir Festival',
    excerpt: 'Churches from every region gathered for a weekend of worship.',
    category: 'Events',
    cover_image: null,
    published: 1,
    created_at: '2026-09-20 12:00:00',
    body: 'Report from the choir festival.',
  },
];

describe('BlogPage', () => {
  beforeEach(() => {
    getBlogPosts.mockReset();
    getBlogPost.mockReset();
    getWhatsNew.mockReset();
    getWhatsNew.mockResolvedValue([]);
    localStorage.clear();
  });

  it('renders each post with its cover image and a link to the article', async () => {
    getBlogPosts.mockResolvedValue(POSTS);

    const { container } = render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Sixty Years on the Air')).toBeInTheDocument();
    expect(screen.getByText('National Choir Festival')).toBeInTheDocument();

    // The featured post's cover is a real image, not a placeholder. Cover
    // images are decorative (the title sits beside them), so they carry an
    // empty alt and have to be looked up in the container rather than by role.
    expect(container.querySelector('img[src="/api/uploads/blogs/cover.jpg"]')).toBeTruthy();

    const links = screen.getAllByRole('link');
    expect(links.some((link) => link.getAttribute('href') === '/blog/radio-anniversary')).toBe(true);
  });

  it('filters the list by category', async () => {
    getBlogPosts.mockResolvedValue(POSTS);

    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    const radioFilter = await screen.findByRole('button', { name: 'Radio' });
    await userEvent.click(radioFilter);

    expect(screen.getByText('Sixty Years on the Air')).toBeInTheDocument();
    expect(screen.queryByText('National Choir Festival')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing is published', async () => {
    getBlogPosts.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>
    );

    expect(
      await screen.findByText('No articles published yet. Check back soon.')
    ).toBeInTheDocument();
  });
});

describe('BlogPostPage', () => {
  beforeEach(() => {
    getBlogPosts.mockReset();
    getBlogPost.mockReset();
    getWhatsNew.mockReset();
    getWhatsNew.mockResolvedValue([]);
    getBlogPosts.mockResolvedValue([]);
    localStorage.clear();
  });

  it('renders the article photos and opens one in the lightbox', async () => {
    getBlogPost.mockResolvedValue({ ...POSTS[0], images: ['photo-a.jpg', 'photo-b.jpg'] });

    const { container } = render(
      <MemoryRouter initialEntries={['/blog/radio-anniversary']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sixty Years on the Air')).toBeInTheDocument();
    expect(container.querySelector('img[src="/api/uploads/blogs/photo-a.jpg"]')).toBeTruthy();
    expect(container.querySelector('img[src="/api/uploads/blogs/photo-b.jpg"]')).toBeTruthy();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Photos 1' }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('img[src="/api/uploads/blogs/photo-a.jpg"]')).toBeTruthy();

    // Stepping forward wraps through the set rather than stopping at the end.
    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(dialog.querySelector('img[src="/api/uploads/blogs/photo-b.jpg"]')).toBeTruthy();
  });

  it('skips the gallery for a post without photos', async () => {
    getBlogPost.mockResolvedValue(POSTS[0]);

    render(
      <MemoryRouter initialEntries={['/blog/radio-anniversary']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPostPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sixty Years on the Air')).toBeInTheDocument();
    expect(screen.queryByText('Photos')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Photos/ })).not.toBeInTheDocument();
  });
});
