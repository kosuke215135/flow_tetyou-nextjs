// ツリーの色分け用の定数とユーティリティ

export interface TreeColor {
  border: string;
  bg: string;
  accent: string;
  hover: string;
}

const TREE_COLORS: TreeColor[] = [
  {
    border: 'border-blue-300',
    bg: 'bg-blue-50',
    accent: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
  },
  {
    border: 'border-green-300',
    bg: 'bg-green-50',
    accent: 'bg-green-500',
    hover: 'hover:bg-green-600',
  },
  {
    border: 'border-purple-300',
    bg: 'bg-purple-50',
    accent: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
  },
  {
    border: 'border-pink-300',
    bg: 'bg-pink-50',
    accent: 'bg-pink-500',
    hover: 'hover:bg-pink-600',
  },
  {
    border: 'border-orange-300',
    bg: 'bg-orange-50',
    accent: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
  },
  {
    border: 'border-teal-300',
    bg: 'bg-teal-50',
    accent: 'bg-teal-500',
    hover: 'hover:bg-teal-600',
  },
];

export function getTreeColor(index: number): TreeColor {
  return TREE_COLORS[index % TREE_COLORS.length];
}
