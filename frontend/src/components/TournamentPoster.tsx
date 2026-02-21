// src/components/TournamentPoster.jsx
export default function TournamentPoster() {
  return (
    <div className="bg-gradient-to-b from-blue-950 to-black border border-blue-900/50 rounded-2xl overflow-hidden shadow-2xl">
      {/* Imagen hero */}
      <div className="h-48 bg-gray-800 relative">
        {/* Aquí iría <img src="peleadores.jpg" className="w-full h-full object-cover" /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-bold text-white">CORCOM CHAMPIONSHIP</h2>
          <p className="text-blue-300">FEB 2025</p>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Fecha límite inscripción</span>
          <span className="text-xl font-bold text-yellow-400">20 FEB</span>
        </div>

        <div className="bg-gray-900/70 p-4 rounded-xl">
          <p className="text-sm text-gray-300 mb-2">Premiación</p>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-yellow-400">1°</p>
              <p className="text-xs text-gray-400">$8,000</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-300">2°</p>
              <p className="text-xs text-gray-400">$4,000</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">3°</p>
              <p className="text-xs text-gray-400">$2,000</p>
            </div>
          </div>
        </div>

        {/* QR simulado */}
        <div className="flex justify-center my-4">
          <div className="w-32 h-32 bg-white p-2 rounded-xl">
            {/* Aquí QR real */}
            <div className="w-full h-full bg-gray-300" />
          </div>
        </div>

        <button className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-medium">
          Inscribirme ahora
        </button>
      </div>
    </div>
  );
}