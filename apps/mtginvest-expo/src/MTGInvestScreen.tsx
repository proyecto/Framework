import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from 'react-native';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  GoogleIcon,
  type GoogleIconName,
  ModalDialog,
  SearchInput,
  Select,
  type SelectOption,
  SimpleLineChart,
  TextField,
  textTypographyStyle,
  useFrameworkTheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import {
  buildCardChart,
  buildPortfolioChart,
  calculateCardReturn,
  calculatePortfolioRoiDistribution,
  getPortfolioProfitLeaders,
  type CardEntity,
  type CardProfitLeader,
  type ChartTimeframe,
  type IMtginvestController,
  type RoiDistributionBucket,
  MTG_SETS,
  TIMEFRAME_DESCRIPTIONS
} from './mvc';
import { APP_VERSION, BASE_VERSION } from './version';

export type MTGTab = 'main' | 'analytics' | 'settings';

export interface MTGInvestScreenProps {
  controller: IMtginvestController;
}

export type MtgSortKey =
  | 'price_desc'
  | 'price_asc'
  | 'recent'
  | 'gain_desc'
  | 'loss_asc'
  | 'alpha_asc'
  | 'quantity_desc';

export interface SortOptionDef {
  id: MtgSortKey;
  label: string;
  icon: GoogleIconName;
  description: string;
}

export const SORT_OPTIONS: SortOptionDef[] = [
  {
    id: 'price_desc',
    label: 'Más caras',
    icon: 'trending-up',
    description: 'Mayor cotización actual primero'
  },
  {
    id: 'price_asc',
    label: 'Más baratas',
    icon: 'trending-down',
    description: 'Menor cotización actual primero'
  },
  {
    id: 'recent',
    label: 'Más recientes',
    icon: 'schedule',
    description: 'Últimas cartas añadidas o editadas'
  },
  {
    id: 'gain_desc',
    label: 'Más beneficio',
    icon: 'arrow-upward',
    description: 'Mayor revalorización acumulada'
  },
  {
    id: 'loss_asc',
    label: 'Más pérdida',
    icon: 'arrow-downward',
    description: 'Mayor caída o pérdida de cotización'
  },
  {
    id: 'alpha_asc',
    label: 'Alfabéticamente',
    icon: 'sort-by-alpha',
    description: 'Orden alfabético de la A a la Z'
  },
  {
    id: 'quantity_desc',
    label: 'Cantidad',
    icon: 'content-copy',
    description: 'Mayor número de copias en posesión'
  }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const CONDITION_OPTIONS: SelectOption<string>[] = [
  { label: 'NM - Near Mint (Como nueva)', value: 'NM', badge: 'NM' },
  { label: 'EX - Excellent (Excelente)', value: 'EX', badge: 'EX' },
  { label: 'LP - Lightly Played (Ligeramente jugada)', value: 'LP', badge: 'LP' },
  { label: 'GD - Good (Buen estado)', value: 'GD', badge: 'GD' },
  { label: 'PL - Played (Jugada)', value: 'PL', badge: 'PL' },
  { label: 'PO - Poor (Dañada)', value: 'PO', badge: 'PO' }
];

export const LANGUAGE_OPTIONS: SelectOption<string>[] = [
  { label: 'Inglés (EN)', value: 'EN', badge: 'EN' },
  { label: 'Español (ES)', value: 'ES', badge: 'ES' },
  { label: 'Italiano (IT)', value: 'IT', badge: 'IT' },
  { label: 'Francés (FR)', value: 'FR', badge: 'FR' },
  { label: 'Alemán (DE)', value: 'DE', badge: 'DE' },
  { label: 'Japonés (JP)', value: 'JP', badge: 'JP' }
];

/**
 * Pantalla principal de MTGInvest (@framework/mtginvest-expo).
 *
 * Muestra la cartera de inversión en MTG con listado de cartas,
 * cotización actual, valor anterior e indicador bursátil de tendencia (subiendo/bajando).
 * Permite añadir y editar cada carta pulsando sobre ella, con selector de ediciones MTG.
 */
export function MTGInvestScreen({ controller }: MTGInvestScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<MTGTab>('main');
  const [toast, setToast] = useState<string | null>(null);

  // Opciones de ediciones de Magic extraídas de la hoja Sets
  const setOptions: SelectOption<string>[] = useMemo(() => {
    return MTG_SETS.map((s) => ({
      value: s.name,
      label: s.name,
      badge: s.code,
      description: s.year ? `Año ${s.year} · [${s.code}]` : `[${s.code}]`
    }));
  }, []);

  // Estado del formulario modal para añadir una nueva carta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newEdition, setNewEdition] = useState('Unlimited Edition');
  const [newEditionCode, setNewEditionCode] = useState('2ED');
  const [newLanguage, setNewLanguage] = useState('EN');
  const [newQuantity, setNewQuantity] = useState('1');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newCurrentPrice, setNewCurrentPrice] = useState('');
  const [newCondition, setNewCondition] = useState('NM');

  // Estado del formulario modal para editar una carta existente al pulsar sobre ella
  const [editingCard, setEditingCard] = useState<CardEntity | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editEdition, setEditEdition] = useState('');
  const [editEditionCode, setEditEditionCode] = useState('');
  const [editLanguage, setEditLanguage] = useState('EN');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editBuyPrice, setEditBuyPrice] = useState('');
  const [editCurrentPrice, setEditCurrentPrice] = useState('');
  const [editCondition, setEditCondition] = useState('NM');
  const [cardArtUrl, setCardArtUrl] = useState<string | null>(null);
  const [loadingArt, setLoadingArt] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('1A');

  // Estado para la barra de búsqueda y ordenación del tab principal
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MtgSortKey>('price_desc');
  const [showSortModal, setShowSortModal] = useState(false);

  // Estado para la pestaña de Gráficas de la Cartera completa
  const [portfolioTimeframe, setPortfolioTimeframe] = useState<ChartTimeframe>('1A');
  const [activeMetricChart, setActiveMetricChart] = useState<'value' | 'profit' | 'roi'>('value');

  const state = useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), APP_LAYOUT_BOUNDS.toastDurationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  // Al abrir la aplicación, sincroniza en segundo plano las cotizaciones de Cardmarket si es un nuevo día
  useEffect(() => {
    void controller.syncCardmarketPrices().catch(() => {});
  }, [controller]);

  // Opción de ordenación activa
  const activeSortOption: SortOptionDef = useMemo(
    () => SORT_OPTIONS.find((opt) => opt.id === sortBy) ?? (SORT_OPTIONS[0] as SortOptionDef),
    [sortBy]
  );

  // Cartas filtradas por nombre o set y ordenadas por el criterio elegido
  const filteredAndSortedCards = useMemo(() => {
    const q = normalizeText(searchQuery);

    // 1. Filtrado en tiempo real por nombre (ES/EN) o edición (nombre/código)
    const filtered = state.items.filter((card) => {
      if (!q) return true;
      const titleMatch = normalizeText(card.title).includes(q);
      const nameEnMatch = card.nameEn ? normalizeText(card.nameEn).includes(q) : false;
      const editionMatch = normalizeText(card.edition).includes(q);
      const codeMatch = card.editionCode ? normalizeText(card.editionCode).includes(q) : false;
      const langMatch = card.language ? normalizeText(card.language).includes(q) : false;
      return titleMatch || nameEnMatch || editionMatch || codeMatch || langMatch;
    });

    // 2. Ordenación según el criterio seleccionado
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_desc':
          return b.currentPrice - a.currentPrice;
        case 'price_asc':
          return a.currentPrice - b.currentPrice;
        case 'gain_desc': {
          const gainA = (a.currentPrice - a.previousPrice) * (a.quantity ?? 1);
          const gainB = (b.currentPrice - b.previousPrice) * (b.quantity ?? 1);
          return gainB - gainA;
        }
        case 'loss_asc': {
          const gainA = (a.currentPrice - a.previousPrice) * (a.quantity ?? 1);
          const gainB = (b.currentPrice - b.previousPrice) * (b.quantity ?? 1);
          return gainA - gainB;
        }
        case 'quantity_desc':
          return (b.quantity ?? 1) - (a.quantity ?? 1) || b.currentPrice - a.currentPrice;
        case 'alpha_asc':
          return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
        case 'recent': {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        }
        default:
          return 0;
      }
    });
  }, [state.items, searchQuery, sortBy]);

  // Cálculos globales de la cartera de inversión ponderando cantidad de cada carta
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalQuantity = 0;

    for (const card of state.items) {
      const qty = card.quantity ?? 1;
      totalQuantity += qty;
      totalInvested += card.previousPrice * qty;
      totalCurrent += card.currentPrice * qty;
    }

    const totalDiff = totalCurrent - totalInvested;
    const totalPercent = totalInvested > 0 ? (totalDiff / totalInvested) * 100 : 0;
    const trend = totalDiff > 0.01 ? 'up' : totalDiff < -0.01 ? 'down' : 'flat';

    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2)),
      totalDiff: Number(totalDiff.toFixed(2)),
      totalPercent: Number(totalPercent.toFixed(1)),
      totalQuantity,
      uniqueCards: state.items.length,
      trend
    };
  }, [state.items]);

  // Series temporales agregadas para la pestaña "Gráficas" de la colección completa
  const portfolioChartData = useMemo(
    () => buildPortfolioChart(state.items, portfolioTimeframe),
    [state.items, portfolioTimeframe]
  );

  // Distribución de cartas según tramos de rentabilidad (ROI %)
  const roiDistribution = useMemo(
    () => calculatePortfolioRoiDistribution(state.items),
    [state.items]
  );

  // Líderes de plusvalía y pérdida (candidatas a venta vs revisión)
  const profitLeaders = useMemo(
    () => getPortfolioProfitLeaders(state.items, 5),
    [state.items]
  );

  // Gráfica de evolución temporal para la carta en edición/detalle
  const cardChartData = useMemo(() => {
    if (!editingCard) {
      return { labels: [], values: [], unit: '€' };
    }
    const currentP = parseFloat(editCurrentPrice.replace(',', '.')) || editingCard.currentPrice;
    const prevP = parseFloat(editBuyPrice.replace(',', '.')) || editingCard.previousPrice;
    const cardSnapshot: CardEntity = {
      ...editingCard,
      currentPrice: currentP,
      previousPrice: prevP
    };

    return buildCardChart(cardSnapshot, chartTimeframe);
  }, [editingCard, editCurrentPrice, editBuyPrice, chartTimeframe]);

  const handleAddCard = async () => {
    if (!newTitle.trim()) {
      setToast('Indica al menos el nombre de la carta.');
      return;
    }
    const current = parseFloat(newCurrentPrice.replace(',', '.')) || 0;
    const previous = parseFloat(newBuyPrice.replace(',', '.')) || current;
    const qty = Math.max(1, parseInt(newQuantity.trim(), 10) || 1);

    await controller.createItem({
      title: newTitle.trim(),
      nameEn: newNameEn.trim() || undefined,
      edition: newEdition.trim() || 'General',
      editionCode: newEditionCode.trim() || undefined,
      language: newLanguage,
      quantity: qty,
      currentPrice: current,
      previousPrice: previous,
      condition: newCondition.trim() || undefined
    });

    setNewTitle('');
    setNewNameEn('');
    setNewEdition('Unlimited Edition');
    setNewEditionCode('2ED');
    setNewLanguage('EN');
    setNewQuantity('1');
    setNewBuyPrice('');
    setNewCurrentPrice('');
    setNewCondition('NM');
    setShowAddModal(false);
    setToast('Carta añadida a la cartera.');
  };

  const openEditModal = (card: CardEntity) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditNameEn(card.nameEn ?? '');
    setEditEdition(card.edition);
    setEditEditionCode(card.editionCode ?? '');
    setEditLanguage(card.language ?? 'EN');
    setEditQuantity(String(card.quantity ?? 1));
    setEditBuyPrice(String(card.previousPrice));
    setEditCurrentPrice(String(card.currentPrice));
    setEditCondition(card.condition ?? 'NM');

    // Arte de la carta desde Scryfall
    setImageLoadError(false);
    if (card.imageUrl) {
      setCardArtUrl(card.imageUrl);
      setLoadingArt(false);
    } else {
      setCardArtUrl(null);
      setLoadingArt(true);
      void controller
        .getCardImageUrl(card)
        .then((url) => {
          setCardArtUrl(url);
          setLoadingArt(false);
        })
        .catch(() => {
          setCardArtUrl(null);
          setLoadingArt(false);
        });
    }
  };

  const handleRefreshArt = async () => {
    if (!editingCard) return;
    setLoadingArt(true);
    setImageLoadError(false);
    try {
      const url = await controller.scryfallClient.resolveCardImageUrl({
        title: editTitle,
        nameEn: editNameEn || undefined,
        editionCode: editEditionCode || undefined,
        language: editLanguage
      });
      setCardArtUrl(url);
      if (url) {
        setToast('Arte actualizado desde Scryfall.');
      } else {
        setToast('No se encontró arte en Scryfall para estos datos.');
      }
    } catch {
      setCardArtUrl(null);
      setToast('Error al conectar con Scryfall.');
    } finally {
      setLoadingArt(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    if (!editTitle.trim()) {
      setToast('Indica al menos el nombre de la carta.');
      return;
    }
    const current = parseFloat(editCurrentPrice.replace(',', '.')) || 0;
    const previous = parseFloat(editBuyPrice.replace(',', '.')) || current;
    const qty = Math.max(1, parseInt(editQuantity.trim(), 10) || 1);

    await controller.updateCard(editingCard.id, {
      title: editTitle.trim(),
      nameEn: editNameEn.trim() || undefined,
      edition: editEdition.trim() || 'General',
      editionCode: editEditionCode.trim() || undefined,
      language: editLanguage,
      quantity: qty,
      currentPrice: current,
      previousPrice: previous,
      condition: editCondition.trim() || undefined,
      imageUrl: cardArtUrl ?? editingCard.imageUrl
    });

    setEditingCard(null);
    setToast(`Carta "${editTitle.trim()}" actualizada.`);
  };

  const handleDeleteCard = async () => {
    if (!editingCard) return;
    const name = editingCard.title;
    await controller.deleteItem(editingCard.id);
    setEditingCard(null);
    setToast(`Carta "${name}" eliminada de la cartera.`);
  };

  return (
    <AppShell<MTGTab>
      appName="MTGInvest"
      subtitle={`Gestor de Inversiones MTG · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'main', label: 'Principal', icon: 'home' },
        { id: 'analytics', label: 'Gráficas', icon: 'show-chart' },
        {
          id: APP_LAYOUT_BOUNDS.settingsTab.id,
          label: APP_LAYOUT_BOUNDS.settingsTab.label,
          icon: APP_LAYOUT_BOUNDS.settingsTab.icon
        }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'main' ? (
        <>
          {/* 1. Tarjeta Resumen: Cartera de Inversión */}
          <Card
            title="Cartera de inversión"
            subtitle={
              state.isSyncingPrices
                ? 'Actualizando cotizaciones Cardmarket...'
                : `${portfolioSummary.totalQuantity} carta(s) en total · ${portfolioSummary.uniqueCards} referencia(s)`
            }
            icon="account-balance-wallet"
            rightSlot={
              <Button
                size="sm"
                variant="primary"
                icon="add"
                label="Nueva carta"
                onPress={() => setShowAddModal(true)}
              />
            }
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.colors.surfaceMuted,
                padding: theme.spacing.md,
                borderRadius: theme.radius.md
              }}
            >
              <View>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  VALOR TOTAL DE MERCADO
                </Text>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.headingSize + 4,
                    fontVariant: ['tabular-nums'],
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  {portfolioSummary.totalCurrent.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  €
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Coste compra total:{' '}
                  {portfolioSummary.totalInvested.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  €
                </Text>
              </View>

              {/* Indicador Global Bursátil */}
              <View
                style={{
                  alignItems: 'flex-end',
                  backgroundColor:
                    portfolioSummary.trend === 'up'
                      ? theme.colors.successSoft
                      : portfolioSummary.trend === 'down'
                      ? theme.colors.dangerSoft
                      : theme.colors.surface,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.radius.md
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <GoogleIcon
                    name={
                      portfolioSummary.trend === 'up'
                        ? 'trending-up'
                        : portfolioSummary.trend === 'down'
                        ? 'trending-down'
                        : 'trending-flat'
                    }
                    size={18}
                    color={
                      portfolioSummary.trend === 'up'
                        ? theme.colors.success
                        : portfolioSummary.trend === 'down'
                        ? theme.colors.danger
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={{
                      color:
                        portfolioSummary.trend === 'up'
                          ? theme.colors.success
                          : portfolioSummary.trend === 'down'
                          ? theme.colors.danger
                          : theme.colors.textSecondary,
                      fontSize: theme.typography.bodySize,
                      fontVariant: ['tabular-nums'],
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {portfolioSummary.totalDiff >= 0 ? '+' : ''}
                    {portfolioSummary.totalDiff.toFixed(2)} €
                  </Text>
                </View>
                <Text
                  style={{
                    color:
                      portfolioSummary.trend === 'up'
                        ? theme.colors.success
                        : portfolioSummary.trend === 'down'
                        ? theme.colors.danger
                        : theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    fontVariant: ['tabular-nums'],
                    ...textTypographyStyle(theme, 'semibold')
                  }}
                >
                  {portfolioSummary.totalPercent >= 0 ? '+' : ''}
                  {portfolioSummary.totalPercent}%
                </Text>
              </View>
            </View>
          </Card>

          {/* Banner de actualización si se detecta caché de una versión previa con menos de 50 cartas */}
          {state.items.length < 50 ? (
            <View
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.accent,
                borderWidth: 1,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: theme.spacing.md
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  Cargar catálogo completo del Excel
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Tu almacenamiento local tiene guardadas {state.items.length} carta(s). Pulsa aquí para cargar las 57 cartas reales del Excel.
                </Text>
              </View>
              <Button
                size="sm"
                variant="primary"
                icon="refresh"
                label="Cargar 57 cartas"
                onPress={async () => {
                  await controller.resetToSeed();
                  setToast('¡Inventario cargado con las 57 cartas del Excel!');
                }}
              />
            </View>
          ) : null}

          {/* Barra de Búsqueda y Desplegable de Ordenación */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            {/* Input con lupita para filtrar por nombre o set */}
            <View style={{ flex: 1 }}>
              <SearchInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre o edición (ej. Serra, 2ED, Revised)..."
              />
            </View>

            {/* Iconito que lanza el desplegable para ordenar */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ordenar cartas. Criterio actual: ${activeSortOption.label}`}
              onPress={() => setShowSortModal(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: sortBy !== 'recent' ? theme.colors.accent : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                height: 44,
                paddingHorizontal: theme.spacing.md,
                gap: 6,
                opacity: pressed ? 0.8 : 1
              })}
            >
              <GoogleIcon
                name="swap-vert"
                size={20}
                color={sortBy !== 'recent' ? theme.colors.accent : theme.colors.textPrimary}
              />
              <Text
                style={{
                  color: sortBy !== 'recent' ? theme.colors.accent : theme.colors.textPrimary,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'semibold')
                }}
              >
                {activeSortOption.label}
              </Text>
            </Pressable>
          </View>

          {/* 2. Listado de Cartas: Pulsar para editar */}
          <View style={{ gap: theme.spacing.sm }}>
            {filteredAndSortedCards.length === 0 ? (
              <View
                style={{
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.xl,
                  alignItems: 'center',
                  gap: theme.spacing.md
                }}
              >
                <GoogleIcon name="search-off" size={36} color={theme.colors.textSecondary} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.bodySize + 1,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    No se encontraron cartas
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      textAlign: 'center',
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    No hay resultados para «{searchQuery}». Prueba con otro término o edición.
                  </Text>
                </View>
                <Button
                  size="sm"
                  variant="outline"
                  icon="close"
                  label="Limpiar búsqueda"
                  onPress={() => setSearchQuery('')}
                />
              </View>
            ) : (
              filteredAndSortedCards.map((card: CardEntity) => {
                const { diff, percent, trend } = calculateCardReturn(card);
                const isUp = trend === 'up';
                const isDown = trend === 'down';
                const trendColor = isUp
                  ? theme.colors.success
                  : isDown
                  ? theme.colors.danger
                  : theme.colors.textSecondary;
                const trendBg = isUp
                  ? theme.colors.successSoft
                  : isDown
                  ? theme.colors.dangerSoft
                  : theme.colors.surfaceMuted;

                const totalCardValue = card.currentPrice * (card.quantity ?? 1);

                return (
                  <Pressable
                    key={card.id}
                    onPress={() => openEditModal(card)}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar carta ${card.title}`}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing.md,
                      gap: theme.spacing.xs,
                      opacity: pressed ? 0.88 : 1
                    })}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      {/* Datos de la carta: Nombre (cantidad) y Edición */}
                      <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.bodySize + 1,
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {card.title} ({card.quantity ?? 1})
                          </Text>
                          <GoogleIcon
                            name="edit"
                            size={14}
                            color={theme.colors.textSecondary}
                          />
                        </View>

                        {card.nameEn && card.nameEn !== card.title ? (
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.captionSize,
                              fontStyle: 'italic',
                              marginTop: 1,
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {card.nameEn}
                          </Text>
                        ) : null}

                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 6
                          }}
                        >
                          {card.editionCode ? (
                            <Badge label={card.editionCode.toUpperCase()} tone="accent" />
                          ) : (
                            <Badge label={card.edition} tone="accent" />
                          )}
                          <Badge
                            label={card.language ? card.language.toUpperCase() : 'EN'}
                            tone="neutral"
                          />
                          {card.condition ? (
                            <Badge label={card.condition} tone="neutral" />
                          ) : null}
                        </View>
                      </View>

                      {/* Precios y Ticker Bursátil */}
                      <View style={{ alignItems: 'flex-end', minWidth: 120 }}>
                        {/* Valor Actual por unidad */}
                        <Text
                          style={{
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.bodySize + 2,
                            fontVariant: ['tabular-nums'],
                            ...textTypographyStyle(theme, 'bold')
                          }}
                        >
                          {card.currentPrice.toFixed(2)} €
                        </Text>

                        {/* Valor Anterior por unidad */}
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize,
                            fontVariant: ['tabular-nums'],
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          Ant: {card.previousPrice.toFixed(2)} €
                        </Text>

                        {/* Si tiene más de una unidad, mostrar valor total acumulado */}
                        {(card.quantity ?? 1) > 1 ? (
                          <Text
                            style={{
                              color: theme.colors.accent,
                              fontSize: theme.typography.captionSize,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'medium')
                            }}
                          >
                            Total: {totalCardValue.toFixed(2)} €
                          </Text>
                        ) : null}

                        {/* Variación estilo Bolsa (Subiendo/Bajando) */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                            backgroundColor: trendBg,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: theme.radius.sm,
                            marginTop: 4
                          }}
                        >
                          <GoogleIcon
                            name={isUp ? 'trending-up' : isDown ? 'trending-down' : 'trending-flat'}
                            size={14}
                            color={trendColor}
                          />
                          <Text
                            style={{
                              color: trendColor,
                              fontSize: theme.typography.captionSize,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {diff >= 0 ? '+' : ''}
                            {diff.toFixed(2)} € ({percent >= 0 ? '+' : ''}
                            {percent}%)
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Modal para añadir carta */}
          <ModalDialog
            visible={showAddModal}
            title="Añadir Carta a la Cartera"
            description="Registra una nueva carta indicando su nombre, cantidad, edición y cotización."
            confirmLabel="Guardar"
            cancelLabel="Cancelar"
            onCancel={() => setShowAddModal(false)}
            onConfirm={() => void handleAddCard()}
          >
            <View style={{ gap: theme.spacing.sm }}>
              <TextField
                label="Nombre de la carta (ES)"
                placeholder="Ej. Black Lotus"
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextField
                label="Nombre original (EN, opcional)"
                placeholder="Ej. Black Lotus"
                value={newNameEn}
                onChangeText={setNewNameEn}
              />

              {/* Selector de edición MTG a partir de la hoja Sets del Excel */}
              <Select
                label="Edición (Sets de MTG)"
                placeholder="Selecciona o busca un set..."
                value={newEdition}
                options={setOptions}
                onChange={(val) => {
                  const found = MTG_SETS.find((s) => s.name === val);
                  if (found) {
                    setNewEdition(found.name);
                    setNewEditionCode(found.code);
                  } else {
                    setNewEdition(val);
                  }
                }}
              />

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Cantidad"
                    placeholder="1"
                    value={newQuantity}
                    keyboardType="numeric"
                    onChangeText={setNewQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Select
                    label="Idioma"
                    value={newLanguage}
                    options={LANGUAGE_OPTIONS}
                    onChange={setNewLanguage}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Select
                    label="Estado"
                    value={newCondition}
                    options={CONDITION_OPTIONS}
                    onChange={setNewCondition}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Precio compra unitario (€)"
                    placeholder="Ej. 45.00"
                    value={newBuyPrice}
                    keyboardType="numeric"
                    onChangeText={setNewBuyPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Valor actual unitario (€)"
                    placeholder="Ej. 75.00"
                    value={newCurrentPrice}
                    keyboardType="numeric"
                    onChangeText={setNewCurrentPrice}
                  />
                </View>
              </View>
            </View>
          </ModalDialog>

          {/* Modal para editar carta seleccionada al pulsar sobre ella */}
          <ModalDialog
            visible={editingCard !== null}
            title="Editar Carta"
            description="Modifica los datos, edición, cantidad o cotización de esta carta."
            contentMaxHeight={520}
            confirmLabel="Guardar cambios"
            cancelLabel="Cancelar"
            leftAction={{
              label: 'Eliminar',
              variant: 'danger',
              icon: 'delete',
              onPress: () => void handleDeleteCard()
            }}
            onCancel={() => setEditingCard(null)}
            onConfirm={() => void handleSaveEdit()}
          >
            <View style={{ gap: theme.spacing.sm }}>
              {/* Arte de la carta obtenido desde Scryfall */}
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  minHeight: 180
                }}
              >
                {loadingArt ? (
                  <View style={{ alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.lg }}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'medium')
                      }}
                    >
                      Buscando arte en Scryfall...
                    </Text>
                  </View>
                ) : cardArtUrl && !imageLoadError ? (
                  <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
                    <Image
                      source={{
                        uri: cardArtUrl,
                        headers:
                          Platform.OS !== 'web'
                            ? {
                                'User-Agent':
                                  'Mozilla/5.0 (Linux; Android 10; Mobile) MTGInvest/2026.11',
                                Accept: 'image/webp,image/png,image/jpeg,image/*;q=0.8'
                              }
                            : undefined
                      }}
                      style={{
                        width: 154,
                        height: 215,
                        borderRadius: 8,
                        backgroundColor: theme.colors.surface
                      }}
                      resizeMode="contain"
                      onError={() => {
                        setImageLoadError(true);
                      }}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      <Badge label="Scryfall API" tone="accent" />
                      {editingCard?.lastPriceSyncDate ? (
                        <Badge label={`Cardmarket: ${editingCard.lastPriceSyncDate}`} tone="neutral" />
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recargar arte desde Scryfall"
                        onPress={() => {
                          setImageLoadError(false);
                          void handleRefreshArt();
                        }}
                        hitSlop={6}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <GoogleIcon name="refresh" size={14} color={theme.colors.textSecondary} />
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize,
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          Actualizar
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.md }}>
                    <GoogleIcon
                      name={imageLoadError ? 'broken-image' : 'image-not-supported'}
                      size={28}
                      color={theme.colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'regular')
                      }}
                    >
                      {imageLoadError
                        ? 'Error al descargar la imagen de la carta'
                        : 'Sin arte disponible en Scryfall'}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      icon="refresh"
                      label={imageLoadError ? 'Reintentar carga' : 'Buscar en Scryfall'}
                      onPress={() => {
                        setImageLoadError(false);
                        void handleRefreshArt();
                      }}
                    />
                  </View>
                )}
              </View>

              <TextField
                label="Nombre de la carta (ES)"
                placeholder="Ej. Ángel de Serra"
                value={editTitle}
                onChangeText={setEditTitle}
              />
              <TextField
                label="Nombre original (EN, opcional)"
                placeholder="Ej. Serra Angel"
                value={editNameEn}
                onChangeText={setEditNameEn}
              />

              {/* Selector de edición MTG a partir de la hoja Sets del Excel */}
              <Select
                label="Edición (Sets de MTG)"
                placeholder="Selecciona o busca un set..."
                value={editEdition}
                options={setOptions}
                onChange={(val) => {
                  const found = MTG_SETS.find((s) => s.name === val);
                  if (found) {
                    setEditEdition(found.name);
                    setEditEditionCode(found.code);
                  } else {
                    setEditEdition(val);
                  }
                }}
              />

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Cantidad"
                    placeholder="1"
                    value={editQuantity}
                    keyboardType="numeric"
                    onChangeText={setEditQuantity}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Select
                    label="Idioma"
                    value={editLanguage}
                    options={LANGUAGE_OPTIONS}
                    onChange={setEditLanguage}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Select
                    label="Estado"
                    value={editCondition}
                    options={CONDITION_OPTIONS}
                    onChange={setEditCondition}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Precio compra unitario (€)"
                    placeholder="Ej. 29.79"
                    value={editBuyPrice}
                    keyboardType="numeric"
                    onChangeText={setEditBuyPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Valor actual unitario (€)"
                    placeholder="Ej. 72.22"
                    value={editCurrentPrice}
                    keyboardType="numeric"
                    onChangeText={setEditCurrentPrice}
                  />
                </View>
              </View>

              {/* Gráfica con la evolución del precio de la carta (1S, 1M, 3M, 6M, 1A) */}
              <View style={{ marginTop: theme.spacing.sm, gap: theme.spacing.xs }}>
                {/* 1. Título y descripción */}
                <View style={{ gap: 2, paddingHorizontal: 2 }}>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.bodySize,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    Evolución del precio
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    {TIMEFRAME_DESCRIPTIONS[chartTimeframe]}
                  </Text>
                </View>

                {/* 2. Selectores de fechas entre el texto y el gráfico: 1S, 1M, 3M, 6M, 1A */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 6,
                    paddingHorizontal: 2,
                    marginVertical: 4
                  }}
                >
                  {(['1S', '1M', '3M', '6M', '1A'] as const).map((tf) => {
                    const isSelected = chartTimeframe === tf;
                    return (
                      <Button
                        key={tf}
                        size="sm"
                        variant={isSelected ? 'primary' : 'outline'}
                        label={tf}
                        onPress={() => setChartTimeframe(tf)}
                      />
                    );
                  })}
                </View>

                {/* 3. Gráfica */}
                <View
                  style={{
                    backgroundColor: theme.colors.surfaceMuted,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                  }}
                >
                  <SimpleLineChart
                    series={[
                      {
                        id: 'price-evolution',
                        name: 'Cotización',
                        color: theme.colors.accent,
                        values: cardChartData.values
                      }
                    ]}
                    labels={cardChartData.labels}
                    unit="€"
                    height={165}
                    showLegend={false}
                    showDots={true}
                    showGrid={true}
                  />
                </View>
              </View>
            </View>
          </ModalDialog>

          {/* Modal desplegable para seleccionar el criterio de ordenación */}
          <ModalDialog
            visible={showSortModal}
            title="Ordenar cartas"
            description="Selecciona cómo deseas ordenar la lista de cartas"
            cancelLabel="Cerrar"
            onCancel={() => setShowSortModal(false)}
          >
            <View style={{ gap: theme.spacing.xs }}>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = opt.id === sortBy;
                return (
                  <Pressable
                    key={opt.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Ordenar por ${opt.label}`}
                    onPress={() => {
                      setSortBy(opt.id);
                      setShowSortModal(false);
                      setToast(`Ordenado por: ${opt.label}`);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: theme.spacing.md,
                      backgroundColor: isSelected
                        ? theme.colors.accentSoft
                        : pressed
                        ? theme.colors.surfaceMuted
                        : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                      borderWidth: 1,
                      borderRadius: theme.radius.md,
                      opacity: pressed ? 0.85 : 1
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, flex: 1 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: theme.radius.sm,
                          backgroundColor: isSelected ? theme.colors.accent : theme.colors.surfaceMuted,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <GoogleIcon
                          name={opt.icon}
                          size={20}
                          color={isSelected ? theme.colors.textInverse : theme.colors.textSecondary}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.bodySize,
                            ...textTypographyStyle(theme, isSelected ? 'bold' : 'medium')
                          }}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize,
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          {opt.description}
                        </Text>
                      </View>
                    </View>

                    {isSelected ? (
                      <GoogleIcon name="check" size={20} color={theme.colors.accent} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </ModalDialog>
        </>
      ) : null}

      {/* Pestaña Gráficas: Vista macro de valor, evolución, ROI y distribución de la colección */}
      {activeTab === 'analytics' ? (
        <View style={{ gap: theme.spacing.md }}>
          {/* 1. KPIs Globales de Rendimiento de la Colección */}
          <Card
            title="Rendimiento Global de la Cartera"
            subtitle={`${portfolioSummary.totalQuantity} copias físicas · ${portfolioSummary.uniqueCards} cartas únicas en cartera`}
            icon="insights"
          >
            <View style={{ gap: theme.spacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm
                }}
              >
                {/* Coste Total Invertido */}
                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor: theme.colors.surfaceMuted,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    gap: 3
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    Inversión Total
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.titleSize - 2,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {portfolioSummary.totalInvested.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    €
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize - 1,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    Coste de adquisición
                  </Text>
                </View>

                {/* Valor Actual de Mercado */}
                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor: theme.colors.surfaceMuted,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    gap: 3
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    Valor de Cartera
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.titleSize - 2,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {portfolioSummary.totalCurrent.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    €
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize - 1,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    Cotización Cardmarket
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm
                }}
              >
                {/* Plusvalía Neta */}
                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor:
                      portfolioSummary.trend === 'up'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : portfolioSummary.trend === 'down'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : theme.colors.surfaceMuted,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor:
                      portfolioSummary.trend === 'up'
                        ? 'rgba(16, 185, 129, 0.25)'
                        : portfolioSummary.trend === 'down'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : theme.colors.border,
                    gap: 3
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    Plusvalía Neta
                  </Text>
                  <Text
                    style={{
                      color:
                        portfolioSummary.trend === 'up'
                          ? '#10B981'
                          : portfolioSummary.trend === 'down'
                          ? '#EF4444'
                          : theme.colors.textPrimary,
                      fontSize: theme.typography.titleSize - 2,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {portfolioSummary.totalDiff >= 0 ? '+' : ''}
                    {portfolioSummary.totalDiff.toLocaleString('es-ES', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    €
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize - 1,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    Ganancia no realizada
                  </Text>
                </View>

                {/* Rentabilidad ROI (%) */}
                <View
                  style={{
                    flex: 1,
                    minWidth: 140,
                    backgroundColor:
                      portfolioSummary.trend === 'up'
                        ? 'rgba(16, 185, 129, 0.08)'
                        : portfolioSummary.trend === 'down'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : theme.colors.surfaceMuted,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor:
                      portfolioSummary.trend === 'up'
                        ? 'rgba(16, 185, 129, 0.25)'
                        : portfolioSummary.trend === 'down'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : theme.colors.border,
                    gap: 3
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    Rentabilidad (ROI)
                  </Text>
                  <Text
                    style={{
                      color:
                        portfolioSummary.trend === 'up'
                          ? '#10B981'
                          : portfolioSummary.trend === 'down'
                          ? '#EF4444'
                          : theme.colors.textPrimary,
                      fontSize: theme.typography.titleSize - 2,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {portfolioSummary.totalPercent >= 0 ? '+' : ''}
                    {portfolioSummary.totalPercent} %
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize - 1,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    Rendimiento sobre coste
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* 2. Gráfica Consolidada de Evolución de la Colección */}
          <Card
            title="Evolución de la Colección"
            subtitle={TIMEFRAME_DESCRIPTIONS[portfolioTimeframe]}
            icon="show-chart"
          >
            <View style={{ gap: theme.spacing.md }}>
              {/* Selector de Métrica (Valor, Beneficio, ROI) */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  backgroundColor: theme.colors.surfaceMuted,
                  padding: 4,
                  borderRadius: theme.radius.md
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver gráfica de Valor e Inversión"
                  onPress={() => setActiveMetricChart('value')}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    backgroundColor:
                      activeMetricChart === 'value' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      color:
                        activeMetricChart === 'value'
                          ? theme.colors.accentText
                          : theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize + 1,
                      ...textTypographyStyle(
                        theme,
                        activeMetricChart === 'value' ? 'bold' : 'medium'
                      )
                    }}
                  >
                    Valor vs Inversión (€)
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver gráfica de Beneficio Neto"
                  onPress={() => setActiveMetricChart('profit')}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    backgroundColor:
                      activeMetricChart === 'profit' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      color:
                        activeMetricChart === 'profit'
                          ? theme.colors.accentText
                          : theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize + 1,
                      ...textTypographyStyle(
                        theme,
                        activeMetricChart === 'profit' ? 'bold' : 'medium'
                      )
                    }}
                  >
                    Beneficio Neto (€)
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ver gráfica de ROI"
                  onPress={() => setActiveMetricChart('roi')}
                  style={{
                    flex: 1,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    backgroundColor:
                      activeMetricChart === 'roi' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      color:
                        activeMetricChart === 'roi'
                          ? theme.colors.accentText
                          : theme.colors.textSecondary,
                      fontSize: theme.typography.captionSize + 1,
                      ...textTypographyStyle(
                        theme,
                        activeMetricChart === 'roi' ? 'bold' : 'medium'
                      )
                    }}
                  >
                    ROI Global (%)
                  </Text>
                </Pressable>
              </View>

              {/* Selector de Rango Temporal (1S, 1M, 3M, 6M, 1A) entre texto y gráfico */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6
                }}
              >
                {(['1S', '1M', '3M', '6M', '1A'] as const).map((tf) => {
                  const isSelected = portfolioTimeframe === tf;
                  return (
                    <Button
                      key={tf}
                      size="sm"
                      variant={isSelected ? 'primary' : 'outline'}
                      label={tf}
                      onPress={() => setPortfolioTimeframe(tf)}
                    />
                  );
                })}
              </View>

              {/* Gráfica SimpleLineChart según la métrica activa */}
              <View
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }}
              >
                {activeMetricChart === 'value' ? (
                  <SimpleLineChart
                    series={[
                      {
                        id: 'portfolio-val',
                        name: 'Valor de Mercado',
                        color: theme.colors.accent,
                        values: portfolioChartData.portfolioValues
                      },
                      {
                        id: 'portfolio-inv',
                        name: 'Inversión Total',
                        color: '#64748B',
                        values: portfolioChartData.investmentValues
                      }
                    ]}
                    labels={portfolioChartData.labels}
                    unit="€"
                    height={205}
                    showLegend={true}
                    showDots={true}
                    showGrid={true}
                  />
                ) : activeMetricChart === 'profit' ? (
                  <SimpleLineChart
                    series={[
                      {
                        id: 'portfolio-profit',
                        name: 'Beneficio Neto',
                        color: '#10B981',
                        values: portfolioChartData.profitValues
                      }
                    ]}
                    labels={portfolioChartData.labels}
                    unit="€"
                    height={205}
                    showLegend={false}
                    showDots={true}
                    showGrid={true}
                  />
                ) : (
                  <SimpleLineChart
                    series={[
                      {
                        id: 'portfolio-roi',
                        name: 'Rentabilidad (ROI)',
                        color: '#8B5CF6',
                        values: portfolioChartData.roiValues
                      }
                    ]}
                    labels={portfolioChartData.labels}
                    unit="%"
                    height={205}
                    showLegend={false}
                    showDots={true}
                    showGrid={true}
                  />
                )}
              </View>
            </View>
          </Card>

          {/* 3. Distribución de Rentabilidad (ROI %) */}
          <Card
            title="Distribución de Rentabilidad (ROI %)"
            subtitle="Desglose por tramos de ganancia y pérdida en la colección"
            icon="pie-chart"
          >
            <View style={{ gap: theme.spacing.sm }}>
              {roiDistribution.map((bucket) => (
                <View key={bucket.id} style={{ gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: bucket.color
                        }}
                      />
                      <Text
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.captionSize + 1,
                          ...textTypographyStyle(theme, 'medium')
                        }}
                      >
                        {bucket.label} ({bucket.rangeLabel})
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'bold')
                      }}
                    >
                      {bucket.count} carta(s) · {bucket.percentage} %
                    </Text>
                  </View>

                  {/* Barra de progreso */}
                  <View
                    style={{
                      height: 8,
                      backgroundColor: theme.colors.surfaceMuted,
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(bucket.percentage, bucket.count > 0 ? 3 : 0))}%`,
                        backgroundColor: bucket.color,
                        borderRadius: 4
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* 4. Top 5 Joyas de la Cartera (Mayor Plusvalía en €) */}
          <Card
            title="Top 5 • Mayor Plusvalía (€)"
            subtitle="Cartas con mayor revalorización monetaria neta"
            icon="trending-up"
          >
            <View style={{ gap: theme.spacing.xs }}>
              {profitLeaders.topGainers.map((card, idx) => (
                <View
                  key={card.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth: idx < profitLeaders.topGainers.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text
                        style={{
                          color: '#10B981',
                          fontSize: theme.typography.captionSize,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.bodySize,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                        numberOfLines={1}
                      >
                        {card.title} {card.quantity > 1 ? `(${card.quantity})` : ''}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.captionSize,
                          ...textTypographyStyle(theme, 'regular')
                        }}
                      >
                        {card.edition} {card.editionCode ? `[${card.editionCode}]` : ''} · Compra: {card.unitBuyPrice} €
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text
                      style={{
                        color: '#10B981',
                        fontSize: theme.typography.bodySize,
                        ...textTypographyStyle(theme, 'bold')
                      }}
                    >
                      +{card.totalProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </Text>
                    <Text
                      style={{
                        color: '#10B981',
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'medium')
                      }}
                    >
                      +{card.roiPercent} %
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* 5. Top 5 Mayor Pérdida (€) */}
          <Card
            title="Top 5 • Mayor Pérdida (€)"
            subtitle="Cartas con mayor caída respecto al precio de adquisición"
            icon="trending-down"
          >
            <View style={{ gap: theme.spacing.xs }}>
              {profitLeaders.topLosers.map((card, idx) => (
                <View
                  key={card.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: theme.spacing.sm,
                    borderBottomWidth: idx < profitLeaders.topLosers.length - 1 ? 1 : 0,
                    borderBottomColor: theme.colors.border
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Text
                        style={{
                          color: '#EF4444',
                          fontSize: theme.typography.captionSize,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.bodySize,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                        numberOfLines={1}
                      >
                        {card.title} {card.quantity > 1 ? `(${card.quantity})` : ''}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.captionSize,
                          ...textTypographyStyle(theme, 'regular')
                        }}
                      >
                        {card.edition} {card.editionCode ? `[${card.editionCode}]` : ''} · Compra: {card.unitBuyPrice} €
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text
                      style={{
                        color: '#EF4444',
                        fontSize: theme.typography.bodySize,
                        ...textTypographyStyle(theme, 'bold')
                      }}
                    >
                      {card.totalProfit.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </Text>
                    <Text
                      style={{
                        color: '#EF4444',
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'medium')
                      }}
                    >
                      {card.roiPercent} %
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {activeTab === 'settings' ? (
        <View style={{ gap: theme.spacing.md }}>
          <Card
            title="Cotizaciones Cardmarket (vía Scryfall)"
            subtitle={
              state.lastPriceSyncDate
                ? `Última sincronización: ${state.lastPriceSyncDate}`
                : 'Sincronización diaria por lote'
            }
            icon="currency-exchange"
          >
            <View style={{ gap: theme.spacing.sm }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                Actualiza los precios en EUR de Cardmarket mediante el endpoint por lotes oficial de Scryfall (hasta 75 cartas en 1 sola llamada HTTP). Se ejecuta automáticamente una vez al día al abrir la aplicación para no saturar la API.
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                <Button
                  size="sm"
                  variant="primary"
                  icon="refresh"
                  label={state.isSyncingPrices ? 'Actualizando cotizaciones...' : 'Actualizar cotizaciones ahora'}
                  disabled={state.isSyncingPrices}
                  onPress={async () => {
                    setToast('Consultando cotizaciones de Cardmarket en Scryfall...');
                    const res = await controller.syncCardmarketPrices({ force: true });
                    setToast(`Cotizaciones actualizadas (${res.updatedCount} cartas revisadas).`);
                  }}
                />
              </View>
            </View>
          </Card>

          <Card
            title="Inventario y Catálogo Excel"
            subtitle="Sincronización y recarga de datos"
            icon="settings-backup-restore"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                Actualmente tienes <Text style={{ color: theme.colors.textPrimary, ...textTypographyStyle(theme, 'bold') }}>{state.items.length}</Text> referencia(s) en tu almacenamiento local. El catálogo del Excel incluye 57 cartas completas y 1.047 sets oficiales.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                <Button
                  size="sm"
                  variant="primary"
                  icon="refresh"
                  label="Restablecer a las 57 cartas del Excel"
                  onPress={async () => {
                    await controller.resetToSeed();
                    setToast('Inventario restablecido a las 57 cartas del Excel.');
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  icon="cloud-download"
                  label="Importar cartas faltantes"
                  onPress={async () => {
                    await controller.importMissingSeeds();
                    setToast('Cartas del Excel importadas.');
                  }}
                />
              </View>
            </View>
          </Card>

          <Card
            title="Acerca de MTGInvest"
            subtitle="Gestor de Inversiones MTG"
            icon="info"
          >
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              Aplicación de gestión y valoración bursátil de inversiones en Magic: The Gathering construida sobre la arquitectura modular del Framework.
            </Text>
          </Card>

          {/* Última línea de la pestaña Ajustes: versiones de la base y de la aplicación */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: theme.spacing.xs,
              paddingTop: theme.spacing.md,
              paddingBottom: theme.spacing.xl
            }}
          >
            <Badge label={`base v${BASE_VERSION}`} tone="neutral" />
            <Badge label={`app v${APP_VERSION}`} tone="accent" />
          </View>
        </View>
      ) : null}
    </AppShell>
  );
}
