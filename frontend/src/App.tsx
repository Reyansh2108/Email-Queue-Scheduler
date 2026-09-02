import React, { useState } from 'react';
import axios from 'axios';
import { 
  Send, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Zap, 
  Inbox,
  Sparkles,
  ListFilter
} from 'lucide-react';

interface JobLog {
  id: string;
  recipientsCount: number;
  subject: string;
  timestamp: string;
  delay: number;
  status: 'queued' | 'processing' | 'failed';
}

export default function App() {
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delay, setDelay] = useState(2);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [logs, setLogs] = useState<JobLog[]>([]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    const recipientList = recipients.split(',').map((email) => email.trim()).filter(Boolean);

    try {
      const res = await axios.post('http://localhost:5001/api/schedule', {
        recipients: recipientList,
        subject,
        body,
        delayBetweenSeconds: Number(delay),
      });

      if (res.data.success) {
        setStatus({ type: 'success', message: 'Batch queued successfully to Redis & BullMQ!' });
        
        const newLog: JobLog = {
          id: Math.random().toString(36).substring(2, 8).toUpperCase(),
          recipientsCount: recipientList.length,
          subject,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          delay: Number(delay),
          status: 'queued',
        };
        setLogs((prev) => [newLog, ...prev]);

        setRecipients('');
        setSubject('');
        setBody('');
      }
    } catch (err: any) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Failed to communicate with backend server.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const totalEmailsQueued = logs.reduce((acc, item) => acc + item.recipientsCount, 0);

  return (
    <div style={styles.pageBackground}>
      {/* Top Ambient Glow */}
      <div style={styles.ambientGlow} />

      <div style={styles.container}>
        
        {/* Navigation Header */}
        <header style={styles.navHeader}>
          <div style={styles.brandGroup}>
            <div style={styles.brandIcon}>
              <Zap size={22} color="#60a5fa" />
            </div>
            <div>
              <div style={styles.brandTitle}>
                QueuePulse <span style={styles.versionBadge}>v1.0</span>
              </div>
              <p style={styles.brandSubtitle}>BullMQ & Express Email Dispatch Orchestrator</p>
            </div>
          </div>

          <div style={styles.systemStatus}>
            <span style={styles.statusDot} />
            <span style={styles.statusText}>Redis Worker Active</span>
          </div>
        </header>

        {/* Analytics Banner */}
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricIconWrap}>
              <Layers size={18} color="#93c5fd" />
            </div>
            <div>
              <div style={styles.metricValue}>{logs.length}</div>
              <div style={styles.metricLabel}>Total Batches Dispatched</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIconWrap}>
              <Mail size={18} color="#c084fc" />
            </div>
            <div>
              <div style={styles.metricValue}>{totalEmailsQueued}</div>
              <div style={styles.metricLabel}>Total Recipients Queued</div>
            </div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricIconWrap}>
              <Clock size={18} color="#34d399" />
            </div>
            <div>
              <div style={styles.metricValue}>{delay}s</div>
              <div style={styles.metricLabel}>Active Throttle Delay</div>
            </div>
          </div>
        </div>

        {/* Main Section */}
        <div style={styles.mainGrid}>
          
          {/* Dispatch Form Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Sparkles size={18} color="#60a5fa" />
              <h2 style={styles.cardTitle}>New Email Campaign</h2>
            </div>

            <form onSubmit={handleSchedule} style={styles.form}>
              
              <div>
                <label style={styles.label}>Recipients</label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="alex@company.com, sarah@company.com"
                  required
                  style={styles.input}
                />
                <span style={styles.fieldHint}>Separate multiple email addresses with commas.</span>
              </div>

              <div>
                <label style={styles.label}>Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Q3 Product Roadmap Update"
                  required
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Email Body Text</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content here..."
                  rows={4}
                  required
                  style={styles.textarea}
                />
              </div>

              <div>
                <label style={styles.label}>Queue Delay Between Emails (Seconds)</label>
                <div style={styles.inputWithIcon}>
                  <Clock size={16} color="#9ca3af" style={styles.innerIcon} />
                  <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(Number(e.target.value))}
                    min="1"
                    style={{ ...styles.input, paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" style={{ marginRight: '8px' }} />
                    Enqueueing Job...
                  </>
                ) : (
                  <>
                    <Send size={18} style={{ marginRight: '8px' }} />
                    Dispatch Email Batch
                  </>
                )}
              </button>
            </form>

            {/* Notification Alert */}
            {status.message && (
              <div style={status.type === 'success' ? styles.alertSuccess : styles.alertError}>
                {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          {/* Real-time Queue Feed */}
          <div style={styles.card}>
            <div style={styles.cardHeaderBetween}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ListFilter size={18} color="#c084fc" />
                <h2 style={styles.cardTitle}>Live Job Stream</h2>
              </div>
              <span style={styles.feedBadge}>{logs.length} jobs</span>
            </div>

            {logs.length === 0 ? (
              <div style={styles.emptyFeed}>
                <div style={styles.emptyIconCircle}>
                  <Inbox size={28} color="#6b7280" />
                </div>
                <p style={styles.emptyFeedTitle}>No queued jobs yet</p>
                <p style={styles.emptyFeedSub}>Submitted email batches will show up here with live status telemetry.</p>
              </div>
            ) : (
              <div style={styles.logContainer}>
                {logs.map((log) => (
                  <div key={log.id} style={styles.logCard}>
                    <div style={styles.logTopRow}>
                      <span style={styles.jobId}>#{log.id}</span>
                      <span style={styles.statusTagQueued}>
                        <RefreshCw size={10} style={{ marginRight: '4px' }} />
                        QUEUED
                      </span>
                    </div>

                    <div style={styles.logSubject}>{log.subject}</div>

                    <div style={styles.logMetaRow}>
                      <div style={styles.logMetaItem}>
                        <Mail size={12} color="#9ca3af" />
                        <span>{log.recipientsCount} Recipient(s)</span>
                      </div>
                      <div style={styles.logMetaItem}>
                        <Clock size={12} color="#9ca3af" />
                        <span>{log.delay}s delay</span>
                      </div>
                      <div style={styles.logMetaItem}>
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  pageBackground: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '32px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: '-150px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(147,51,234,0.08) 50%, rgba(15,23,42,0) 100%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  navHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    paddingBottom: '20px',
    borderBottom: '1px solid #1e293b',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  brandIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  versionBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
  },
  brandSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '13px',
    color: '#94a3b8',
  },
  systemStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 8px #10b981',
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#34d399',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  metricCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    backdropFilter: 'blur(12px)',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  metricIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(16px)',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  cardHeaderBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  feedBadge: {
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid #1e293b',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  fieldHint: {
    display: 'block',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '8px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    color: '#f8fafc',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
  },
  inputWithIcon: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  innerIcon: {
    position: 'absolute',
    left: '12px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  alertSuccess: {
    marginTop: '16px',
    padding: '12px 14px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#6ee7b7',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  alertError: {
    marginTop: '16px',
    padding: '12px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
  },
  emptyFeed: {
    textAlign: 'center',
    padding: '48px 16px',
  },
  emptyIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px',
  },
  emptyFeedTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#cbd5e1',
    margin: '0 0 4px 0',
  },
  emptyFeedSub: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    maxWidth: '260px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '420px',
    overflowY: 'auto',
  },
  logCard: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '14px',
  },
  logTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  jobId: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#60a5fa',
    fontFamily: 'monospace',
  },
  statusTagQueued: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10px',
    fontWeight: '700',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.2)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  logSubject: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: '10px',
  },
  logMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  logMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
};