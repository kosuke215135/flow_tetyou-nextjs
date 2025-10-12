'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { generateSmallStepActionPlan, resetYurufuwaMeter } from '@/lib/actions';
// import ActionPlanCard from './ActionPlanCard'; // 削除

// SWRのfetcher関数
const fetcher = (url: string) => fetch(url).then(res => res.json());

const THRESHOLD = 1.0;
const LOCAL_STORAGE_KEY = 'doitkun_action_plans'; // LocalStorageのキー

export default function DoitKunArea() {
  const { data: user } = useSWR('/api/user', fetcher, {
    refreshInterval: 5000, // 5秒ごとにポーリング
  });

  const currentValue = user?.yurufuwaMeter ?? 0;

  const [isSummoned, setIsSummoned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // LocalStorageから初期値を読み込む
  const [actionPlans, setActionPlans] = useState<Array<{ title: string; steps: string[]; comment: string }>>(() => {
    if (typeof window !== 'undefined') { // ブラウザ環境でのみLocalStorageにアクセス
      const savedPlans = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedPlans ? JSON.parse(savedPlans) : [];
    }
    return [];
  });
  const [error, setError] = useState<string | null>(null);

  // actionPlansが更新されたらLocalStorageに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(actionPlans));
    }
  }, [actionPlans]);

  useEffect(() => {
    console.log("DoitKunArea useEffect triggered. currentValue:", currentValue, "isSummoned:", isSummoned);
    if (currentValue >= THRESHOLD && !isSummoned) {
      setIsSummoned(true);
      const generatePlans = async () => {
        console.log("Threshold reached. Generating plans...");
        setIsLoading(true);
        setError(null);

        // 先にメーターをリセット
        await resetYurufuwaMeter();

        try {
          const response = await generateSmallStepActionPlan();
          console.log("Response from server action:", response);
          if (response.success && response.data) {
            // 新しいプランのグループを既存のリストの先頭に追加
            setActionPlans(prevPlans => [response.data, ...prevPlans]);
          } else {
            setError(response.error || 'Failed to generate action plans.');
          }
        } catch (e) {
          console.error("Error calling generateSmallStepActionPlan:", e);
          setError('An unexpected error occurred.');
        }
        setIsLoading(false);
      };
      generatePlans();
    }

    // メーターがリセットされたことを検知して、isSummonedをfalseにする (actionPlansはリセットしない)
    if (currentValue < THRESHOLD && isSummoned) {
      console.log("Meter reset. Hiding Doit-kun (animation only).");
      setIsSummoned(false);
      // actionPlansはリセットしない
      setError(null);
    }
  }, [currentValue, isSummoned, actionPlans]);

  console.log("Rendering DoitKunArea with state:", { isLoading, error, actionPlans, isSummoned });

  // ドゥイットくんの表示条件: ユーザーがいない、またはプランもなくローディング中でもない場合は待機メッセージを表示
  if (!user || (actionPlans.length === 0 && !isLoading)) {
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
      <h2 className="text-lg font-bold mb-4 text-center">ドゥイットくん召喚！</h2>
      <div className="flex justify-center mb-6">
        <img
          src="/doitkun.webp"
          alt="ドゥイットくん"
          className="w-40 h-40 rounded-full object-cover border-4 border-blue-400 shadow-lg"
        />
      </div>
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
          <p className="text-base font-semibold text-blue-600">ドゥイットくんが考え中...</p>
          <p className="text-sm text-gray-500">小さな一歩を計算してるぞ！</p>
        </div>
      )}
      {error && <p className="text-sm text-red-500 text-center">エラー: {error}</p>}
      {actionPlans.length > 0 && (
        <div className="mt-4 space-y-4"> {/* カード間のスペース */}
          {actionPlans.map((plan, planIndex) => (
            <div key={planIndex} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-base font-bold mb-3 text-blue-600">
                {plan.title}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-800 mb-3">
                {plan.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-600 italic border-t pt-2 mt-2">
                {plan.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
