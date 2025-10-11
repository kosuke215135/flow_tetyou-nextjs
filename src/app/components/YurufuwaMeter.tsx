'use client';

import { Progress } from "@/app/components/ui/progress";

interface YurufuwaMeterProps {
  currentValue: number;
  maxValue?: number;
}

export default function YurufuwaMeter({ currentValue, maxValue = 1.0 }: YurufuwaMeterProps) {
  const progress = Math.min((currentValue / maxValue) * 100, 100);

  return (
    <div className="w-1/2 max-w-md mx-auto">
      <div className="text-center mb-1">
        <span className="text-sm font-bold text-gray-200">
          ゆるふわメーター
        </span>
      </div>
      <Progress value={progress} className="h-3 bg-gray-600 [&>div]:bg-sky-400" />
      <div className="text-center mt-1">
        <span className="text-xs text-gray-400">
          {currentValue.toFixed(2)} / {maxValue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
