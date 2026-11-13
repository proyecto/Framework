import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import { InMemoryEntityStoreDriver, MemoryKeyValueStore } from '@framework/data';
import {
  calculateCardReturn,
  createMtginvestController,
  findMtgSetByCode,
  findMtgSetByName,
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

describe('MTGInvest MVC domain', () => {
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

    // Permite dar de alta una nueva carta
    await controller.createItem({
      title: 'Mox Sapphire',
      nameEn: 'Mox Sapphire',
      edition: 'Unlimited Edition',
      editionCode: '2ed',
      language: 'EN',
      previousPrice: 4500,
      currentPrice: 5100
    });

    const mox = view.latest.items.find((c) => c.title === 'Mox Sapphire');
    expect(mox).toBeDefined();
    expect(mox?.currentPrice).toBe(5100);

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

  it('auto-completes missing seeds if previous database only had older cards', async () => {
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

    // Debe conservar la carta previa y auto-incorporar las 57 semillas del Excel
    expect(view.latest.items.length).toBe(58);
    expect(view.latest.items.some((c) => c.title === 'Carta Antigua Demo')).toBe(true);
    expect(view.latest.items.some((c) => c.title === 'Relámpago')).toBe(true);

    // Si ejecutamos resetToSeed, debe dejar exactamente las 57 semillas limpias
    await controller.resetToSeed();
    expect(view.latest.items.length).toBe(57);
    expect(view.latest.items.some((c) => c.title === 'Carta Antigua Demo')).toBe(false);

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
      'named?fuzzy=Serra%20Angel&set=2ed': {
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
      },
      'search?q=%21%22Serra%20Angel%22': {
        total_cards: 1,
        has_more: false,
        data: [
          {
            id: 'serra-uuid-1',
            name: 'Serra Angel',
            set: '2ed',
            collector_number: '39',
            image_uris: {
              normal: 'https://cards.scryfall.io/normal/serra-angel.jpg'
            }
          }
        ]
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
      deviceId: 'test-device'
    });
    // Inyectamos el mock client en el controller
    (controller as any).scryfallClient = client;

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
});
