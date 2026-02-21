// src/components/BracketSimple.jsx
export default function BracketSimple({ title = "Corcom Champion" }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>

      <div className="space-y-6 text-sm">
        <div className="flex justify-between items-center">
          <div className="bg-blue-900/60 px-4 py-2 rounded-lg">Juvenil A</div>
          <div className="text-gray-400">→</div>
          <div className="bg-red-900/60 px-4 py-2 rounded-lg">Final</div>
        </div>

        <div className="flex justify-between items-center">
          <div className="bg-blue-900/60 px-4 py-2 rounded-lg">Infantil B</div>
          <div className="text-gray-400">→</div>
          <div className="bg-red-900/60 px-4 py-2 rounded-lg">Campeón</div>
        </div>

        {/* Líneas simuladas */}
        <div className="relative h-1 bg-gray-700 my-2">
          <div className="absolute left-1/2 -top-3 w-px h-6 bg-gray-500" />
        </div>
      </div>
    </div>
  );
}