import type { DigestType } from './common.js';
import type { Item } from './database.js';

export interface RankedItem {
  item: Item;
  score: number;
  trustScore: number;
  recencyScore: number;
  relevanceScore: number;
}

export interface DigestPromptData {
  systemPrompt: string;
  userPrompt: string;
  digestType: DigestType;
  date: string;
  itemCount: number;
}

export interface DigestResult {
  markdown: string;
  html: string;
  title: string;
  itemCount: number;
  digestType: DigestType;
  date: string;
}
