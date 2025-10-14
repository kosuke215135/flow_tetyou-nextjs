// キャラクター型定義

export type CharacterType = 'doitkun' | 'listener';

export interface CharacterInfo {
  id: CharacterType;
  name: string;
  image: string;
  emoji: string;
  description: string;
  catchphrase: string;
}

export const CHARACTERS: Record<CharacterType, CharacterInfo> = {
  doitkun: {
    id: 'doitkun',
    name: 'ドゥイットくん',
    image: '/doitkun.webp',
    emoji: '💪',
    description: '脳筋行動派のパーソナルトレーナー（ニート）',
    catchphrase: 'オレが「なぜ？」を繰り返して、君の思考を深堀りしてやるぜ',
  },
  listener: {
    id: 'listener',
    name: 'リスナーさん',
    image: '/listen.webp',
    emoji: '🌙',
    description: 'ダウナー系・甘やかしメンタルコーチ',
    catchphrase: '焦らなくても大丈夫。一緒にゆっくり考えていこう',
  },
};
