import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import MessageBanner from '../components/MessageBanner';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/AdminEmailJobs.css';

export default function AdminEmailJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const [selectedJob, setSelectedJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/utilities/email-jobs?limit=${limit}&page=${page}`);
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const openJob = async (jobId) => {
    setJobLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await api.get(`/admin/utilities/email-jobs/${jobId}`);
      setSelectedJob(res.data.job);
    } catch (err) {
      setError('Failed to load job details: ' + (err.response?.data?.message || err.message));
    } finally {
      setJobLoading(false);
    }
  };

  const closeJob = () => setSelectedJob(null);

  const sendNow = (jobId) => {
    setConfirm({
      open: true,
      title: 'Send Email Now',
      message: 'Send this email now?',
      onConfirm: async () => {
        setConfirm({ open: false });
        setError(null);
        setSuccessMessage(null);
        try {
          await api.post(`/admin/utilities/email-jobs/${jobId}/send`);
          setSuccessMessage('Send attempted — check job status');
          fetchJobs();
          openJob(jobId);
        } catch (err) {
          setError('Failed to send job: ' + (err.response?.data?.error || err.message));
        }
      },
    });
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const retryJob = async (jobId) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await api.post(`/admin/utilities/email-jobs/${jobId}/retry`);
      fetchJobs();
      setSuccessMessage('Job requeued');
    } catch (err) {
      setError('Failed to retry job: ' + (err.response?.data?.message || err.message));
    }
  };

  const runBadges = () => {
    setConfirm({
      open: true,
      title: 'Trigger Badge Engine',
      message: 'Trigger badge engine now?',
      onConfirm: async () => {
        setConfirm({ open: false });
        setError(null);
        setSuccessMessage(null);
        try {
          await api.post('/admin/utilities/run-badges');
          setSuccessMessage('Badge engine triggered');
        } catch (err) {
          setError('Failed to trigger badge engine: ' + (err.response?.data?.message || err.message));
        }
      },
    });
  };

  const retryAllFailed = () => {
    setConfirm({
      open: true,
      title: 'Requeue Failed Jobs',
      message: 'Requeue all failed email jobs?',
      onConfirm: async () => {
        setConfirm({ open: false });
        setError(null);
        setSuccessMessage(null);
        try {
          const res = await api.post('/admin/utilities/email-jobs/retry-all');
          setSuccessMessage(`Requeued ${res.data.modifiedCount || 0} jobs`);
          fetchJobs();
        } catch (err) {
          setError('Failed to requeue jobs: ' + (err.response?.data?.message || err.message));
        }
      },
    });
  };

  return (
    <div className="admin-email-jobs container">
      <div className="admin-email-jobs__header">
        <h1>Email Job Queue</h1>
        <div className="admin-email-jobs__actions">
          <button className="btn btn-primary" onClick={fetchJobs}>Refresh</button>
          <button className="btn" onClick={runBadges}>Run Badge Engine</button>
        </div>
      </div>

      {loading && <div>Loading jobs...</div>}
      {error && (
        <MessageBanner
          type="error"
          title="Email jobs error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {successMessage && (
        <MessageBanner
          type="success"
          title="Email jobs"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {!loading && !error && (
        <div>
        <table className="admin-email-jobs__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>To</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job._id}>
                <td>{job._id}</td>
                <td>{job.to}</td>
                <td>{job.subject}</td>
                <td>{job.status}</td>
                <td>{job.attempts}</td>
                <td>{new Date(job.createdAt).toLocaleString()}</td>
                <td>
                  <button className="btn" onClick={() => openJob(job._id)}>View</button>
                  {job.status !== 'pending' && (
                    <button className="btn" onClick={() => retryJob(job._id)}>Retry</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Job detail modal */}
        {selectedJob && (
          <>
            <div className="job-overlay" onClick={closeJob}></div>
            <div className="job-modal" role="dialog" aria-modal="true">
              <div className="job-modal__header">
                <h3>Job: {selectedJob._id}</h3>
                <div>
                  <button className="btn" onClick={() => retryJob(selectedJob._id)}>Retry</button>
                  <button className="btn btn-primary" onClick={() => sendNow(selectedJob._id)}>Send Now</button>
                  <button className="btn" onClick={closeJob}>Close</button>
                </div>
              </div>
              <div className="job-modal__body">
                <div><strong>To:</strong> {selectedJob.to}</div>
                <div><strong>Subject:</strong> {selectedJob.subject}</div>
                <div><strong>Status:</strong> {selectedJob.status}</div>
                <div><strong>Attempts:</strong> {selectedJob.attempts}</div>
                <div><strong>Last Error:</strong> <span style={{color:'#c00'}}>{selectedJob.lastError || 'None'}</span></div>
                <div style={{marginTop:8}}><strong>Payload / Template Data</strong></div>
                <pre className="job-modal__pre">{JSON.stringify(selectedJob.data || { body: selectedJob.body }, null, 2)}</pre>
                {selectedJob.body && (
                  <>
                    <div style={{marginTop:8}}><strong>Rendered Body</strong></div>
                    <div className="job-modal__pre">{selectedJob.body}</div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        </div>
        )}

        <div className="admin-email-jobs__pagination">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span>Page {page}</span>
          <button className="btn" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
    </div>
  );
}
