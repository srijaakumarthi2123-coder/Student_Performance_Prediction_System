import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, CheckCircle2, Search, Database, Users, Building2, Calendar } from 'lucide-react';
import { api } from '../services/api';

export default function DatasetPage() {
  const [previewData, setPreviewData] = useState<any>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [validationOk, setValidationOk] = useState(true);

  const loadDatasetData = async (p = 1) => {
    setLoading(true);
    try {
      const [preview, info] = await Promise.all([
        api.getDatasetPreview(p, search),
        api.getDatasetInfo(),
      ]);
      setPreviewData(preview);
      setDatasetInfo(info);
      setPage(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetData(1);
  }, []);

  const handleSearch = () => loadDatasetData(1);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadDataset(file);
      if (res.success) {
        setValidationMsg(res.message || 'Dataset uploaded and validated successfully!');
        setValidationOk(true);
      } else {
        setValidationMsg(res.message || 'Dataset validation failed. Check columns.');
        setValidationOk(false);
      }
      await loadDatasetData(1);
    } catch (err: any) {
      setValidationMsg(`Upload failed: ${err.message || 'Unknown error'}`);
      setValidationOk(false);
    } finally {
      setUploading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await api.refreshDataset();
      await api.trainModel();
      await loadDatasetData(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Manage Dataset</h2>
          <p>Upload, validate and manage student performance dataset</p>
        </div>
        <button onClick={handleRefresh} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Dataset
        </button>
      </div>

      {/* Top Grid: Upload CSV & Dataset Validation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Upload Box */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upload New Dataset (CSV)</h3>
          </div>
          <div style={{
            border: '2px dashed #cbd5e1', borderRadius: 12, padding: 32, textAlign: 'center', background: '#f8fafc',
            cursor: 'pointer'
          }}>
            <Upload size={32} style={{ color: '#2563eb', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13, color: '#475569', fontWeight: 600, marginBottom: 12 }}>Drag and drop CSV file here or</p>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Choose File'}
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>Only CSV files are allowed. (Max size: 10MB)</p>
          </div>
          {validationMsg && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8,
              background: validationOk ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${validationOk ? '#bbf7d0' : '#fecaca'}`,
              color: validationOk ? '#15803d' : '#dc2626',
              fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
            }}>
              {validationOk ? <CheckCircle2 size={16} /> : '⚠️'} {validationMsg}
            </div>
          )}
        </div>

        {/* Dataset Validation Box - live from API */}
        <div className="card" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            <CheckCircle2 size={20} /> Dataset is valid!
          </div>
          <p style={{ fontSize: 12, color: '#065f46', marginBottom: 14 }}>All required columns are present.</p>

          {datasetInfo ? (
            <table style={{ fontSize: 12, width: '100%', color: '#064e3b' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', width: 140 }}>Total Records</td>
                  <td style={{ fontWeight: 700 }}>: {datasetInfo.total_records?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Unique Students</td>
                  <td style={{ fontWeight: 700 }}>: {datasetInfo.unique_students?.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Missing Values</td>
                  <td style={{ fontWeight: 700 }}>: {Object.keys(datasetInfo.missing_values || {}).length === 0 ? '0' : JSON.stringify(datasetInfo.missing_values)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Branches</td>
                  <td style={{ fontWeight: 700 }}>: {datasetInfo.branches?.length} ({datasetInfo.branches?.join(', ')})</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Joining Years</td>
                  <td style={{ fontWeight: 700 }}>: {datasetInfo.joining_years?.join(', ')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0' }}>Columns</td>
                  <td style={{ fontWeight: 700 }}>: {datasetInfo.columns?.length}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 12, color: '#047857' }}>Loading dataset info...</p>
          )}
        </div>
      </div>

      {/* 4 Stat Cards Row - live data */}
      <div className="stat-cards" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon red"><Database size={24} /></div>
          <div className="stat-info">
            <h3>{datasetInfo?.total_records?.toLocaleString() ?? '—'}</h3>
            <p>Total Records</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{datasetInfo?.unique_students?.toLocaleString() ?? '—'}</h3>
            <p>Unique Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Building2 size={24} /></div>
          <div className="stat-info">
            <h3>{datasetInfo?.branches?.length ?? '—'}</h3>
            <p>Branches</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow"><Calendar size={24} /></div>
          <div className="stat-info">
            <h3>{datasetInfo?.joining_years?.length ?? '—'}</h3>
            <p>Joining Years</p>
          </div>
        </div>
      </div>

      {/* Dataset Preview Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Dataset Preview</h3>
        </div>

        <div className="filters-bar">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              className="search-input"
              placeholder="Search by Roll Number, Name or Branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSearch}>Search</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Joining Year</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Attendance %</th>
                <th>Internal Marks</th>
                <th>Performance</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {(previewData?.records || []).map((r: any, idx: number) => {
                const sno = ((page - 1) * 50) + idx + 1;
                const status = r.Semester_Status || 'Current';
                const perf = r.Semester_Performance || 'Medium';
                const risk = r.Pass_At_Risk || 'Pass';
                const isAtRisk = risk === 'At-Risk';

                return (
                  <tr key={idx}>
                    <td>{sno}</td>
                    <td style={{ fontWeight: 600, color: '#1e40af' }}>{r.Student_ID}</td>
                    <td>{r.Student_Name}</td>
                    <td>{r.Branch}</td>
                    <td>{r.Joining_Year}</td>
                    <td>{r.Semester}</td>
                    <td><span className={`badge badge-${status.toLowerCase()}`}>{status}</span></td>
                    <td>{r.Attendance_Percent != null ? `${r.Attendance_Percent}%` : '—'}</td>
                    <td>{r.Internal_Marks != null ? r.Internal_Marks : '—'}</td>
                    <td><span className={`badge badge-${perf.toLowerCase()}`}>{perf}</span></td>
                    <td><span className={`badge ${isAtRisk ? 'badge-at-risk' : 'badge-pass'}`}>{isAtRisk ? 'At Risk' : 'Pass'}</span></td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 30 }}>Loading dataset records...</td>
                </tr>
              )}

              {!loading && !previewData?.records?.length && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {previewData && previewData.total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, previewData.total)} of {previewData.total?.toLocaleString()} records
            </div>
            <div className="pagination-buttons">
              <button disabled={page <= 1} onClick={() => loadDatasetData(page - 1)}>«</button>
              {Array.from({ length: Math.min(previewData.total_pages, 5) }, (_, i) => {
                let p = i + 1;
                if (previewData.total_pages > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > previewData.total_pages) p = previewData.total_pages - (4 - i);
                }
                return (
                  <button key={p} className={page === p ? 'active' : ''} onClick={() => loadDatasetData(p)}>{p}</button>
                );
              })}
              <button disabled={page >= previewData.total_pages} onClick={() => loadDatasetData(page + 1)}>»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
