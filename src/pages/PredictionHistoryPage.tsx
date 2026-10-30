import React, { useState, useEffect, useMemo } from 'react';
import { Search, Eye, Trash2, RefreshCw, X, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../services/api';

export default function PredictionHistoryPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('All');
  const [year, setYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [predictionFilter, setPredictionFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // View modal state
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPredictions({
        search,
        branch,
        year,
        semester,
        performance: predictionFilter,
      });
      if (res && Array.isArray(res.predictions)) {
        setPredictions(res.predictions);
      } else if (Array.isArray(res)) {
        setPredictions(res);
      } else {
        setPredictions([]);
      }
    } catch (err: any) {
      console.error('Failed to load prediction history:', err);
      setError(err?.message || 'Failed to load prediction history from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    setPage(1);
  }, [branch, year, semester, predictionFilter]);

  const handleSearch = () => {
    setPage(1);
    loadHistory();
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this prediction history record?')) {
      return;
    }
    try {
      await api.deletePrediction(id);
      if (selectedPrediction && selectedPrediction.id === id) {
        setSelectedPrediction(null);
      }
      loadHistory();
    } catch (err: any) {
      alert('Error deleting prediction record: ' + (err?.message || 'Failed'));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Client-side sorting for table column header clicks
  const sortedPredictions = useMemo(() => {
    const data = [...predictions];
    return data.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'id') {
        valA = Number(a.id || 0);
        valB = Number(b.id || 0);
      } else if (sortField === 'date') {
        valA = `${a.date || ''} ${a.time || ''}`;
        valB = `${b.date || ''} ${b.time || ''}`;
      } else if (sortField === 'student_id') {
        valA = (a.student_id || '').toString().toLowerCase();
        valB = (b.student_id || '').toString().toLowerCase();
      } else if (sortField === 'student_name') {
        valA = (a.student_name || '').toString().toLowerCase();
        valB = (b.student_name || '').toString().toLowerCase();
      } else if (sortField === 'branch') {
        valA = (a.branch || '').toString().toLowerCase();
        valB = (b.branch || '').toString().toLowerCase();
      } else if (sortField === 'semester') {
        valA = Number(a.semester || 0);
        valB = Number(b.semester || 0);
      } else if (sortField === 'performance') {
        valA = (a.performance || '').toString().toLowerCase();
        valB = (b.performance || '').toString().toLowerCase();
      } else if (sortField === 'probability') {
        valA = Number(a.probability || 0);
        valB = Number(b.probability || 0);
      } else if (sortField === 'risk_level') {
        valA = (a.risk_level || '').toString().toLowerCase();
        valB = (b.risk_level || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [predictions, sortField, sortOrder]);

  // Pagination calculation
  const totalRecords = sortedPredictions.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRecords = sortedPredictions.slice(startIndex, startIndex + pageSize);

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} style={{ marginLeft: 4, display: 'inline' }} />
    ) : (
      <ArrowDown size={12} style={{ marginLeft: 4, display: 'inline' }} />
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Prediction History</h2>
          <p>View all past predictions made by the system</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadHistory}
          title="Refresh prediction history from database"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh History
        </button>
      </div>

      <div className="card">
        {/* Filters bar */}
        <div className="filters-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search by Roll Number or Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <select className="filter-select" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="All">Branch: All</option>
            {['CSE', 'DS', 'ECE', 'AI', 'IT', 'EEE', 'MECH', 'CIVIL'].map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <select className="filter-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="All">Joining Year: All</option>
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>

          <select className="filter-select" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="All">Semester: All</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={String(s)}>Sem {s}</option>
            ))}
          </select>

          <select className="filter-select" value={predictionFilter} onChange={(e) => setPredictionFilter(e.target.value)}>
            <option value="All">Prediction: All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading prediction history...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="empty-state" style={{ color: '#ef4444' }}>
            <h3>Error Loading Prediction History</h3>
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={loadHistory}>
              Retry Connection
            </button>
          </div>
        )}

        {/* History Table */}
        {!loading && !error && (
          <>
            {totalRecords === 0 ? (
              <div className="empty-state">
                <h3>No Prediction Records Found</h3>
                <p>No prediction history matches your search or filter criteria.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        S.No {renderSortIcon('id')}
                      </th>
                      <th onClick={() => handleSort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Date & Time {renderSortIcon('date')}
                      </th>
                      <th onClick={() => handleSort('student_id')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Roll Number {renderSortIcon('student_id')}
                      </th>
                      <th onClick={() => handleSort('student_name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Name {renderSortIcon('student_name')}
                      </th>
                      <th onClick={() => handleSort('branch')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Branch {renderSortIcon('branch')}
                      </th>
                      <th onClick={() => handleSort('semester')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Semester {renderSortIcon('semester')}
                      </th>
                      <th onClick={() => handleSort('performance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Prediction {renderSortIcon('performance')}
                      </th>
                      <th onClick={() => handleSort('probability')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Probability {renderSortIcon('probability')}
                      </th>
                      <th onClick={() => handleSort('risk_level')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        Risk {renderSortIcon('risk_level')}
                      </th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((row, idx) => {
                      const displaySno = startIndex + idx + 1;
                      const formattedDt = `${row.date || ''} ${row.time || ''}`.trim() || 'N/A';
                      const predVal = row.performance || 'Medium';
                      const riskVal = row.risk_level || 'Pass';
                      const probVal = row.probability != null ? `${row.probability}%` : 'N/A';

                      return (
                        <tr key={row.id || idx}>
                          <td>{displaySno}</td>
                          <td style={{ color: '#64748b', fontSize: 12 }}>{formattedDt}</td>
                          <td style={{ fontWeight: 600, color: '#1e40af' }}>{row.student_id || 'N/A'}</td>
                          <td>{row.student_name || 'Manual Entry'}</td>
                          <td>{row.branch || 'N/A'}</td>
                          <td>{row.semester || 'N/A'}</td>
                          <td>
                            <span className={`badge badge-${predVal === 'High' ? 'high' : (predVal === 'Low' ? 'low' : 'medium')}`}>
                              {predVal}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{probVal}</td>
                          <td>
                            <span className={`badge badge-${riskVal.toLowerCase() === 'high' || riskVal === 'At-Risk' ? 'at-risk' : (riskVal === 'Medium' ? 'medium' : 'pass')}`}>
                              {riskVal}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button className="btn-view" onClick={() => setSelectedPrediction(row)} title="View Prediction Details">
                                View
                              </button>
                              <button
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  border: 'none',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => handleDelete(row.id, e)}
                                title="Delete Prediction Record"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalRecords > 0 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} records
                </div>
                <div className="pagination-buttons">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    «
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((p, index, array) => {
                      const showEllipsis = index > 0 && p - array[index - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <button disabled>...</button>}
                          <button
                            className={currentPage === p ? 'active' : ''}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Details Modal */}
      {selectedPrediction && (
        <div className="modal-overlay" onClick={() => setSelectedPrediction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Prediction Details</h3>
              <button className="modal-close" onClick={() => setSelectedPrediction(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header Info Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                    {selectedPrediction.student_name || selectedPrediction.student_id}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                    Roll Number: <strong>{selectedPrediction.student_id}</strong> • Branch: <strong>{selectedPrediction.branch}</strong> • Sem: <strong>{selectedPrediction.semester}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                    Predicted on: {selectedPrediction.date} at {selectedPrediction.time}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PERFORMANCE</div>
                  <span className={`badge badge-${selectedPrediction.performance === 'High' ? 'high' : (selectedPrediction.performance === 'Low' ? 'low' : 'medium')}`} style={{ fontSize: 14, padding: '4px 12px', marginTop: 4 }}>
                    {selectedPrediction.performance}
                  </span>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Probability</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                    {selectedPrediction.probability}%
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Risk Level</div>
                  <div style={{ marginTop: 4 }}>
                    <span className={`badge badge-${(selectedPrediction.risk_level || '').toLowerCase() === 'high' || selectedPrediction.risk_level === 'At-Risk' ? 'at-risk' : (selectedPrediction.risk_level === 'Medium' ? 'medium' : 'pass')}`}>
                      {selectedPrediction.risk_level || 'Pass'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Semester</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                    Sem {selectedPrediction.semester}
                  </div>
                </div>
              </div>

              {/* Input Parameters Grid */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Input Academic Indicators</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Attendance:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.attendance ?? 'N/A'}%</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Internal Marks:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.internal_marks ?? 'N/A'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Previous Marks/CGPA:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.previous_semester_marks ?? 'N/A'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Assignment Score:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.assignment_score ?? 'N/A'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Lab Performance:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.lab_performance ?? 'N/A'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <span style={{ color: '#64748b' }}>Backlogs:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.backlog_count ?? 'N/A'}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748b' }}>Study Hours per Day:</span> <strong style={{ float: 'right' }}>{selectedPrediction.inputs?.study_hours ?? 'N/A'} hrs</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPrediction(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
