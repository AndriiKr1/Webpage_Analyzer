import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type URLItem = {
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

type SortField = 'address' | 'status' | 'title' | 'createdAt' | 'internalLinks' | 'externalLinks';
type SortOrder = 'asc' | 'desc';

export default function URLTable() {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [filteredUrls, setFilteredUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchUrls = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await fetch("http://localhost:8080/api/urls", {
        headers: {
          Authorization: "Bearer devtoken123",
        },
      });

      const data = await res.json();
      setUrls(data);
    } catch (error) {
      console.error("Failed to fetch URLs", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter and sort URLs
  useEffect(() => {
    const filtered = urls.filter(url => {
      const matchesSearch = url.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (url.title && url.title.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !statusFilter || url.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredUrls(filtered);
  }, [urls, searchTerm, statusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredUrls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUrls = filteredUrls.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(paginatedUrls.map(url => url.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
      setSelectAll(false);
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/urls/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer devtoken123'
        },
        body: JSON.stringify({
          ids: selectedIds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete URLs');
      }

      setSelectedIds([]);
      setSelectAll(false);
      fetchUrls();
    } catch (error) {
      console.error('Failed to delete URLs:', error);
    }
  };

  const handleBulkRerun = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/urls/bulk-rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer devtoken123'
        },
        body: JSON.stringify({
          ids: selectedIds
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rerun analysis');
      }

      setSelectedIds([]);
      setSelectAll(false);
      fetchUrls();
    } catch (error) {
      console.error('Failed to rerun analysis:', error);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (autoRefreshEnabled) {
        fetchUrls(true);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled]);

  if (loading)
    return (
      <p className="text-gray-600 italic mt-4 animate-pulse">Loading initial data...</p>
    );

  return (
    <div className="mt-6">
      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search URLs or titles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="done">Done</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center gap-4">
          <span className="text-sm text-blue-800">
            {selectedIds.length} items selected
          </span>
          <button
            onClick={handleBulkRerun}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Re-analyze
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUrls.length)} of {filteredUrls.length} results
          </span>
          {refreshing && (
            <span className="text-gray-500 italic text-sm animate-pulse ml-4">
              Updating data...
            </span>
          )}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => {
              fetchUrls(true);
              setAutoRefreshEnabled(true);
            }}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            Refresh now
          </button>
          <button
            onClick={() => {
              setUrls([]);
              setAutoRefreshEnabled(false);
            }}
            className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 text-sm"
          >
            Clear table
          </button>
        </div>
      </div>

      {filteredUrls.length === 0 ? (
        <p className="text-gray-600">No URLs found matching your criteria.</p>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="min-w-full border text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('address')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      URL
                      {sortField === 'address' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Status
                      {sortField === 'status' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Title
                      {sortField === 'title' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">HTML</th>
                  <th className="p-2 border">H1-H6</th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('internalLinks')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Internal Links
                      {sortField === 'internalLinks' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('externalLinks')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      External Links
                      {sortField === 'externalLinks' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">Broken</th>
                  <th className="p-2 border">Login?</th>
                  <th className="p-2 border">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      Created At
                      {sortField === 'createdAt' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUrls.map((url) => (
                  <tr key={url.id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(url.id)}
                        onChange={(e) => handleSelectRow(url.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-2 border">
                      <div className="max-w-xs truncate" title={url.address}>
                        {url.address}
                      </div>
                    </td>
                    <td className="p-2 border">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        url.status === 'done' ? 'bg-green-100 text-green-800' :
                        url.status === 'running' ? 'bg-blue-100 text-blue-800' :
                        url.status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {url.status}
                      </span>
                    </td>
                    <td className="p-2 border">
                      <div className="max-w-xs truncate" title={url.title || "-"}>
                        {url.title || "-"}
                      </div>
                    </td>
                    <td className="p-2 border">{url.htmlVersion || "-"}</td>
                    <td className="p-2 border text-xs">
                      {url.h1}/{url.h2}/{url.h3}/{url.h4}/{url.h5}/{url.h6}
                    </td>
                    <td className="p-2 border text-center">{url.internalLinks}</td>
                    <td className="p-2 border text-center">{url.externalLinks}</td>
                    <td className="p-2 border text-center">
                      <span className={url.brokenLinks > 0 ? 'text-red-600 font-semibold' : ''}>
                        {url.brokenLinks}
                      </span>
                    </td>
                    <td className="p-2 border text-center">
                      {url.hasLoginForm ? "✓" : "✗"}
                    </td>
                    <td className="p-2 border text-xs">
                      {new Date(url.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 border">
                      <Link
                        to={`/details/${url.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-3 py-1 border rounded ${
                          currentPage === totalPages
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

