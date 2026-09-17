import React from 'react';
import { AlertCircle, Github, ArrowRight, Home } from 'lucide-react';

interface AuthErrorScreenProps {
  error?: string | null;
  onRetry: () => void;
  onBackHome: () => void;
}

export const AuthErrorScreen: React.FC<AuthErrorScreenProps> = ({
  error,
  onRetry,
  onBackHome,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at top, #1E1228 0%, #070A12 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: 'rgba(16, 21, 36, 0.85)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          border: '1px solid rgba(240, 85, 156, 0.3)',
          borderRadius: '22px',
          padding: '42px 36px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85), 0 0 50px rgba(240, 85, 156, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Amber/Rose Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'rgba(240, 85, 156, 0.2)',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }}
        />

        {/* Warning Icon Container */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'rgba(240, 85, 156, 0.1)',
            border: '1.5px solid rgba(240, 85, 156, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F0559C',
            marginBottom: '22px',
            boxShadow: '0 0 30px rgba(240, 85, 156, 0.2)',
          }}
        >
          <AlertCircle size={36} />
        </div>

        {/* Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(240, 85, 156, 0.12)',
            border: '1px solid rgba(240, 85, 156, 0.3)',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '0.74rem',
            color: '#F0559C',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            marginBottom: '14px',
          }}
        >
          <span>AUTHENTICATION ERROR</span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
            fontSize: '1.55rem',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}
        >
          GitHub connection failed
        </h2>

        {/* Friendly explanation */}
        <p
          style={{
            fontSize: '0.9rem',
            color: '#EDEEF3',
            lineHeight: 1.5,
            marginBottom: '12px',
            maxWidth: '380px',
          }}
        >
          We couldn't complete your GitHub authentication.
        </p>

        {/* Error Detail Pill */}
        {error && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: '#B4BCCF',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '28px',
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {error}
          </div>
        )}

        {!error && (
          <p
            style={{
              fontSize: '0.84rem',
              color: '#7E889E',
              marginBottom: '28px',
            }}
          >
            Please make sure you approved the authorization request or try connecting again.
          </p>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button
            onClick={onRetry}
            style={{
              background: 'linear-gradient(135deg, #8B7CF6 0%, #7C3AED 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 24px',
              fontSize: '0.96rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(139, 124, 246, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <Github size={18} />
            <span>Try Connecting Again</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onBackHome}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#EDEEF3',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <Home size={16} />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
