import React from 'react';
import { Github, Sparkles } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Authenticating with GitHub...'
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at top, #161233 0%, #070A12 70%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          background: 'rgba(16, 21, 36, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 124, 246, 0.35)',
          borderRadius: '20px',
          padding: '40px 36px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 50px rgba(139, 124, 246, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: 'rgba(139, 124, 246, 0.25)',
            filter: 'blur(45px)',
            pointerEvents: 'none',
          }}
        />

        {/* Animated Icon Container */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(139, 124, 246, 0.25) 0%, rgba(167, 139, 250, 0.1) 100%)',
            border: '1.5px solid rgba(139, 124, 246, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#A78BFA',
            marginBottom: '24px',
            boxShadow: '0 0 30px rgba(139, 124, 246, 0.3)',
            animation: 'pulseGlow 2s infinite ease-in-out',
          }}
        >
          <Github size={36} />
        </div>

        {/* Brand Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(139, 124, 246, 0.12)',
            border: '1px solid rgba(139, 124, 246, 0.3)',
            borderRadius: '100px',
            padding: '4px 12px',
            fontSize: '0.74rem',
            color: '#A78BFA',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            marginBottom: '14px',
          }}
        >
          <Sparkles size={12} />
          <span>DEVTRACK SECURE AUTH</span>
        </div>

        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Outfit', 'Space Grotesk', sans-serif",
            fontSize: '1.45rem',
            fontWeight: 600,
            color: '#ffffff',
            marginBottom: '10px',
            letterSpacing: '-0.02em',
          }}
        >
          {message}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.88rem',
            color: '#7E889E',
            lineHeight: 1.5,
            marginBottom: '28px',
            maxWidth: '320px',
          }}
        >
          Establishing secure OAuth handshake and initializing your developer session...
        </p>

        {/* Shimmering Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '45%',
              background: 'linear-gradient(90deg, #8B7CF6, #3FE0D0, #A78BFA)',
              borderRadius: '2px',
              animation: 'loadingSlide 1.5s infinite ease-in-out',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 25px rgba(139, 124, 246, 0.25);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 45px rgba(139, 124, 246, 0.45);
          }
        }
        @keyframes loadingSlide {
          0% {
            left: -45%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
