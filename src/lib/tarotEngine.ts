import { TarotCard, majorArcana } from '../data/tarotData';

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position?: 'past' | 'present' | 'future';
}

export interface Reading {
  mode: 'single' | 'three';
  cards: DrawnCard[];
  summary?: string;
}

export function drawCards(count: number): DrawnCard[] {
  const shuffled = [...majorArcana].sort(() => Math.random() - 0.5);
  const drawn = shuffled.slice(0, count);
  return drawn.map(card => ({
    card,
    reversed: Math.random() > 0.6,
  }));
}

export function assignPositions(cards: DrawnCard[]): DrawnCard[] {
  const positions: ('past' | 'present' | 'future')[] = ['past', 'present', 'future'];
  return cards.map((card, i) => ({
    ...card,
    position: positions[i],
  }));
}

const positionLabels = {
  past: '过去',
  present: '现在',
  future: '未来',
};

export function generateSingleSummary(card: DrawnCard): string {
  const meaning = card.reversed ? card.card.reversedMeaning : card.card.uprightMeaning;
  const orientation = card.reversed ? '（逆位）' : '（正位）';
  return `今日的塔罗信息来自《${card.card.name}》${orientation}。\n\n${meaning}\n\n✦ 今日建议：${card.card.shortAdvice}`;
}

export function generateThreeSummary(cards: DrawnCard[]): string {
  const lines: string[] = [];
  lines.push('✦ 三牌阵的整体信息 ✦\n');

  for (const card of cards) {
    const label = positionLabels[card.position!] || '';
    const orientation = card.reversed ? '逆位' : '正位';
    const meaning = card.reversed ? card.card.reversedMeaning : card.card.uprightMeaning;
    lines.push(`【${label}】《${card.card.name}》${orientation}`);
    lines.push(meaning);
    lines.push('');
  }

  const past = cards.find(c => c.position === 'past');
  const present = cards.find(c => c.position === 'present');
  const future = cards.find(c => c.position === 'future');

  lines.push('═══════════════');
  lines.push('综合建议：');

  if (past && present && future) {
    const pastKw = past.card.keywords[0];
    const presentKw = present.card.keywords[0];
    const futureKw = future.card.keywords[0];
    lines.push(
      `过去的${pastKw}塑造了你此刻与${presentKw}之间的张力，而前方正在召唤你走向${futureKw}。` +
      `这段旅程有其内在的逻辑，信任它。` +
      `\n\n${past.card.shortAdvice.replace('。', '')}，同时${present.card.shortAdvice.replace('。', '')}，` +
      `最终你将发现：${future.card.shortAdvice}`
    );
  }

  return lines.join('\n');
}
