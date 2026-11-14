import { describe, expect, it } from 'vitest';
import type { CardEntity } from './contracts.js';
import {
  detectAndParseCards,
  exportCardsToCsv,
  exportCardsToJson,
  parseCardsFromCsv,
  parseCardsFromJson
} from './importExport.js';

describe('MintMox Import / Export module', () => {
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
      buyPrice: 220.0,
      isFoil: true,
      isAltered: false,
      isSigned: true,
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
    expect(jsonStr).toContain('"app": "MintMox"');
    expect(jsonStr).toContain('"totalCards": 2');

    const parsed = parseCardsFromJson(jsonStr);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.title).toBe('Taiga');
    expect(parsed[0]?.editionCode).toBe('3ED');
    expect(parsed[0]?.currentPrice).toBe(285.5);
    expect(parsed[0]?.buyPrice).toBe(220.0);
    expect(parsed[0]?.isFoil).toBe(true);
    expect(parsed[0]?.isAltered).toBe(false);
    expect(parsed[0]?.isSigned).toBe(true);
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
    expect(parsed[0]?.buyPrice).toBe(220.0);
    expect(parsed[0]?.isFoil).toBe(true);
    expect(parsed[0]?.isAltered).toBe(false);
    expect(parsed[0]?.isSigned).toBe(true);
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

  it('mitigates CSV formula injection (CWE-1236) on text fields', () => {
    const dangerousCards: CardEntity[] = [
      {
        id: '1',
        title: '=cmd|/C calc!A0',
        edition: '@SUM(1,2)',
        quantity: 1,
        currentPrice: 10,
        previousPrice: 10,
        isFavorite: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        deletedAt: null,
        version: 1
      }
    ];

    const csv = exportCardsToCsv(dangerousCards);
    // Debe prefijar con comilla simple para neutralizar ejecución de fórmulas en Excel
    expect(csv).toContain("'=cmd|/C calc!A0");
    expect(csv).toContain("'@SUM(1,2)");
  });

  it('imports ManaBox CSV exports with Scryfall ID, conditions and folders', () => {
    const manaboxCsv = [
      'Binder Name,Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Misprint,Altered,Condition,Language,Purchase price currency',
      'Power Binder,Taiga,3ed,Revised Edition,287,normal,rare,1,1001,449dd1e4-399a-41e9-bb6e-82ae10427844,250.00,false,false,near_mint,en,EUR',
      'Power Binder,Mox Pearl,2ed,Unlimited Edition,261,normal,rare,1,1002,12345678-abcd-1234-abcd-1234567890ab,2800.00,false,false,lightly_played,es,EUR'
    ].join('\n');

    const res = detectAndParseCards(manaboxCsv);
    expect(res.format).toBe('csv');
    expect(res.sourceApp).toBe('ManaBox');
    expect(res.cards).toHaveLength(2);

    const taiga = res.cards[0]!;
    expect(taiga.title).toBe('Taiga');
    expect(taiga.editionCode).toBe('3ED');
    expect(taiga.edition).toBe('Revised Edition');
    expect(taiga.condition).toBe('NM');
    expect(taiga.buyPrice).toBe(250);
    expect(taiga.scryfallId).toBe('449dd1e4-399a-41e9-bb6e-82ae10427844');
    expect(taiga.imageUrl).toContain('449dd1e4-399a-41e9-bb6e-82ae10427844.jpg');
    expect(taiga.collection).toBe('Power Binder');

    const mox = res.cards[1]!;
    expect(mox.title).toBe('Mox Pearl');
    expect(mox.condition).toBe('LP');
    expect(mox.language).toBe('ES');
  });

  it('imports Moxfield CSV exports and maps edition codes to full set names', () => {
    const moxfieldCsv = [
      'Count,Tradelist Count,Name,Edition,Condition,Language,Foil,Tags,Last Modified,Collector Number,Alter,Proxy,Purchase Price',
      '1,0,Black Lotus,2ED,LP,English,false,Vintage,2026-11-01,232,false,false,12000'
    ].join('\n');

    const res = detectAndParseCards(moxfieldCsv);
    expect(res.format).toBe('csv');
    expect(res.sourceApp).toBe('Moxfield');
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0]?.title).toBe('Black Lotus');
    expect(res.cards[0]?.editionCode).toBe('2ED');
    expect(res.cards[0]?.edition).toBe('Unlimited Edition');
    expect(res.cards[0]?.condition).toBe('LP');
    expect(res.cards[0]?.buyPrice).toBe(12000);
  });

  it('imports Dragon Shield MTG exports with printing and folders', () => {
    const dsCsv = [
      'Folder Name,Quantity,Trade Quantity,Card Name,Set Code,Set Name,Card Number,Condition,Printing,Language,Bought Price,Date Added',
      'Modern Deck,4,0,Lightning Bolt,2ED,Unlimited Edition,162,NearMint,Foil,English,25.50,2026-11-01'
    ].join('\n');

    const res = detectAndParseCards(dsCsv);
    expect(res.format).toBe('csv');
    expect(res.sourceApp).toBe('Dragon Shield MTG');
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0]?.title).toBe('Lightning Bolt');
    expect(res.cards[0]?.quantity).toBe(4);
    expect(res.cards[0]?.condition).toBe('NM');
    expect(res.cards[0]?.isFoil).toBe(true);
    expect(res.cards[0]?.buyPrice).toBe(25.5);
    expect(res.cards[0]?.collection).toBe('Modern Deck');
  });

  it('imports Delver Lens CSV exports with canonical Scryfall IDs', () => {
    const delverCsv = [
      "Count,Name,Edition,Edition code,Condition,Language,Foil,Signed,Artist Proof,Altered Art,Misprint,Promo,Textless,My Price,Scryfall ID,Collector's number",
      '2,Counterspell,Unlimited Edition,2ED,Near Mint,English,Normal,false,false,false,false,false,false,15.50,abcd-1234,54'
    ].join('\n');

    const res = detectAndParseCards(delverCsv);
    expect(res.format).toBe('csv');
    expect(res.sourceApp).toBe('Delver Lens');
    expect(res.cards).toHaveLength(1);
    expect(res.cards[0]?.title).toBe('Counterspell');
    expect(res.cards[0]?.quantity).toBe(2);
    expect(res.cards[0]?.buyPrice).toBe(15.5);
  });

  it('imports Cardmarket exports with X for foil and custom conditions', () => {
    const cmCsv = [
      'Amount,Product Name,Expansion,Condition,Language,Foil?,Signed?,Altered?,Price',
      '1,Mox Sapphire,Unlimited Edition,EX,English,X,,,1800.00'
    ].join('\n');

    const res = detectAndParseCards(cmCsv);
    expect(res.format).toBe('csv');
    expect(res.sourceApp).toBe('Cardmarket');
    expect(res.cards[0]?.title).toBe('Mox Sapphire');
    expect(res.cards[0]?.condition).toBe('EX');
    expect(res.cards[0]?.isFoil).toBe(true);
    expect(res.cards[0]?.currentPrice).toBe(1800);
  });

  it('imports plain text MTG Arena / decklist format with sideboard sections', () => {
    const decklist = `
// Main Deck
4 Lightning Bolt (2ED)
1 Sol Ring (2ED)
2 Counterspell (2ED) 54
1x Serra Angel [2ED]

// Sideboard
3 Red Elemental Blast (2ED)
`;

    const res = detectAndParseCards(decklist);
    expect(res.format).toBe('decklist');
    expect(res.sourceApp).toBe('Lista de texto MTG / Arena');
    expect(res.cards).toHaveLength(5);

    expect(res.cards[0]?.title).toBe('Lightning Bolt');
    expect(res.cards[0]?.quantity).toBe(4);
    expect(res.cards[0]?.editionCode).toBe('2ED');
    expect(res.cards[0]?.edition).toBe('Unlimited Edition');
    expect(res.cards[0]?.collection).toBe('Main Deck');

    expect(res.cards[3]?.title).toBe('Serra Angel');
    expect(res.cards[3]?.quantity).toBe(1);

    expect(res.cards[4]?.title).toBe('Red Elemental Blast');
    expect(res.cards[4]?.quantity).toBe(3);
    expect(res.cards[4]?.collection).toBe('Sideboard');
  });

  it('imports European semicolon-separated CSVs (Excel / Cardmarket format)', () => {
    const euroCsv = [
      'Name;Set code;Set name;Quantity;Purchase price;Condition;Language',
      'Taiga;3ED;Revised Edition;1;245,50;near_mint;Spanish',
      'Underground Sea;3ED;Revised Edition;1;520,00;excellent;English'
    ].join('\n');

    const res = detectAndParseCards(euroCsv);
    expect(res.format).toBe('csv');
    expect(res.cards).toHaveLength(2);
    expect(res.cards[0]?.title).toBe('Taiga');
    expect(res.cards[0]?.buyPrice).toBe(245.5);
    expect(res.cards[0]?.language).toBe('ES');
    expect(res.cards[1]?.title).toBe('Underground Sea');
    expect(res.cards[1]?.buyPrice).toBe(520);
    expect(res.cards[1]?.condition).toBe('EX');
  });
});

