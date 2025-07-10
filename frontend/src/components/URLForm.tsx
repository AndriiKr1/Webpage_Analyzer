import { useState } from 'react';

export default function URLForm() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer devtoken123' 
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Request error');
      }

      const data = await response.json();
      setSuccess(`URL added with ID: ${data.id}`);
      setUrl('');
    } catch  {
      setError('Failed to add URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <label className="block font-medium">Enter URL</label>
      <input
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        placeholder="https://example.com"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Sending...' : 'Analyze'}
      </button>
      {success && <p className="text-green-600">{success}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
