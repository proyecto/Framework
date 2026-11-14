import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import { InMemoryEntityStoreDriver, MemoryKeyValueStore } from '@framework/data';
import {
  buildCardChart,
  buildOneYearCardChart,
  buildPortfolioChart,
  buildThreeMonthCardChart,
  calculateCardReturn,
  calculatePortfolioRoiDistribution,
  createMtginvestController,
  findMtgSetByCode,
  findMtgSetByName,
  getCardCollections,
  getPortfolioProfitLeaders,
  MTG_SETS,
  ScryfallApiClient,
  SEED_CARDS,
  type HttpFetchFn,
  type MtginvestViewState
} from './index.js';

class SpyView implements IView<MtginvestViewState, ViewEvent> {
  readonly renders: MtginvestViewState[] = [];
  readonly events: ViewEvent[] = [];
  render(state: MtginvestViewState): void {
    this.renders.push(state);
  }
  onEvent(event: ViewEvent): void {
    this.events.push(event);
  }
  get latest(): MtginvestViewState {
    const item = this.renders[this.renders.length - 1];
    if (!item) throw new Error('No renders captured yet');
    return item;
  }
}

describe('MintMox MVC domain', () => {
  it('correctly calculates stock-like card returns and trends', () => {
    // Subida
    const up = calculateCardReturn({ previousPrice: 29.79, currentPrice: 72.22 });
    expect(up.diff).toBe(42.43);
    expect(up.percent).toBe(142.4);
    expect(up.trend).toBe('up');

    // Bajada
    const down = calculateCardReturn({ previousPrice: 41.79, currentPrice: 21.76 });
    expect(down.diff).toBe(-20.03);
    expect(down.percent).toBe(-47.9);
    expect(down.trend).toBe('down');

    // Sin variación
    const flat = calculateCardReturn({ previousPrice: 10, currentPrice: 10 });
    expect(flat.diff).toBe(0);
    expect(flat.percent).toBe(0);
    expect(flat.trend).toBe('flat');

    // Retorno basado en precio de compra (buyPrice) en vez de previousPrice
    const withBuyPrice = calculateCardReturn({ buyPrice: 20, previousPrice: 38, currentPrice: 40 });
    expect(withBuyPrice.diff).toBe(20);
    expect(withBuyPrice.percent).toBe(100);
    expect(withBuyPrice.trend).toBe('up');
  });

  it('supports offline local storage, auto-seeds portfolio and manages cards', async () => {
    const controller = createMtginvestController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    // Comprueba que siembra las cartas del inventario inicial
    expect(view.latest.items.length).toBeGreaterThan(0);
    const serraAngel = view.latest.items.find((c) => c.title === 'Ángel de Serra' && c.editionCode === '2ED');
    expect(serraAngel).toBeDefined();
    expect(serraAngel?.currentPrice).toBe(72.22);
    expect(serraAngel?.previousPrice).toBe(29.79);
    expect(serraAngel?.language).toBe('EN');

    // Permite dar de alta una nueva carta con atributos de coleccionismo
    await controller.createItem({
      title: 'Mox Sapphire',
      nameEn: 'Mox Sapphire',
      edition: 'Unlimited Edition',
      editionCode: '2ed',
      language: 'EN',
      buyPrice: 4200,
      previousPrice: 4500,
      currentPrice: 5100,
      isFoil: true,
      isAltered: false,
      isSigned: true
    });

    const mox = view.latest.items.find((c) => c.title === 'Mox Sapphire');
    expect(mox).toBeDefined();
    expect(mox?.currentPrice).toBe(5100);
    expect(mox?.buyPrice).toBe(4200);
    expect(mox?.isFoil).toBe(true);
    expect(mox?.isAltered).toBe(false);
    expect(mox?.isSigned).toBe(true);

    // Actualiza cotización
    if (mox) {
      await controller.updatePrices(mox.id, 5300);
      const updated = view.latest.items.find((c) => c.id === mox.id);
      expect(updated?.currentPrice).toBe(5300);
      expect(updated?.previousPrice).toBe(5100);

      // Edita la carta completa (edición, cantidad, títulos)
      await controller.updateCard(mox.id, {
        title: 'Mox Sapphire (Foil)',
        edition: 'Vintage Masters',
        editionCode: 'VMA',
        language: 'ES',
        quantity: 2,
        currentPrice: 6200
      });
      const edited = view.latest.items.find((c) => c.id === mox.id);
      expect(edited?.title).toBe('Mox Sapphire (Foil)');
      expect(edited?.edition).toBe('Vintage Masters');
      expect(edited?.editionCode).toBe('VMA');
      expect(edited?.language).toBe('ES');
      expect(edited?.quantity).toBe(2);
      expect(edited?.currentPrice).toBe(6200);
    }

    controller.dispose();
  });

  it('loads existing user cards without unwanted seed injection, and supports reset and clearInventory', async () => {
    const store = new InMemoryEntityStoreDriver();
    // Simulamos que el usuario ya tenía 1 carta guardada previamente en su base de datos
    await store.upsert(
      'cards',
      {
        id: 'existing-card-1',
        title: 'Carta Antigua Demo',
        edition: 'Alpha',
        editionCode: 'LEA',
        quantity: 1,
        currentPrice: 100,
        previousPrice: 80,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        version: 1
      },
      'synced'
    );

    const controller = createMtginvestController({
      store,
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    // Debe conservar la carta previa sin inyectar semillas no deseadas
    expect(view.latest.items.length).toBe(1);
    expect(view.latest.items[0]?.title).toBe('Carta Antigua Demo');

    // Si ejecutamos resetToSeed, debe dejar exactamente las 57 semillas limpias
    await controller.resetToSeed();
    expect(view.latest.items.length).toBe(57);
    expect(view.latest.items.some((c) => c.title === 'Carta Antigua Demo')).toBe(false);

    // Si ejecutamos clearInventory, debe vaciar la cartera a 0 cartas
    await controller.clearInventory();
    expect(view.latest.items.length).toBe(0);

    // Si la cartera está vacía, syncCardmarketPrices retorna de inmediato
    const syncRes = await controller.syncCardmarketPrices();
    expect(syncRes.totalCards).toBe(0);
    expect(syncRes.updatedCount).toBe(0);

    controller.dispose();
  });

  it('exposes more than 50 real seed cards and full sets catalog', () => {
    expect(SEED_CARDS.length).toBeGreaterThanOrEqual(50);
    expect(MTG_SETS.length).toBeGreaterThan(500);

    const unlimited = findMtgSetByCode('2ED');
    expect(unlimited).toBeDefined();
    expect(unlimited?.name).toBe('Unlimited Edition');

    const revised = findMtgSetByName('Revised Edition');
    expect(revised).toBeDefined();
    expect(revised?.code).toBe('3ED');
  });

  it('integrates with Scryfall API client and resolves card images', async () => {
    const mockResponses: Record<string, any> = {
      'named?exact=Black%20Lotus': {
        id: 'bl-uuid-1',
        name: 'Black Lotus',
        set: '2ed',
        set_name: 'Unlimited Edition',
        collector_number: '232',
        image_uris: {
          small: 'https://cards.scryfall.io/small/black-lotus.jpg',
          normal: 'https://cards.scryfall.io/normal/black-lotus.jpg',
          large: 'https://cards.scryfall.io/large/black-lotus.jpg'
        },
        prices: { eur: '9999.00', usd: '12000.00' }
      },
      'Serra%20Angel': {
        id: 'serra-uuid-1',
        name: 'Serra Angel',
        set: '2ed',
        collector_number: '39',
        image_uris: {
          normal: 'https://cards.scryfall.io/normal/serra-angel.jpg'
        }
      },
      'autocomplete?q=Serra': {
        data: ['Serra Angel', 'Serra Avatar']
      }
    };

    const mockFetch: HttpFetchFn = async (input) => {
      const url = String(input);
      for (const [key, val] of Object.entries(mockResponses)) {
        if (url.includes(key)) {
          return {
            ok: true,
            status: 200,
            json: async () => val
          };
        }
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ status: 404, code: 'not_found' })
      };
    };

    const client = new ScryfallApiClient({
      rateLimitMs: 0,
      fetchFn: mockFetch
    });

    // 1. getCardNamed
    const card = await client.getCardNamed({ exact: 'Black Lotus' });
    expect(card).toBeDefined();
    expect(card?.name).toBe('Black Lotus');
    expect(card?.imageUris?.normal).toBe('https://cards.scryfall.io/normal/black-lotus.jpg');
    expect(card?.prices?.eur).toBe('9999.00');

    // 2. autocompleteCardNames
    const autocomplete = await client.autocompleteCardNames('Serra');
    expect(autocomplete).toEqual(['Serra Angel', 'Serra Avatar']);

    // 3. resolveCardImageUrl
    const resolvedUrl = await client.resolveCardImageUrl({
      title: 'Ángel de Serra',
      nameEn: 'Serra Angel',
      editionCode: '2ed'
    });
    expect(resolvedUrl).toBe('https://cards.scryfall.io/normal/serra-angel.jpg');

    // 4. Controller getCardImageUrl y persistencia en modelo
    const store = new InMemoryEntityStoreDriver();
    const controller = createMtginvestController({
      store,
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device',
      scryfallClient: client
    });

    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    const serraCard = view.latest.items.find((c) => c.title === 'Ángel de Serra');
    expect(serraCard).toBeDefined();
    if (serraCard) {
      expect(serraCard.imageUrl).toBeUndefined();
      const imgUrl = await controller.getCardImageUrl(serraCard);
      expect(imgUrl).toBe('https://cards.scryfall.io/normal/serra-angel.jpg');

      // Comprobamos que si volvemos a consultar una carta con imageUrl ya guardada, la devuelve directamente
      const cached = await controller.getCardImageUrl({ ...serraCard, imageUrl: 'https://custom-cache.jpg' });
      expect(cached).toBe('https://custom-cache.jpg');
    }

    controller.dispose();
  });

  it('generates 1-year price chart starting from zero until data begins', () => {
    const cardWithHistory = {
      title: 'Serra Angel',
      currentPrice: 72.22,
      previousPrice: 29.79,
      priceHistory: [
        { date: '2026-09-07', price: 45.63 },
        { date: '2026-10-15', price: 74.14 },
        { date: '2026-11-10', price: 72.22 }
      ]
    };

    const chart1y = buildOneYearCardChart(cardWithHistory, new Date('2026-11-13T00:00:00Z'));
    expect(chart1y.labels.length).toBe(13); // Nov '25 to Nov '26
    expect(chart1y.values.length).toBe(13);
    // Primeros meses sin datos: empieza en 0
    expect(chart1y.values[0]).toBe(0); // Nov '25
    expect(chart1y.values[5]).toBe(0); // Abr '26
    expect(chart1y.values[9]).toBe(0); // Ago '26
    // Meses con datos registrados:
    expect(chart1y.values[10]).toBe(45.63); // Sep '26
    expect(chart1y.values[11]).toBe(74.14); // Oct '26
    expect(chart1y.values[12]).toBe(72.22); // Nov '26

    const chart3m = buildThreeMonthCardChart(cardWithHistory);
    expect(chart3m.values.length).toBeGreaterThanOrEqual(3);
    expect(chart3m.values[0]).toBe(45.63);
    expect(chart3m.values[chart3m.values.length - 1]).toBe(72.22);

    // Comprobamos los nuevos rangos temporales unificados (1S, 1M, 3M, 6M, 1A)
    const ref = new Date('2026-11-13T00:00:00Z');
    const chart1s = buildCardChart(cardWithHistory, '1S', ref);
    expect(chart1s.labels.length).toBe(7);
    expect(chart1s.values.length).toBe(7);
    expect(chart1s.values[chart1s.values.length - 1]).toBe(72.22);

    const chart1m = buildCardChart(cardWithHistory, '1M', ref);
    expect(chart1m.labels.length).toBe(8);
    expect(chart1m.values.length).toBe(8);

    const chart6m = buildCardChart(cardWithHistory, '6M', ref);
    expect(chart6m.labels.length).toBe(7);
    expect(chart6m.values.length).toBe(7);
    // Antes de septiembre 2026 debe ser 0
    expect(chart6m.values[0]).toBe(0); // May '26
    expect(chart6m.values[3]).toBe(0); // Ago '26
    expect(chart6m.values[4]).toBe(45.63); // Sep '26
  });

  it('calculates global portfolio charts, ROI distribution and profit leaders', () => {
    const mockItems = [
      {
        id: '1',
        title: 'Scrubland',
        edition: 'Revised Edition',
        editionCode: '3ED',
        quantity: 1,
        previousPrice: 200,
        currentPrice: 300,
        isFavorite: false,
        priceHistory: [
          { date: '2026-09-07', price: 220 },
          { date: '2026-10-15', price: 260 },
          { date: '2026-11-13', price: 300 }
        ],
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-11-13T00:00:00Z',
        deletedAt: null,
        version: 1
      },
      {
        id: '2',
        title: 'Relámpago',
        edition: 'Unlimited Edition',
        editionCode: '2ED',
        quantity: 2,
        previousPrice: 40,
        currentPrice: 20, // Pérdida
        isFavorite: false,
        priceHistory: [
          { date: '2026-09-07', price: 35 },
          { date: '2026-10-15', price: 25 },
          { date: '2026-11-13', price: 20 }
        ],
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-11-13T00:00:00Z',
        deletedAt: null,
        version: 1
      }
    ];

    const ref = new Date('2026-11-13T00:00:00Z');

    // 1. Portfolio Chart (1A y 1S)
    const port1a = buildPortfolioChart(mockItems, '1A', ref);
    expect(port1a.labels.length).toBe(13);
    // Coste total: 200 * 1 + 40 * 2 = 280
    // Valor final actual: 300 * 1 + 20 * 2 = 340
    // Beneficio final: 340 - 280 = 60
    expect(port1a.investmentValues[12]).toBe(280);
    expect(port1a.portfolioValues[12]).toBe(340);
    expect(port1a.profitValues[12]).toBe(60);
    expect(port1a.roiValues[12]).toBe(21.4); // 60 / 280 * 100

    // 2. ROI Distribution
    const distribution = calculatePortfolioRoiDistribution(mockItems);
    expect(distribution.length).toBe(5);
    const lossBucket = distribution.find((b) => b.id === 'loss');
    const highBucket = distribution.find((b) => b.id === 'high');
    expect(lossBucket?.count).toBe(1); // Relámpago (-50%)
    expect(highBucket?.count).toBe(1);  // Scrubland (+50%)

    // 3. Profit Leaders (Top Gainers / Losers)
    const leaders = getPortfolioProfitLeaders(mockItems, 5);
    expect(leaders.topGainers.length).toBe(1);
    expect(leaders.topGainers[0]?.title).toBe('Scrubland');
    expect(leaders.topGainers[0]?.totalProfit).toBe(100);

    expect(leaders.topLosers.length).toBe(1);
    expect(leaders.topLosers[0]?.title).toBe('Relámpago');
    expect(leaders.topLosers[0]?.totalProfit).toBe(-40); // (20 - 40) * 2
  });

  it('syncs Cardmarket prices via Scryfall batch collection endpoint and throttles daily', async () => {
    let collectionRequestsCount = 0;
    const mockBatchFetch: HttpFetchFn = async (input, init) => {
      const url = String(input);
      if (url.includes('/cards/collection') && init?.method === 'POST') {
        collectionRequestsCount++;
        const body = JSON.parse(init.body || '{}');
        const identifiers = body.identifiers || [];
        return {
          ok: true,
          status: 200,
          json: async () => ({
            object: 'list',
            not_found: [],
            data: identifiers.map((idObj: any, index: number) => ({
              object: 'card',
              id: `scryfall-id-${index}`,
              name: idObj.name || 'Unknown',
              set: idObj.set || '2ed',
              prices: {
                eur: idObj.name === 'Serra Angel' ? '85.50' : '25.00',
                eur_foil: null,
                usd: '90.00'
              },
              image_uris: {
                normal: `https://cards.scryfall.io/normal/${index}.jpg`
              }
            }))
          })
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ error: 'not found' })
      };
    };

    const client = new ScryfallApiClient({
      rateLimitMs: 0,
      fetchFn: mockBatchFetch
    });

    const store = new InMemoryEntityStoreDriver();
    const controller = createMtginvestController({
      store,
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device',
      scryfallClient: client
    });

    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    // La primera sincronización actualiza los precios
    const syncResult = await controller.syncCardmarketPrices({ force: true });
    expect(syncResult.alreadyUpToDate).toBe(false);
    expect(syncResult.updatedCount).toBeGreaterThan(0);
    expect(collectionRequestsCount).toBe(1);

    // Comprobamos que Serra Angel tiene su nueva cotización y registró el precio anterior
    const serra = view.latest.items.find((c) => c.title === 'Ángel de Serra' && c.editionCode === '2ED');
    expect(serra).toBeDefined();
    expect(serra?.currentPrice).toBe(85.50);
    expect(serra?.previousPrice).toBe(72.22);
    expect(serra?.scryfallId).toBeDefined();
    expect(serra?.lastPriceSyncDate).toBe(new Date().toISOString().slice(0, 10));

    // Comprobamos que priceHistory contiene el punto de hoy con el nuevo valor
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayPoint = serra?.priceHistory?.find((p) => p.date === todayStr);
    expect(todayPoint).toBeDefined();
    expect(todayPoint?.price).toBe(85.50);

    // Una segunda llamada el mismo día sin "force" no hace peticiones a Scryfall (cache/throttle)
    const secondSync = await controller.syncCardmarketPrices();
    expect(secondSync.alreadyUpToDate).toBe(true);
    expect(secondSync.updatedCount).toBe(0);
    expect(collectionRequestsCount).toBe(1);

    // Con force: true, se vuelve a ejecutar la petición
    const forceSync = await controller.syncCardmarketPrices({ force: true });
    expect(forceSync.alreadyUpToDate).toBe(false);
    expect(collectionRequestsCount).toBe(2);

    controller.dispose();
  });

  it('prioritizes eur_foil pricing from Cardmarket when card is marked isFoil: true', async () => {
    const mockBatchFetch: HttpFetchFn = async (_input, init) => {
      const body = JSON.parse(init?.body || '{}');
      const identifiers = body.identifiers || [];
      return {
        ok: true,
        status: 200,
        json: async () => ({
          object: 'list',
          not_found: [],
          data: identifiers.map((idObj: any, index: number) => ({
            object: 'card',
            id: `scryfall-foil-${index}`,
            name: idObj.name || 'Unknown',
            set: idObj.set || '2ed',
            prices: {
              eur: '50.00',
              eur_foil: '250.00',
              usd: '60.00'
            },
            image_uris: {
              normal: 'https://cards.scryfall.io/normal/foil.jpg'
            }
          }))
        })
      };
    };

    const client = new ScryfallApiClient({
      rateLimitMs: 0,
      fetchFn: mockBatchFetch
    });

    const store = new InMemoryEntityStoreDriver();
    const controller = createMtginvestController({
      store,
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-foil-sync',
      scryfallClient: client
    });

    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    // Vaciamos e insertamos una carta normal y una foil
    await controller.clearInventory();
    await controller.createItem({
      title: 'Counterspell Normal',
      nameEn: 'Counterspell',
      edition: 'Unlimited Edition',
      editionCode: '2ed',
      currentPrice: 30,
      previousPrice: 30,
      isFoil: false
    });
    await controller.createItem({
      title: 'Counterspell Foil',
      nameEn: 'Counterspell',
      edition: 'Unlimited Edition',
      editionCode: '2ed',
      currentPrice: 30,
      previousPrice: 30,
      isFoil: true
    });

    await controller.syncCardmarketPrices({ force: true });

    const normal = view.latest.items.find((c) => c.title === 'Counterspell Normal');
    const foil = view.latest.items.find((c) => c.title === 'Counterspell Foil');

    expect(normal?.currentPrice).toBe(50.00); // eur normal
    expect(foil?.currentPrice).toBe(250.00);  // eur_foil
    controller.dispose();
  });

  it('supports importing and exporting portfolio cards to JSON and CSV', async () => {
    const controller = createMtginvestController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-import-export'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    // Exportación a JSON y CSV
    const jsonOutput = controller.exportToJson();
    expect(jsonOutput).toContain('"app": "MintMox"');

    const csvOutput = controller.exportToCsv();
    expect(csvOutput).toContain('title,nameEn,edition');

    // Importación con reemplazo
    const newCards = [
      {
        title: 'Mox Diamond',
        edition: 'Stronghold',
        editionCode: 'STH',
        currentPrice: 650.0,
        previousPrice: 500.0,
        quantity: 1
      },
      {
        title: 'Gaea\'s Cradle',
        edition: 'Urza\'s Saga',
        editionCode: 'USG',
        currentPrice: 900.0,
        previousPrice: 800.0,
        quantity: 1
      }
    ];

    const result = await controller.importCards(newCards, { replace: true });
    expect(result.importedCount).toBe(2);
    expect(result.replaced).toBe(true);

    expect(view.latest.items).toHaveLength(2);
    expect(view.latest.items.map((c) => c.title)).toContain('Mox Diamond');
    expect(view.latest.items.map((c) => c.title)).toContain('Gaea\'s Cradle');

    // Importación agregando (sin reemplazo)
    const appendResult = await controller.importCards([
      {
        title: 'Lion\'s Eye Diamond',
        edition: 'Mirage',
        editionCode: 'MIR',
        currentPrice: 480.0
      }
    ], { replace: false });

    expect(appendResult.importedCount).toBe(1);
    expect(appendResult.replaced).toBe(false);
    expect(view.latest.items).toHaveLength(3);

    controller.dispose();
  });

  it('supports assigning and updating custom collections / binders', async () => {
    const controller = createMtginvestController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-collections'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    await controller.createItem({
      title: 'Tarmogoyf',
      edition: 'Future Sight',
      editionCode: 'FUT',
      currentPrice: 25.0,
      collection: 'Trade Binder'
    });

    const created = view.latest.items.find((c) => c.title === 'Tarmogoyf');
    expect(created?.collection).toBe('Trade Binder');

    await controller.updateCard(created!.id, {
      collection: 'Mazo Modern Jund'
    });

    const updated = view.latest.items.find((c) => c.id === created!.id);
    expect(updated?.collection).toBe('Mazo Modern Jund');

    controller.dispose();
  });

  it('supports assigning a card to multiple collections simultaneously', async () => {
    const controller = createMtginvestController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-multi-collections'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    await controller.createItem({
      title: 'Mox Diamond',
      edition: 'Stronghold',
      editionCode: 'STH',
      currentPrice: 650.0,
      collections: ['Principal', 'Commander Decks', 'Reservelist']
    });

    const created = view.latest.items.find((c) => c.title === 'Mox Diamond');
    expect(created?.collections).toEqual(['Principal', 'Commander Decks', 'Reservelist']);
    expect(created?.collection).toBe('Principal, Commander Decks, Reservelist');
    expect(getCardCollections(created!)).toEqual(['Principal', 'Commander Decks', 'Reservelist']);

    await controller.updateCard(created!.id, {
      collections: ['Commander Decks', 'Colección Foil']
    });

    const updated = view.latest.items.find((c) => c.id === created!.id);
    expect(updated?.collections).toEqual(['Commander Decks', 'Colección Foil']);
    expect(getCardCollections(updated!)).toEqual(['Commander Decks', 'Colección Foil']);

    controller.dispose();
  });
});
