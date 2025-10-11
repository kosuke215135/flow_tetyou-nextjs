'use client';

import { useState, useEffect } from 'react';
import { generateSmallStepActionPlan } from '@/lib/actions';

interface DoitKunAreaProps {
  currentValue: number;
  maxValue?: number;
}

const THRESHOLD = 1.0;

export default function DoitKunArea({ currentValue, maxValue = 1.0 }: DoitKunAreaProps) {
  const [isSummoned, setIsSummoned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [actionPlans, setActionPlans] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentValue >= THRESHOLD && !isSummoned) {
      setIsSummoned(true);
      const generatePlans = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await generateSmallStepActionPlan();
          if (response.success && response.data) {
            setActionPlans(response.data);
          } else {
            setError(response.error || 'Failed to generate action plans.');
          }
        } catch (e) {
          setError('An unexpected error occurred.');
        }
        setIsLoading(false);
      };
      generatePlans();
    }

    // メーターがリセットされたことを検知して、表示をリセット
    if (currentValue < THRESHOLD && isSummoned) {
      setIsSummoned(false);
      setActionPlans([]);
      setError(null);
    }
  }, [currentValue, isSummoned]);

  if (currentValue < THRESHOLD && !isSummoned) {
    return (
      <div>
        <h2 className="text-lg font-bold mb-4">ドゥイットくん</h2>
        <div className="text-sm text-gray-500">
          <p>ゆるふわメーターがたまると、ここにドゥイットくんが現れます。</p>
        </div>
      </div>
    );
  }

  // TODO: 魔法陣アニメーションを追加

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">ドゥイットくん召喚！</h2>
      {isLoading && <p className="text-sm">アクションプランを生成中...</p>}
      {error && <p className="text-sm text-red-500">エラー: {error}</p>}
      {actionPlans.length > 0 && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-inner">
          <p className="text-sm font-semibold mb-2">君への「小さな一歩」の提案だよ！</p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-800">
            {actionPlans.map((plan, index) => (
              <li key={index}>{plan}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
