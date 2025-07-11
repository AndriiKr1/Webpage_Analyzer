import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import URLTable from '../components/URLTable';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const MockedURLTable = () => (
  <BrowserRouter>
    <URLTable />
  </BrowserRouter>
);

describe('URLTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', async () => {
    // Mock fetch to return empty array immediately
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(<MockedURLTable />);
    
    expect(screen.getByText('Loading initial data...')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading initial data...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders table with data', async () => {
    const mockData = [
      {
        id: 1,
        address: 'https://example.com',
        status: 'done',
        title: 'Example Site',
        htmlVersion: 'HTML5',
        h1: 1,
        h2: 2,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0,
        internalLinks: 5,
        externalLinks: 3,
        brokenLinks: 0,
        hasLoginForm: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<MockedURLTable />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(screen.getByText('Example Site')).toBeInTheDocument();
    expect(screen.getByText('HTML5')).toBeInTheDocument();
  });

  it('shows empty state when no URLs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<MockedURLTable />);
    
    await waitFor(() => {
      expect(screen.getByText('No URLs found matching your criteria.')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<MockedURLTable />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading initial data...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch URLs', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
