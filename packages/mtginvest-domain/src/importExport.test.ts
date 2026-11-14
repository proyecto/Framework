import { describe, expect, it } from 'vitest';
import type { CardEntity } from './contracts.js';
import {
  detectAndParseCards,
  exportCardsToCsv,
  exportCardsToJson,
  parseCardsFromCsv,
  parseCardsFromJson
} from './importExport.js';

describe('MTGInvest Import / Export module', () => {
  const sampleCards: CardEntity[] = [
    {
      id: 'CARD-001',
      title: 'Taiga',
      nameEn: 'Taiga',
      edition: 'Revised Edition',
      editionCode: '3ED',
      language: 'EN',
      quantity: 2,
      currentPrice: 285.5,
      previousPrice: 250.0,
      condition: 'EX',
      isFavorite: true,
      imageUrl: 'https://cards.scryfall.io/normal/front/1/2/3ed-taiga.jpg',
      scryfallId: '12345-6789',
      priceHistory: [{ date: '2026-01-01', price: 250 }],
      lastPriceSyncDate: '2026-11-14',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
      deletedAt: null,
      version: 1
    },
    {
      id: 'CARD-002',
      title: 'Ángel de Serra',
      nameEn: 'Serra Angel',
      edition: 'Unlimited Edition',
      editionCode: '2ED',
      language: 'ES',
      quantity: 1,
      currentPrice: 45.0,
      previousPrice: 40.0,
      condition: 'NM',
      isFavorite: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-11-14T00:00:00.000Z',
      deletedAt: null,
      version: 1
    }
  ];

  it('exports to JSON and round-trips correctly', () => {
    const jsonStr = exportCardsToJson(sampleCards);
    expect(jsonStr).toContain('"app": "MTGInvest"');
    expect(jsonStr).toContain('"totalCards": 2');

    const parsed = parseCardsFromJson(jsonStr);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.title).toBe('Taiga');
    expect(parsed[0]?.editionCode).toBe('3ED');
    expect(parsed[0]?.currentPrice).toBe(285.5);
    expect(parsed[0]?.quantity).toBe(2);
    expect(parsed[1]?.title).toBe('Ángel de Serra');
    expect(parsed[1]?.nameEn).toBe('Serra Angel');
  });

  it('exports to CSV and round-trips correctly', () => {
    const csvStr = exportCardsToCsv(sampleCards);
    expect(csvStr).toContain('title,nameEn,edition,editionCode');
    expect(csvStr).toContain('Taiga,Taiga,Revised Edition,3ED');

    const parsed = parseCardsFromCsv(csvStr);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.title).toBe('Taiga');
    expect(parsed[0]?.editionCode).toBe('3ED');
    expect(parsed[0]?.currentPrice).toBe(285.5);
    expect(parsed[0]?.quantity).toBe(2);
    expect(parsed[1]?.title).toBe('Ángel de Serra');
    expect(parsed[1]?.nameEn).toBe('Serra Angel');
  });

  it('detects and parses JSON automatically', () => {
    const jsonStr = JSON.stringify([{ title: 'Black Lotus', currentPrice: 12000 }]);
    const result = detectAndParseCards(jsonStr);
    expect(result.format).toBe('json');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.title).toBe('Black Lotus');
    expect(result.cards[0]?.currentPrice).toBe(12000);
  });

  it('detects and parses CSV with Spanish headers automatically', () => {
    const csv = `Nombre,Edicion,Codigo,Cantidad,Precio\nMox Pearl,Unlimited Edition,2ED,1,"2500,50"`;
    const result = detectAndParseCards(csv);
    expect(result.format).toBe('csv');
    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]?.title).toBe('Mox Pearl');
    expect(result.cards[0]?.editionCode).toBe('2ED');
    expect(result.cards[0]?.currentPrice).toBe(2500.5);
  });

  it('handles CSV with quoted commas and special characters', () => {
    const csv = `title,edition\n"Underground Sea, 3ED","Revised Edition, 1994"`;
    const parsed = parseCardsFromCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.title).toBe('Underground Sea, 3ED');
    expect(parsed[0]?.edition).toBe('Revised Edition, 1994');
  });
});

