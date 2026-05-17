import React, { useState, useRef } from 'react';

export const NotFoundView: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Efecto de inclinación 3D (tilt) al mover el mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setCoords({ x: x * 20, y: -y * 20 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-6 overflow-hidden relative">
      {/* Animaciones CSS personalizadas para efectos 3D y Glitch */}
      <style>{`
        @keyframes float-hologram {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes pulse-red-glow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes glitch-text {
          0% { text-shadow: 2px -2px 0px #ef4444, -2px 2px 0px #06b6d4; }
          25% { text-shadow: -2px 2px 0px #ef4444, -2px -2px 0px #06b6d4; }
          50% { text-shadow: -2px 2px 0px #06b6d4, 2px -2px 0px #ef4444; }
          75% { text-shadow: 2px 2px 0px #ef4444, -2px 2px 0px #06b6d4; }
          100% { text-shadow: 2px -2px 0px #ef4444, -2px 2px 0px #06b6d4; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float-hologram {
          animation: float-hologram 5s ease-in-out infinite;
        }
        .animate-pulse-red {
          animation: pulse-red-glow 5s ease-in-out infinite;
        }
        .animate-glitch {
          animation: glitch-text 1.5s linear infinite;
        }
        .animate-rotate-slow {
          animation: rotate-slow 20s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          transition: transform 0.15s ease-out;
        }
      `}</style>

      {/* Iluminación de fondo en color Rojo Combate y Azul Técnico */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse-red" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse-red" style={{ animationDelay: '2.5s' }} />

      {/* Contenedor con Perspectiva */}
      <div className="perspective-1000 w-full max-w-md">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${coords.y}deg) rotateY(${coords.x}deg) translateZ(${isHovered ? '25px' : '0px'})`,
          }}
          className="preserve-3d flex flex-col items-center bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_40px_rgba(239,68,68,0.05)] relative"
        >
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          {/* Icono/Holograma 3D: Tatami Virtual Desconectado */}
          <div 
            className="relative w-36 h-36 mb-6 flex items-center justify-center animate-float-hologram" 
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Brillo circular */}
            <div className="absolute inset-0 bg-red-500/20 rounded-full filter blur-xl animate-pulse" />
            
            {/* Brújula/Tatami SVG en rotación */}
            <div className="absolute w-28 h-28 border border-dashed border-red-500/30 rounded-full animate-rotate-slow" />
            
            <svg 
              className="w-20 h-20 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ transform: 'translateZ(30px)' }}
            >
              {/* Octágono que simula el área de combate (Tatami) */}
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              {/* Rayo de error en el centro que simula el golpe decisivo */}
              <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" fillOpacity="0.2" className="animate-pulse" />
            </svg>
          </div>

          {/* Gran Texto "K.O." animado utilizando escala masiva y estilo glitch */}
          <h1 
            className="text-titulo font-black tracking-widest text-white animate-glitch mb-1 select-none"
            style={{ transform: 'translateZ(45px)', fontFamily: 'Impact, sans-serif', fontSize: '6rem' }}
          >
            K.O.
          </h1>

          {/* Código de error técnico utilizando tu 'text-caption' */}
          <span className="text-caption text-slate-500 font-mono tracking-widest mb-2" style={{ transform: 'translateZ(10px)' }}>
            ERROR_CODE: 404_PAGE_OUT
          </span>

          {/* Texto de Alerta del referee utilizando tu 'text-subtitulo' */}
          <h2 
            className="text-subtitulo font-black uppercase tracking-widest text-red-500 mb-4 text-center"
            style={{ transform: 'translateZ(30px)' }}
          >
            ¡Página Fuera de Combate!
          </h2>
          
          {/* Descripción de alerta utilizando tu 'text-datos' */}
          <p 
            className="text-datos text-slate-400 mb-8 leading-relaxed px-4 text-center"
            style={{ transform: 'translateZ(20px)' }}
          >
            El referee ha terminado el conteo de 10 segundos. La ruta que buscas ha recibido un golpe de empeine decisivo y ha quedado fuera de servicio. Regresa a la esquina para recuperarte.
          </p>

          {/* Botón de retorno al inicio adaptado con tu 'text-label' */}
          <button
            onClick={handleGoHome}
            style={{ transform: 'translateZ(40px)' }}
            className="w-full py-4 px-6 text-label font-black uppercase tracking-[0.2em] bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.3)] hover:shadow-[0_4px_30px_rgba(239,68,68,0.5)] transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Recuperarse (Volver al Inicio)
          </button>
          
          {/* Marca de agua adaptada con tu 'text-caption' */}
          <span 
            className="text-caption text-slate-600 uppercase tracking-[0.3em] mt-6"
            style={{ transform: 'translateZ(10px)' }}
          >
            TKW SYSTEM • TECHNICAL KNOCKOUT
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotFoundView;