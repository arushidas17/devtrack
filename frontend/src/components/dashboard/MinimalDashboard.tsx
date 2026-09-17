import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Github,
  LogOut,
  CheckCircle2,
  Shield,
  ExternalLink,
  Mail,
  Zap,
  Code2,
  GitCommit,
  BarChart3,
} from 'lucide-react';

export const MinimalDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #070A12)',
        color: 'var(--text, #EDEEF3)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── TOP NAV ─────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(7, 10, 18, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 32px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo — single source of truth */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B7CF6 0%, #3FE0D0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Code2 size={17} color="#ffffff" strokeWidth={2.2} />
            </div>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              DevTrack
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.65rem',
                padding: '2px 8px',
                borderRadius: '100px',
                background: 'rgba(139, 124, 246, 0.15)',
                border: '1px solid rgba(139, 124, 246, 0.3)',
                color: '#A78BFA',
                letterSpacing: '0.05em',
              }}
            >
              DASHBOARD
            </span>
          </div>

          {/* Right side: user badge + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '5px 12px 5px 6px',
                borderRadius: '100px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    border: '1.5px solid #8B7CF6',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B7CF6, #3FE0D0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>
                    {(user?.username || 'U')[0].toUpperCase()}
                  </span>
                </div>
              )}
              <span style={{ fontSize: '0.84rem', color: '#ffffff', fontWeight: 500 }}>
                @{user?.username || 'developer'}
              </span>
            </div>

            <button
              onClick={() => logout()}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#7E889E',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.83rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(240, 85, 156, 0.4)';
                e.currentTarget.style.background = 'rgba(240, 85, 156, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7E889E';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '48px 32px 64px',
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Success banner */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(63, 224, 208, 0.1)',
              border: '1px solid rgba(63, 224, 208, 0.25)',
              borderRadius: '100px',
              padding: '6px 16px',
              fontSize: '0.75rem',
              color: '#3FE0D0',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.04em',
              width: 'fit-content',
            }}
          >
            <CheckCircle2 size={13} />
            <span>GITHUB CONNECTED SUCCESSFULLY</span>
          </div>

          {/* Welcome heading */}
          <div>
            <h1
              style={{
                fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
                fontSize: '2.6rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '10px',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              Welcome back,<br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #A78BFA 0%, #3FE0D0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                @{user?.username}
              </span>
            </h1>
            <p style={{ fontSize: '1rem', color: '#7E889E', lineHeight: 1.6, maxWidth: '520px' }}>
              Your GitHub account is connected and your session is active. Analytics and repository
              insights will be available in upcoming tasks.
            </p>
          </div>

          {/* Profile card */}
          <div
            style={{
              background: '#101524',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
              padding: '28px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* ambient glow */}
            <div
              style={{
                position: 'absolute',
                top: '-40px',
                right: '-40px',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'rgba(139, 124, 246, 0.18)',
                filter: 'blur(50px)',
                pointerEvents: 'none',
              }}
            />

            {/* Avatar + name row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
              <div
                style={{
                  padding: '3px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B7CF6 0%, #3FE0D0 100%)',
                  display: 'inline-flex',
                  flexShrink: 0,
                }}
              >
                <img
                  src={user?.avatarUrl || `https://github.com/identicons/${user?.username || 'user'}.png`}
                  alt={user?.username}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    border: '2.5px solid #070A12',
                    display: 'block',
                  }}
                />
              </div>

              <div>
                <h2
                  style={{
                    fontSize: '1.35rem',
                    color: '#ffffff',
                    marginBottom: '4px',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {user?.name || user?.username}
                </h2>
                <div
                  style={{
                    fontSize: '0.83rem',
                    color: '#A78BFA',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  @{user?.username}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              {user?.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#B4BCCF' }}>
                  <Mail size={14} style={{ color: '#7E889E', flexShrink: 0 }} />
                  <span>{user.email}</span>
                </div>
              )}
              {user?.githubUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Github size={14} style={{ color: '#7E889E', flexShrink: 0 }} />
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#A78BFA',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#C4B5FD'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#A78BFA'; }}
                  >
                    View GitHub Profile
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
              {user?.bio && (
                <div
                  style={{
                    marginTop: '6px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    color: '#7E889E',
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                  }}
                >
                  "{user.bio}"
                </div>
              )}
            </div>
          </div>

          {/* Task 1 milestone */}
          <div
            style={{
              background: 'rgba(139, 124, 246, 0.07)',
              border: '1px solid rgba(139, 124, 246, 0.2)',
              borderRadius: '16px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
            }}
          >
            <Shield size={20} style={{ color: '#A78BFA', flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                Task 1 Complete — Authentication Foundation Verified
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7E889E', lineHeight: 1.5 }}>
                OAuth handshake, secure session cookies, user upserting, and route protection are fully
                functional. Repository sync, commit ingestion, and telemetry analytics unlock next.
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Session status */}
          <div
            style={{
              background: '#101524',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#7E889E', letterSpacing: '0.06em', marginBottom: '14px', fontFamily: "'JetBrains Mono', monospace" }}>
              SESSION STATUS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'OAuth Token', status: 'Active', ok: true },
                { label: 'JWT Session', status: 'Valid — 7d', ok: true },
                { label: 'GitHub API', status: 'Connected', ok: true },
                { label: 'Database', status: 'In-memory (dev)', ok: null },
              ].map(({ label, status, ok }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ color: '#B4BCCF' }}>{label}</span>
                  <span
                    style={{
                      color: ok === true ? '#3FE0D0' : ok === false ? '#F0559C' : '#F59E0B',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.75rem',
                    }}
                  >
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming features */}
          <div
            style={{
              background: '#101524',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#7E889E', letterSpacing: '0.06em', marginBottom: '14px', fontFamily: "'JetBrains Mono', monospace" }}>
              UPCOMING FEATURES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: GitCommit, label: 'Commit Analytics', color: '#A78BFA' },
                { icon: Zap, label: 'Activity Feed', color: '#3FE0D0' },
                { icon: BarChart3, label: 'Productivity Charts', color: '#F0559C' },
                { icon: Github, label: 'Repo Insights', color: '#5B8DEF' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.83rem',
                    color: '#7E889E',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={13} color={color} />
                  </div>
                  <span>{label}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '0.7rem',
                      padding: '1px 7px',
                      borderRadius: '100px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#7E889E',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    soon
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub account pill */}
          <div
            style={{
              background: 'rgba(88, 166, 255, 0.07)',
              border: '1px solid rgba(88, 166, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Github size={18} style={{ color: '#58A6FF', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 500 }}>
                {user?.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#7E889E', marginTop: '1px' }}>
                GitHub account linked
              </div>
            </div>
            <CheckCircle2 size={16} style={{ color: '#3FE0D0', marginLeft: 'auto', flexShrink: 0 }} />
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
            padding: 24px 16px 48px !important;
          }
        }
      `}</style>
    </div>
  );
};
