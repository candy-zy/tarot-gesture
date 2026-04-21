import { useState, useCallback } from 'react';
import {
  DrawnCard,
  drawCards,
  assignPositions,
} from '../lib/tarotEngine';

export type ReadingStep =
  | 'idle'
  | 'selecting'
  | 'selected'
  | 'revealing'
  | 'reading';

export interface TarotReadingState {
  step: ReadingStep;
  availableCards: (DrawnCard | null)[];  // null = selected slot (keeps position)
  chosenCards: DrawnCard[];
  flippedIndices: number[];
  summary: string;
  focusedIndex: number;
}

const DECK_SIZE = 10;
const TARGET_COUNT = 3;

export function useTarotReading() {
  const [state, setState] = useState<TarotReadingState>({
    step: 'idle',
    availableCards: [],
    chosenCards: [],
    flippedIndices: [],
    summary: '',
    focusedIndex: 0,
  });

  const startReading = useCallback(() => {
    const cards = drawCards(DECK_SIZE);
    setState({
      step: 'selecting',
      availableCards: cards,
      chosenCards: [],
      flippedIndices: [],
      summary: '',
      focusedIndex: 0,
    });
  }, []);

  const setFocusedIndex = useCallback((index: number) => {
    setState((s) => {
      if (s.availableCards.length === 0) return s;
      // Only focus non-null slots
      if (s.availableCards[index] === null) return s;
      return {
        ...s,
        focusedIndex: Math.max(0, Math.min(index, s.availableCards.length - 1)),
      };
    });
  }, []);

  const selectCard = useCallback((index: number) => {
    setState((s) => {
      if (s.step !== 'selecting') return s;
      if (index < 0 || index >= s.availableCards.length) return s;

      const card = s.availableCards[index];
      if (!card) return s;  // already selected (null slot)

      // Replace with null to keep the slot position empty
      const withNull = s.availableCards.map((c, i) => i === index ? null : c);
      const newChosen = [...s.chosenCards, card];

      if (newChosen.length >= TARGET_COUNT) {
        const positioned = assignPositions(newChosen);
        return {
          ...s,
          availableCards: withNull,
          chosenCards: positioned,
          step: 'selected',
          focusedIndex: 0,
        };
      }

      return {
        ...s,
        availableCards: withNull,
        chosenCards: newChosen,
        focusedIndex: index,
      };
    });
  }, []);

  const startRevealing = useCallback(() => {
    setState((s) => ({ ...s, step: 'revealing' }));
  }, []);

  const flipCard = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.chosenCards.length) return s;
      if (s.flippedIndices.includes(index)) return s;

      const newFlipped = [...s.flippedIndices, index];
      const allFlipped = newFlipped.length >= s.chosenCards.length;

      return {
        ...s,
        flippedIndices: newFlipped,
        step: allFlipped ? 'reading' : 'revealing',
        summary: s.summary, // summary is set externally via setSummary
      };
    });
  }, []);

  const setSummary = useCallback((summary: string) => {
    setState(s => ({ ...s, summary }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: 'idle',
      availableCards: [],
      chosenCards: [],
      flippedIndices: [],
      summary: '',
      focusedIndex: 0,
    });
  }, []);

  return {
    state,
    startReading,
    setFocusedIndex,
    selectCard,
    startRevealing,
    flipCard,
    setSummary,
    reset,
  };
}
