'use client';

import { useDroppable } from '@dnd-kit/core';

export default function DoitKunArea() {
  const { isOver, setNodeRef } = useDroppable({
    id: 'doitkun-drop-zone',
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-4 text-center">💪 ドゥイットくんエリア</h2>

      <div
        ref={setNodeRef}
        className={`
          min-h-[300px]
          border-4 border-dashed rounded-lg
          flex flex-col items-center justify-center
          transition-all duration-200
          ${isOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src="/doitkun.webp"
            alt="ドゥイットくん"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-md"
          />
          <div className="text-center px-4">
            <p className="text-base font-semibold text-gray-700 mb-2">
              ここにノートをドロップして深堀りを始めよう！
            </p>
            <p className="text-sm text-gray-500">
              オレが「なぜ？」を繰り返して、君の思考を深堀りしてやるぜ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
