import React, { useState, useRef } from 'react';

interface SessionTimeoutViewProps {
  onRestart: () => void;
}

export const SessionTimeoutView: React.FC<SessionTimeoutViewProps> = ({ onRestart }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Efecto interactivo de inclinación 3D (tilt effect) al mover el mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calcular la posición relativa del cursor dentro de la tarjeta (-1 a 1)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Limitar la rotación máxima a 25 grados
    setCoords({ x: x * 25, y: -y * 25 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 }); // Restablecer posición normal al salir
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6 overflow-hidden relative">
      {/* Estilos CSS Inline para inyectar animaciones avanzadas y efectos 3D */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes rotate-3d {
          0% { transform: rotateY(0deg) rotateX(15deg); }
          50% { transform: rotateY(180deg) rotateX(25deg); }
          100% { transform: rotateY(360deg) rotateX(15deg); }
        }
        @keyframes sand-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
        .animate-rotate-3d {
          animation: rotate-3d 8s linear infinite;
          transform-style: preserve-3d;
        }
        .3d-perspective {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
        }
      `}</style>

      {/* Luces holográficas de fondo (Glow effects) */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Contenedor principal con perspectiva 3D */}
      <div className="3d-perspective w-full max-w-md">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${coords.y}deg) rotateY(${coords.x}deg) translateZ(${isHovered ? '20px' : '0px'})`,
          }}
          className="preserve-3d flex flex-col items-center bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_40px_rgba(37,99,235,0.1)] relative"
        >
          {/* Línea decorativa superior de neón */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

          {/* Icono/Animación 3D del Reloj de Arena Holográfico */}
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center animate-float-slow" style={{ transformStyle: 'preserve-3d' }}>
            {/* Círculo luminoso de fondo */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full filter blur-xl animate-pulse" />
            
            {/* Reloj SVG diseñado en perspectiva y rotación 3D */}
            <svg 
              className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)] animate-rotate-3d" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Soporte Superior/Inferior */}
              <path d="M5 2h14M5 22h14" strokeWidth="2" />
              {/* Vidrio del Reloj */}
              <path d="M19 2v3c0 3.5-3 5.5-3 5.5s3 2 3 5.5v3M5 2v3c0 3.5 3 5.5 3 5.5s-3 2-3 5.5v3" />
              {/* Arena cayendo (línea punteada animada) */}
              <line x1="12" y1="10" x2="12" y2="14" strokeDasharray="3 3" style={{ animation: 'sand-flow 1s linear infinite' }} />
              {/* Arena acumulada arriba */}
              <path d="M8 5c1.5-1 4.5-1 6 0l-3 4-3-4z" fill="currentColor" fillOpacity="0.3" />
              {/* Arena acumulada abajo */}
              <path d="M7 19c1.5 1 6.5 1 8 0l-4-4-4 4z" fill="currentColor" fillOpacity="0.5" />
            </svg>
          </div>

          {/* Título adaptado con tu clase personalizada 'text-subtitulo' */}
          <h2 
            className="text-subtitulo font-black tracking-tight text-white mb-3"
            style={{ transform: 'translateZ(30px)' }}
          >
            Sesión Expirada
          </h2>
          
          {/* Descripción adaptada con tu clase personalizada 'text-datos' */}
          <p 
            className="text-datos text-slate-400 mb-8 leading-relaxed px-2 text-center"
            style={{ transform: 'translateZ(20px)' }}
          >
            Por tu seguridad, hemos cerrado tu sesión automáticamente debido a <span className="text-cyan-400 font-semibold">30 minutos</span> de inactividad. Inicia sesión nuevamente para continuar gestionando tu academia.
          </p>

          {/* Botón de reinicio adaptado con tu clase personalizada 'text-label' */}
          <button
            onClick={onRestart}
            style={{ transform: 'translateZ(40px)' }}
            className="w-full py-4 px-6 text-label font-black uppercase tracking-[0.2em] bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Volver al portal principal
          </button>
          
          {/* Sello inferior discreto adaptado con tu clase personalizada 'text-caption' */}
          <span 
            className="text-caption text-slate-600 uppercase tracking-[0.3em] mt-6"
            style={{ transform: 'translateZ(10px)' }}
          >
            TKW SYSTEM • SECURITY GUARD
          </span>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutView;