import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'devtoken123';

type URLDetail = {
  id: number;
  address: string;
  status: string;
  title: string;
  htmlVersion: string;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  hasLoginForm: boolean;
  createdAt: string;
};

export default function URLDetails() {
  const { id } = useParams<{ id: string }>();
  const [urlData, setUrlData] = useState<URLDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch URL details
      const response = await fetch(`${API_BASE_URL}/api/urls/${id}`, {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch URL details');
      }

      const data = await response.json();
      setUrlData(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReAnalyze = async () => {
    if (!urlData) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/urls/${urlData.id}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to re-analyze URL');
      }

      // Refresh the data after re-analysis
      await fetchDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-analyze URL');
      setLoading(false); // Only set loading false on error, fetchDetails will handle success case
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-refresh when URL is running
  useEffect(() => {
    if (!urlData || urlData.status !== 'running') return;

    const interval = setInterval(() => {
      fetchDetails();
    }, 3000); // Refresh every 3 seconds when running

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlData?.status]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error || !urlData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-semibold mb-2">Error</h2>
          <p className="text-red-600">{error || 'URL not found'}</p>
          <Link to="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Chart data for links distribution
  const linksChartData = {
    labels: ['Internal Links', 'External Links'],
    datasets: [
      {
        data: [urlData.internalLinks, urlData.externalLinks],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderColor: ['#059669', '#D97706'],
        borderWidth: 2,
      },
    ],
  };

  // Chart data for heading distribution
  const headingsChartData = {
    labels: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
    datasets: [
      {
        label: 'Count',
        data: [urlData.h1, urlData.h2, urlData.h3, urlData.h4, urlData.h5, urlData.h6],
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">URL Analysis Details</h1>
      </div>

      {/* Running Analysis Info */}
      {urlData.status === 'running' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="text-blue-800 font-medium">Analysis in Progress</p>
              <p className="text-blue-600 text-sm">The website is being analyzed. This page will update automatically when complete.</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">URL</label>
            <p className="text-gray-900 break-all">{urlData.address}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              urlData.status === 'done' ? 'bg-green-100 text-green-800' :
              urlData.status === 'running' ? 'bg-blue-100 text-blue-800' :
              urlData.status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {urlData.status === 'running' && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {urlData.status === 'done' ? 'Completed' :
               urlData.status === 'running' ? 'Analyzing...' :
               urlData.status === 'error' ? 'Failed' :
               urlData.status === 'queued' ? 'Queued' :
               urlData.status}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <p className="text-gray-900">{urlData.title || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">HTML Version</label>
            <p className="text-gray-900">{urlData.htmlVersion || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Has Login Form</label>
            <p className="text-gray-900">{urlData.hasLoginForm ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Analyzed At</label>
            <p className="text-gray-900">{new Date(urlData.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Links Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Links Distribution</h3>
          <div className="h-64">
            <Doughnut data={linksChartData} options={chartOptions} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{urlData.internalLinks}</p>
              <p className="text-sm text-gray-600">Internal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{urlData.externalLinks}</p>
              <p className="text-sm text-gray-600">External</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{urlData.brokenLinks}</p>
              <p className="text-sm text-gray-600">Broken</p>
            </div>
          </div>
        </div>

        {/* Headings Distribution Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Heading Tags Distribution</h3>
          <div className="h-64">
            <Bar data={headingsChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Broken Links Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          Broken Links {urlData.brokenLinks > 0 && (
            <span className="text-red-600">({urlData.brokenLinks})</span>
          )}
        </h3>
        
        {urlData.brokenLinks === 0 ? (
          <p className="text-green-600 font-medium">✓ No broken links found!</p>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-800">
              <strong>{urlData.brokenLinks}</strong> broken link{urlData.brokenLinks > 1 ? 's' : ''} detected.
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Detailed broken links list will be available in future updates.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={fetchDetails}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh Analysis'}
        </button>
        <button
          onClick={handleReAnalyze}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Re-analyzing...' : 'Re-analyze URL'}
        </button>
      </div>
    </div>
  );
}