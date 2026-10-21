import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => { throw new Error('Clerk should not be accessed without configuration'); },
  useClerk: () => { throw new Error('Clerk should not be accessed without configuration'); },
}));
vi.mock('@/components/ui/image', () => ({ Image: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));
import Header from '../../components/Header';
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
it('renders public navigation without Clerk credentials', () => {
  vi.stubEnv('PUBLIC_CLERK_PUBLISHABLE_KEY', '');
  render(<MemoryRouter><Header /></MemoryRouter>);
  expect(screen.getByRole('link', { name: 'Imóveis' })).toHaveAttribute('href', '/imoveis');
  expect(screen.getByAltText('R. Sales Imóveis Logo')).toBeInTheDocument();
});
