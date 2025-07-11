import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import URLForm from '../components/URLForm';

// Mock fetch
window.fetch = vi.fn();

describe('URLForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with correct elements', () => {
    render(<URLForm />);
    
    expect(screen.getByText('Analyze New URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Website URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Analysis' })).toBeInTheDocument();
  });

  it('shows validation error for empty URL', async () => {
    const user = userEvent.setup();
    render(<URLForm />);
    
    const input = screen.getByLabelText('Website URL');
    
    // Type something and then clear it to trigger validation
    await user.type(input, 'a');
    await user.clear(input);
    
    const submitButton = screen.getByRole('button', { name: 'Start Analysis' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a URL/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid URL', async () => {
    const user = userEvent.setup();
    render(<URLForm />);
    
    const input = screen.getByLabelText('Website URL');
    const submitButton = screen.getByRole('button', { name: 'Start Analysis' });
    
    await user.type(input, 'invalid-url');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });
  });

  it('submits valid URL successfully', async () => {
    const user = userEvent.setup();
    const mockResponse = { id: 1, address: 'https://example.com', status: 'queued' };
    
    (window.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<URLForm />);
    
    const input = screen.getByLabelText('Website URL');
    const submitButton = screen.getByRole('button', { name: 'Start Analysis' });
    
    await user.type(input, 'https://example.com');
    await user.click(submitButton);
    
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/urls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer devtoken123'
      },
      body: JSON.stringify({ url: 'https://example.com' })
    });
    
    await waitFor(() => {
      expect(screen.getByText(/URL added successfully/)).toBeInTheDocument();
    });
  });

  it('handles API error correctly', async () => {
    const user = userEvent.setup();
    
    (window.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    });

    render(<URLForm />);
    
    const input = screen.getByLabelText('Website URL');
    const submitButton = screen.getByRole('button', { name: 'Start Analysis' });
    
    await user.type(input, 'https://example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('disables form during submission', async () => {
    const user = userEvent.setup();
    
    // Mock a slow response
    (window.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: 1 })
      }), 1000))
    );

    render(<URLForm />);
    
    const input = screen.getByLabelText('Website URL');
    const submitButton = screen.getByRole('button', { name: 'Start Analysis' });
    
    await user.type(input, 'https://example.com');
    await user.click(submitButton);
    
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
