import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View
} from 'react-native';
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
  ToggleChip,
  useFrameworkTheme,
  useFrameworkThemeContext,
  type ThemeScheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import {
  clearCardImageCache,
  loadCardImageAsDataUri,
  SCRYFALL_IMAGE_HEADERS
} from './cardImageLoader';
import { CardThumbnail } from './CardThumbnail';
import {
  buildCardChart,
  buildPortfolioChart,
  calculateCardReturn,
  calculatePortfolioRoiDistribution,
  getPortfolioProfitLeaders,
  type CardEntity,
  type CardProfitLeader,
  type ChartTimeframe,
  type IMintmoxController,
  type IMtginvestController,
  type RoiDistributionBucket,
  type ScryfallCardData,
  type ScryfallSearchResult,
  type CreateCardInput,
  detectAndParseCards,
  getCardCollections,
  exportCardsToCsv,
  exportCardsToJson,
  MTG_SETS,
  TIMEFRAME_DESCRIPTIONS
} from './mvc';
import { APP_VERSION, BASE_VERSION } from './version';

export type MTGTab = 'main' | 'collections' | 'analytics' | 'settings';

export type AppLanguage = 'es' | 'en';

export type CardListViewMode = 'list' | 'grid';

const VIEW_MODE_STORAGE_KEY = 'mintmox_view_mode_preference';

function getInitialViewMode(): CardListViewMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === 'list' || saved === 'grid') return saved;
    }
  } catch { }
  return 'grid';
}

export interface MintMoxScreenProps {
  controller: IMintmoxController;
  themePreference?: ThemeScheme;
  onThemePreferenceChange?: (next: ThemeScheme) => void;
  languagePreference?: AppLanguage;
  onLanguagePreferenceChange?: (next: AppLanguage) => void;
}

export type MTGInvestScreenProps = MintMoxScreenProps;

export interface LanguageOptionDef {
  id: AppLanguage;
  label: string;
  nativeLabel: string;
  badge: string;
  description: string;
}

export const APP_LANGUAGE_OPTIONS: LanguageOptionDef[] = [
  {
    id: 'es',
    label: 'Español',
    nativeLabel: 'Español',
    badge: 'ES',
    description: 'Español (Castellano)'
  },
  {
    id: 'en',
    label: 'Inglés',
    nativeLabel: 'English',
    badge: 'EN',
    description: 'English (US / Global)'
  }
];

export const I18N_STRINGS = {
  es: {
    tabMain: 'Principal',
    tabCollections: 'Colecciones',
    tabAnalytics: 'Gráficas',
    tabSettings: 'Ajustes',
    collectionsCardTitle: 'Mis Colecciones y Carpetas',
    collectionsCardSubtitle: 'Organización de cartas por carpetas, mazos o inversión',
    newCollectionButton: 'Nueva colección',
    allCollectionsLabel: 'Todas',
    createCollectionTitle: 'Crear nueva colección',
    createCollectionDesc: 'Crea una carpeta o archivador virtual para organizar tus cartas (ej. Trade Binder, Reservelist, Mazo Commander).',
    collectionNameLabel: 'Nombre de la colección',
    collectionNamePlaceholder: 'Ej. Carpeta de Intercambio, Reservelist, Mazo Commander...',
    createCollectionSubmit: 'Crear colección',
    collectionCreatedToast: (name: string) => `Colección «${name}» creada.`,
    collectionLabel: 'Colección / Carpeta',
    collectionFilterLabel: 'Filtrar por colección',
    exploreCollectionButton: 'Ver cartas de esta colección',
    emptyCollectionNotice: 'Esta colección aún no tiene cartas asignadas.',
    themeCardTitle: 'Aspecto y Tema',
    themeCardSubtitle: 'Modo claro, modo oscuro y estilos de color',
    themeDescription: 'Personaliza la interfaz eligiendo entre el modo claro, modo oscuro o temas con paletas adaptadas a tu flujo de trabajo.',
    themeToast: (name: string) => `Tema cambiado a ${name}.`,
    languageCardTitle: 'Idioma',
    languageCardSubtitle: 'Español e Inglés',
    languageDescription: 'Selecciona el idioma preferido para la navegación y elementos de la interfaz.',
    languageToast: (name: string) => `Idioma cambiado a ${name}.`,
    cardmarketCardTitle: 'Cotizaciones Cardmarket (vía Scryfall)',
    syncDailySubtitle: 'Sincronización diaria por lote',
    lastSyncSubtitle: (date: string) => `Última sincronización: ${date}`,
    cardmarketDescription: 'Actualiza los precios en EUR de Cardmarket mediante el endpoint por lotes oficial de Scryfall (hasta 75 cartas en 1 sola llamada HTTP). Se ejecuta automáticamente una vez al día al abrir la aplicación para no saturar la API.',
    syncButton: 'Actualizar cotizaciones ahora',
    syncingButton: 'Actualizando cotizaciones...',
    syncConsultingToast: 'Consultando cotizaciones de Cardmarket en Scryfall...',
    syncDoneToast: (count: number) => `Cotizaciones actualizadas (${count} cartas revisadas).`,
    inventoryCardTitle: 'Inventario',
    inventoryCardSubtitle: 'Gestión y borrado de la cartera',
    inventoryDescription: (count: number) => `Actualmente tienes ${count} carta(s) registrada(s) en tu almacenamiento local.`,
    resetButton: 'Resetear inventario',
    resetToast: 'Inventario restablecido a las 57 cartas de prueba.',
    clearToast: 'Inventario vaciado por completo (0 cartas).',
    importExportCardTitle: 'Importar y Exportar Cartera',
    importExportCardSubtitle: 'Copias de seguridad en JSON y CSV',
    importExportDescription: 'Exporta tu inventario completo para guardarlo como copia de seguridad o abrirlo en Excel/Google Sheets, o importa colecciones completas desde archivos JSON o CSV.',
    exportJsonButton: 'Exportar a JSON',
    exportCsvButton: 'Exportar a CSV',
    importButton: 'Importar cartas (JSON o CSV)',
    aboutCardTitle: 'Acerca de MintMox',
    aboutCardSubtitle: 'Gestor de Colecciones e Inversiones MTG',
    aboutDescription: 'Aplicación de gestión y valoración bursátil de colecciones e inversiones en Magic: The Gathering construida sobre la arquitectura modular del Framework.',
    legalDisclaimerTitle: 'Aviso Legal y Propiedad Intelectual',
    wotcDisclaimer: 'MintMox es contenido de fans no oficial permitido bajo la Política de Contenido de Fans de Wizards of the Coast. No está aprobado ni respaldado por Wizards. Parte de los materiales utilizados son propiedad de Wizards of the Coast. ©Wizards of the Coast LLC.',
    thirdPartyDisclaimer: 'Las imágenes y cotizaciones son obtenidas mediante la API de Scryfall con fines informativos. Magic: The Gathering, Scryfall y Cardmarket son marcas registradas de sus respectivos propietarios. MintMox es una aplicación independiente, gratuita y de código abierto sin afiliación con dichas entidades.',
    privacyPolicyButton: 'Política de Privacidad',
    privacyPolicyTitle: 'Política de Privacidad',
    privacyPolicySubtitle: 'Compromiso de Privacidad y Almacenamiento Local',
    privacyP1Title: 'Arquitectura Local-First',
    privacyP1Desc: 'MintMox es una aplicación 100% gratuita y sin anuncios. Toda tu cartera, precios de compra y colecciones se almacenan localmente en tu dispositivo mediante SQLite. No se envían a ningún servidor ni se comparten con terceros.',
    privacyP2Title: 'Cero Recopilación de Datos',
    privacyP2Desc: 'No requerimos registro ni inicio de sesión. No recopilamos nombres, correos, ubicación, identificadores publicitarios ni datos biométricos.',
    privacyP3Title: 'Conexión a Scryfall',
    privacyP3Desc: 'La aplicación únicamente realiza solicitudes anónimas de sólo lectura a la API pública de Scryfall para obtener imágenes de cartas y precios de mercado en Euros provistos por Cardmarket.',
    privacyP4Title: 'Control y Borrado Total',
    privacyP4Desc: 'Puedes exportar tus datos a JSON/CSV o eliminarlos por completo en cualquier momento desde los ajustes de la app.',
    searchPlaceholder: 'Buscar por nombre, edición (ej. 2ED) o idioma...',
    sortButton: 'Ordenar',
    sortModalTitle: 'Ordenar cartas',
    addCardButton: 'Añadir carta',
    portfolioValue: 'Valor Cartera',
    portfolioInvested: 'Inversión',
    portfolioProfit: 'Plusvalía Neta',
    portfolioRoi: 'ROI Global',
    totalCards: 'Total Copias'
  },
  en: {
    tabMain: 'Portfolio',
    tabCollections: 'Collections',
    tabAnalytics: 'Analytics',
    tabSettings: 'Settings',
    collectionsCardTitle: 'My Collections & Binders',
    collectionsCardSubtitle: 'Organize cards by binders, decks, or investments',
    newCollectionButton: 'New collection',
    allCollectionsLabel: 'All',
    createCollectionTitle: 'Create new collection',
    createCollectionDesc: 'Create a virtual binder or folder to organize your cards (e.g. Trade Binder, Reservelist, Commander Deck).',
    collectionNameLabel: 'Collection name',
    collectionNamePlaceholder: 'e.g. Trade Binder, Reservelist, Commander Deck...',
    createCollectionSubmit: 'Create collection',
    collectionCreatedToast: (name: string) => `Collection "${name}" created.`,
    collectionLabel: 'Collection / Binder',
    collectionFilterLabel: 'Filter by collection',
    exploreCollectionButton: 'View cards in this collection',
    emptyCollectionNotice: 'No cards in this collection yet.',
    themeCardTitle: 'Appearance & Theme',
    themeCardSubtitle: 'Light, dark, and specialized color modes',
    themeDescription: 'Customize the interface choosing between light mode, dark mode, or themes with palettes tailored to your workflow.',
    themeToast: (name: string) => `Theme changed to ${name}.`,
    languageCardTitle: 'Language',
    languageCardSubtitle: 'Spanish & English',
    languageDescription: 'Select your preferred display language for navigation and user interface elements.',
    languageToast: (name: string) => `Language changed to ${name}.`,
    cardmarketCardTitle: 'Cardmarket Prices (via Scryfall)',
    syncDailySubtitle: 'Daily batch sync',
    lastSyncSubtitle: (date: string) => `Last sync: ${date}`,
    cardmarketDescription: 'Updates EUR prices from Cardmarket using Scryfall\'s official batch collection endpoint (up to 75 cards in a single HTTP call). Runs automatically once a day when opening the app to avoid rate limits.',
    syncButton: 'Update prices now',
    syncingButton: 'Updating prices...',
    syncConsultingToast: 'Fetching Cardmarket quotes from Scryfall...',
    syncDoneToast: (count: number) => `Quotes updated (${count} cards reviewed).`,
    inventoryCardTitle: 'Inventory',
    inventoryCardSubtitle: 'Portfolio management & reset',
    inventoryDescription: (count: number) => `You currently have ${count} card(s) in your local storage.`,
    resetButton: 'Reset inventory',
    resetToast: 'Inventory reset to the 57 test seed cards.',
    clearToast: 'Inventory cleared completely (0 cards).',
    importExportCardTitle: 'Import & Export Portfolio',
    importExportCardSubtitle: 'JSON and CSV backups',
    importExportDescription: 'Export your full collection for safe backup or opening in Excel/Google Sheets, or import portfolios from JSON or CSV files.',
    exportJsonButton: 'Export to JSON',
    exportCsvButton: 'Export to CSV',
    importButton: 'Import cards (JSON or CSV)',
    aboutCardTitle: 'About MintMox',
    aboutCardSubtitle: 'MTG Portfolio & Collection Manager',
    aboutDescription: 'Magic: The Gathering investment tracking and valuation app built on the modular Framework architecture.',
    legalDisclaimerTitle: 'Legal Information & Copyright',
    wotcDisclaimer: 'MintMox is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.',
    thirdPartyDisclaimer: 'Card images and market quotes are obtained via the Scryfall API for informational purposes. Magic: The Gathering, Scryfall, and Cardmarket are trademarks of their respective owners. MintMox is an independent, free, and open-source application with no affiliation to these entities.',
    privacyPolicyButton: 'Privacy Policy',
    privacyPolicyTitle: 'Privacy Policy',
    privacyPolicySubtitle: 'Privacy Commitment & Local-First Storage',
    privacyP1Title: 'Local-First Architecture',
    privacyP1Desc: 'MintMox is 100% free and ad-free. Your entire portfolio, buy prices, and collections are stored locally on your device via SQLite. No data is sent to external servers or shared with third parties.',
    privacyP2Title: 'Zero Personal Data Collection',
    privacyP2Desc: 'No registration or login required. We do not collect names, email addresses, location, advertising IDs, or biometric data.',
    privacyP3Title: 'Scryfall Connection',
    privacyP3Desc: 'The app only performs anonymous, read-only requests to the public Scryfall API to fetch card artwork and EUR market quotes provided by Cardmarket.',
    privacyP4Title: 'Full User Control & Deletion',
    privacyP4Desc: 'You can export your portfolio to JSON/CSV or completely wipe all stored data at any time from the app settings.',
    searchPlaceholder: 'Search by card name, edition (e.g. 2ED), or language...',
    sortButton: 'Sort',
    sortModalTitle: 'Sort cards',
    addCardButton: 'Add card',
    portfolioValue: 'Portfolio Value',
    portfolioInvested: 'Invested',
    portfolioProfit: 'Net Profit',
    portfolioRoi: 'Overall ROI',
    totalCards: 'Total Copies'
  }
};

export interface ThemeOptionDef {
  id: ThemeScheme;
  label: string;
  badge: string;
  description: string;
  icon: GoogleIconName;
  previewColors: {
    bg: string;
    surface: string;
    accent: string;
  };
}

export const THEME_OPTIONS: ThemeOptionDef[] = [
  {
    id: 'light',
    label: 'Modo Claro',
    badge: 'Clásico Azul',
    description: 'Lienzo blanco luminoso con acentos azul zafiro',
    icon: 'light-mode',
    previewColors: {
      bg: '#F4F6FA',
      surface: '#FFFFFF',
      accent: '#2563EB'
    }
  },
  {
    id: 'dark',
    label: 'Modo Oscuro',
    badge: 'Noche Profunda',
    description: 'Fondo azul pizarra oscuro con acentos celestes de alto contraste',
    icon: 'dark-mode',
    previewColors: {
      bg: '#0B1120',
      surface: '#111827',
      accent: '#38BDF8'
    }
  },
  {
    id: 'crimson',
    label: 'Modo Carmesí',
    badge: 'Productivo',
    description: 'Estética minimalista y cálida con acento rojo rubí inspirada en apps de alta productividad',
    icon: 'check-circle-outline',
    previewColors: {
      bg: '#FAF8F5',
      surface: '#FFFFFF',
      accent: '#DC4C3E'
    }
  },
  {
    id: 'obsidian',
    label: 'Modo Obsidiana',
    badge: 'Concentración',
    description: 'Lienzo grafito ultra oscuro con sutiles acentos violeta para máxima concentración',
    icon: 'auto-awesome',
    previewColors: {
      bg: '#111114',
      surface: '#18181D',
      accent: '#8B5CF6'
    }
  },
  {
    id: 'system',
    label: 'Automático (Sistema)',
    badge: 'Sistema',
    description: 'Sigue automáticamente la preferencia clara u oscura configurada en tu dispositivo',
    icon: 'settings-suggest',
    previewColors: {
      bg: '#E2E8F0',
      surface: '#FFFFFF',
      accent: '#64748B'
    }
  }
];

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

function triggerWebDownload(content: string, fileName: string, mimeType: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function openWebFilePicker(accept: string): Promise<{ name: string; content: string } | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement)?.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          resolve({ name: file.name, content: text });
        } else {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    }, 1000);
  });
}

/**
 * Pantalla principal de MintMox (@framework/mintmox-expo).
 *
 * Muestra la cartera de inversión en MTG con listado de cartas,
 * cotización actual, valor anterior e indicador bursátil de tendencia (subiendo/bajando).
 * Permite añadir y editar cada carta pulsando sobre ella, con selector de ediciones MTG.
 */
export function MintMoxScreen({
  controller,
  themePreference: propThemePreference,
  onThemePreferenceChange,
  languagePreference: propLanguagePreference,
  onLanguagePreferenceChange
}: MintMoxScreenProps) {
  const { theme, preference: contextPreference, setPreference } = useFrameworkThemeContext();
  const activeThemePreference = propThemePreference ?? contextPreference;

  const [internalLanguage, setInternalLanguage] = useState<AppLanguage>('es');
  const activeLanguage = propLanguagePreference ?? internalLanguage;

  const t = I18N_STRINGS[activeLanguage];

  const handleSelectTheme = (newTheme: ThemeScheme) => {
    setPreference(newTheme);
    onThemePreferenceChange?.(newTheme);
    const themeName =
      THEME_OPTIONS.find((t) => t.id === newTheme)?.label ?? newTheme;
    setToast(t.themeToast(themeName));
  };

  const handleSelectLanguage = (newLang: AppLanguage) => {
    setInternalLanguage(newLang);
    onLanguagePreferenceChange?.(newLang);
    const langLabel = newLang === 'en' ? 'English' : 'Español';
    setToast(I18N_STRINGS[newLang].languageToast(langLabel));
  };

  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<MTGTab>('main');
  const [toast, setToast] = useState<string | null>(null);

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
  const [newIsFoil, setNewIsFoil] = useState(false);
  const [newIsAltered, setNewIsAltered] = useState(false);
  const [newIsSigned, setNewIsSigned] = useState(false);

  // Estado para la búsqueda inteligente y autocompletado en Scryfall al añadir carta
  const [scryfallSearchText, setScryfallSearchText] = useState('');
  const [scryfallSuggestions, setScryfallSuggestions] = useState<ScryfallCardData[]>([]);
  const [isSearchingScryfall, setIsSearchingScryfall] = useState(false);
  const [scryfallSearchError, setScryfallSearchError] = useState<string | null>(null);
  const [selectedScryfallCard, setSelectedScryfallCard] = useState<ScryfallCardData | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined);
  const [newScryfallId, setNewScryfallId] = useState<string | undefined>(undefined);

  // Opciones de ediciones de Magic extraídas de la hoja Sets
  const setOptions: SelectOption<string>[] = useMemo(() => {
    const list: SelectOption<string>[] = MTG_SETS.map((s) => ({
      value: s.name,
      label: s.name,
      badge: s.code,
      description: s.year ? `Año ${s.year} · [${s.code}]` : `[${s.code}]`
    }));
    // Si la edición actual seleccionada no está en el catálogo predefinido, la añadimos dinámicamente
    if (newEdition && !list.some((opt) => opt.value === newEdition)) {
      list.unshift({
        value: newEdition,
        label: newEdition,
        badge: newEditionCode || undefined,
        description: `Edición de Scryfall [${newEditionCode || ''}]`
      });
    }
    return list;
  }, [newEdition, newEditionCode]);

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
  const [editIsFoil, setEditIsFoil] = useState(false);
  const [editIsAltered, setEditIsAltered] = useState(false);
  const [editIsSigned, setEditIsSigned] = useState(false);
  const [cardArtUrl, setCardArtUrl] = useState<string | null>(null);
  const [displayArtUri, setDisplayArtUri] = useState<string | null>(null);
  const [loadingArt, setLoadingArt] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageDownloading, setImageDownloading] = useState(false);
  const [imageRetryKey, setImageRetryKey] = useState(0);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('1A');

  // Estado para la barra de búsqueda y ordenación del tab principal
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MtgSortKey>('price_desc');
  const [showSortModal, setShowSortModal] = useState(false);

  // Modo de visualización del listado: 'grid' (Galería visual) o 'list' (Lista compacta con miniaturas)
  const [viewMode, setViewMode] = useState<CardListViewMode>(getInitialViewMode);

  const toggleViewMode = () => {
    setViewMode((prev) => {
      const next = prev === 'list' ? 'grid' : 'list';
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(VIEW_MODE_STORAGE_KEY, next);
        }
      } catch { }
      return next;
    });
  };

  // Estados para colecciones y carpetas
  const [userCustomCollections, setUserCustomCollections] = useState<string[]>([]);
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionNameInput, setNewCollectionNameInput] = useState('');
  const [newCardCollections, setNewCardCollections] = useState<string[]>(['Principal']);
  const [editCollections, setEditCollections] = useState<string[]>(['Principal']);
  const [showInlineNewCollection, setShowInlineNewCollection] = useState(false);
  const [inlineCollectionName, setInlineCollectionName] = useState('');

  const toggleNewCollection = (col: string) => {
    setNewCardCollections((prev) => {
      if (prev.includes(col)) {
        const next = prev.filter((c) => c !== col);
        return next.length > 0 ? next : ['Principal'];
      }
      return [...prev, col];
    });
  };

  const toggleEditCollection = (col: string) => {
    setEditCollections((prev) => {
      if (prev.includes(col)) {
        const next = prev.filter((c) => c !== col);
        return next.length > 0 ? next : ['Principal'];
      }
      return [...prev, col];
    });
  };

  // Estado para la pestaña de Gráficas de la Cartera completa
  const [portfolioTimeframe, setPortfolioTimeframe] = useState<ChartTimeframe>('1A');
  const [activeMetricChart, setActiveMetricChart] = useState<'value' | 'profit' | 'roi'>('value');

  // Estado para la importación y exportación de la cartera (JSON / CSV)
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportConfirmModal, setShowImportConfirmModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importReplace, setImportReplace] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalTitle, setExportModalTitle] = useState('Exportar Cartera');
  const [exportFileName, setExportFileName] = useState('');
  const [exportContent, setExportContent] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Estado para el modal de doble check de borrado / reset de inventario
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetMode, setResetMode] = useState<'clear' | 'seed'>('clear');
  const [isResetting, setIsResetting] = useState(false);

  // Estado para el modal de Política de Privacidad
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const state = useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
    }
  });

  // Colecciones disponibles consolidadas
  const availableCollections = useMemo(() => {
    const set = new Set<string>();
    set.add('Principal');
    for (const card of state.items) {
      for (const col of getCardCollections(card)) {
        set.add(col);
      }
    }
    for (const c of userCustomCollections) {
      if (c.trim()) set.add(c.trim());
    }
    return Array.from(set);
  }, [state.items, userCustomCollections]);

  // Crea y asigna una nueva colección en línea dentro del formulario de la carta
  const handleCreateInlineCollection = () => {
    const clean = inlineCollectionName.trim();
    if (!clean) return;
    if (!availableCollections.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      setUserCustomCollections((prev) => [...prev, clean]);
    }
    if (editingCard) {
      setEditCollections((prev) => Array.from(new Set([...prev, clean])));
    } else {
      setNewCardCollections((prev) => Array.from(new Set([...prev, clean])));
    }
    setInlineCollectionName('');
    setShowInlineNewCollection(false);
    setToast(t.collectionCreatedToast(clean));
  };

  // Resumen financiero y métricas de cada colección
  const collectionSummaries = useMemo(() => {
    return availableCollections.map((colName) => {
      const cards = state.items.filter((c) => {
        const cardCols = getCardCollections(c).map((x) => x.toLowerCase());
        return cardCols.includes(colName.toLowerCase());
      });
      const totalUnits = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
      const totalValue = cards.reduce((sum, c) => sum + c.currentPrice * (c.quantity || 1), 0);
      const totalInvested = cards.reduce(
        (sum, c) => sum + (c.buyPrice ?? c.previousPrice) * (c.quantity || 1),
        0
      );
      const netProfit = totalValue - totalInvested;
      const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
      const topCards = [...cards].sort((a, b) => b.currentPrice - a.currentPrice).slice(0, 4);

      return {
        name: colName,
        cards,
        uniqueCards: cards.length,
        totalUnits,
        totalValue: Number(totalValue.toFixed(2)),
        totalInvested: Number(totalInvested.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        roi: Number(roi.toFixed(1)),
        topCards
      };
    });
  }, [availableCollections, state.items]);

  const collectionSelectOptions: SelectOption<string>[] = useMemo(() => {
    return availableCollections.map((col) => ({
      value: col,
      label: col,
      badge: col === 'Principal' ? 'Base' : undefined
    }));
  }, [availableCollections]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), APP_LAYOUT_BOUNDS.toastDurationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  // Al abrir la aplicación, sincroniza en segundo plano las cotizaciones y portadas de Scryfall/Cardmarket
  useEffect(() => {
    const hasMissingImages = state.items.length > 0 && state.items.some((c) => !c.imageUrl);
    void controller.syncCardmarketPrices({ force: hasMissingImages }).catch(() => { });
  }, [controller, state.items.length]);

  // Sincroniza la URL del arte para la carta en edición/detalle
  useEffect(() => {
    if (!cardArtUrl) {
      setDisplayArtUri(null);
      setImageDownloading(false);
      setImageLoadError(false);
      return;
    }

    setDisplayArtUri(cardArtUrl);
    setImageDownloading(true);
    setImageLoadError(false);
  }, [cardArtUrl, imageRetryKey]);

  // Opción de ordenación activa
  const activeSortOption: SortOptionDef = useMemo(
    () => SORT_OPTIONS.find((opt) => opt.id === sortBy) ?? (SORT_OPTIONS[0] as SortOptionDef),
    [sortBy]
  );

  // Cartas filtradas por nombre o set y ordenadas por el criterio elegido
  const filteredAndSortedCards = useMemo(() => {
    const q = normalizeText(searchQuery);

    // 1. Filtrado en tiempo real por nombre (ES/EN) o edición (nombre/código) o atributos (foil, alterada, firmada)
    const filtered = state.items.filter((card) => {
      // Filtrado por colección si hay un archivador o carpeta seleccionado
      if (selectedCollectionFilter) {
        const cardCols = getCardCollections(card).map((x) => x.toLowerCase());
        if (!cardCols.includes(selectedCollectionFilter.toLowerCase())) {
          return false;
        }
      }

      if (!q) return true;
      const titleMatch = normalizeText(card.title).includes(q);
      const nameEnMatch = card.nameEn ? normalizeText(card.nameEn).includes(q) : false;
      const editionMatch = normalizeText(card.edition).includes(q);
      const codeMatch = card.editionCode ? normalizeText(card.editionCode).includes(q) : false;
      const langMatch = card.language ? normalizeText(card.language).includes(q) : false;
      const foilMatch = Boolean(card.isFoil) && (q === 'foil' || q === 'brillante' || (q.length >= 4 && 'foil'.startsWith(q)));
      const alteredMatch =
        Boolean(card.isAltered) &&
        (q === 'alter' || q === 'alterada' || q === 'altered' || (q.length >= 5 && 'alterada'.startsWith(q)));
      const signedMatch =
        Boolean(card.isSigned) &&
        (q === 'firm' || q === 'firma' || q === 'firmada' || q === 'signed' || (q.length >= 5 && 'firmada'.startsWith(q)));
      return (
        titleMatch ||
        nameEnMatch ||
        editionMatch ||
        codeMatch ||
        langMatch ||
        foilMatch ||
        alteredMatch ||
        signedMatch
      );
    });

    // 2. Ordenación según el criterio seleccionado
    return filtered.sort((a, b) => {
      const baseA = a.buyPrice !== undefined && a.buyPrice > 0 ? a.buyPrice : a.previousPrice;
      const baseB = b.buyPrice !== undefined && b.buyPrice > 0 ? b.buyPrice : b.previousPrice;
      switch (sortBy) {
        case 'price_desc':
          return b.currentPrice - a.currentPrice;
        case 'price_asc':
          return a.currentPrice - b.currentPrice;
        case 'gain_desc': {
          const gainA = (a.currentPrice - baseA) * (a.quantity ?? 1);
          const gainB = (b.currentPrice - baseB) * (b.quantity ?? 1);
          return gainB - gainA;
        }
        case 'loss_asc': {
          const gainA = (a.currentPrice - baseA) * (a.quantity ?? 1);
          const gainB = (b.currentPrice - baseB) * (b.quantity ?? 1);
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
  }, [state.items, searchQuery, sortBy, selectedCollectionFilter]);

  // Cálculos globales de la cartera de inversión ponderando cantidad de cada carta
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalQuantity = 0;

    for (const card of state.items) {
      const qty = card.quantity ?? 1;
      totalQuantity += qty;
      const baseCost = card.buyPrice !== undefined && card.buyPrice > 0 ? card.buyPrice : card.previousPrice;
      totalInvested += baseCost * qty;
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
    const prevP = parseFloat(editBuyPrice.replace(',', '.')) || (editingCard.buyPrice ?? editingCard.previousPrice);
    const cardSnapshot: CardEntity = {
      ...editingCard,
      currentPrice: currentP,
      previousPrice: prevP,
      buyPrice: prevP,
      isFoil: editIsFoil,
      isAltered: editIsAltered,
      isSigned: editIsSigned
    };

    return buildCardChart(cardSnapshot, chartTimeframe);
  }, [editingCard, editCurrentPrice, editBuyPrice, editIsFoil, editIsAltered, editIsSigned, chartTimeframe]);

  // Autocompletado reactivo con Scryfall al escribir en el buscador del modal de añadir carta
  useEffect(() => {
    const query = scryfallSearchText.trim();
    if (query.length < 2) {
      setScryfallSuggestions([]);
      setIsSearchingScryfall(false);
      setScryfallSearchError(null);
      return;
    }

    let active = true;
    setIsSearchingScryfall(true);
    setScryfallSearchError(null);

    const timer = setTimeout(async () => {
      try {
        let results: ScryfallSearchResult | null = null;

        // 1. Si la consulta es el nombre de una carta (ej. "Taiga", "Black Lotus", "Serra Angel"):
        // Buscamos primero por nombre exacto con todas sus ediciones físicas (unique: 'prints', ordenadas cronológicamente)
        if (!query.includes(':') && !query.includes('*') && !query.includes('!')) {
          try {
            const exactRes = await controller.scryfallClient.searchCards(
              `!"${query}" game:paper -is:digital`,
              { unique: 'prints', order: 'released', dir: 'asc', paperOnly: true }
            );
            if (exactRes && exactRes.data.length > 0) {
              results = exactRes;
            }
          } catch { }
        }

        // 2. Si no es un nombre exacto o no hubo coincidencia, buscamos impresiones físicas generales
        if (!results || results.data.length === 0) {
          try {
            const generalRes = await controller.scryfallClient.searchCards(
              query.includes(':') ? query : `${query} game:paper -is:digital`,
              { unique: 'prints', order: 'released', dir: 'asc', paperOnly: true }
            );
            if (generalRes && generalRes.data.length > 0) {
              results = generalRes;
            }
          } catch { }
        }

        // 3. Fallback con comodín si solo se escribió una palabra parcial (ej. "tai*", "mox*")
        if ((!results || results.data.length === 0) && !query.includes(':') && !query.includes('*')) {
          try {
            const wildRes = await controller.scryfallClient.searchCards(
              `${query}* game:paper -is:digital`,
              { unique: 'prints', order: 'released', dir: 'asc', paperOnly: true }
            );
            if (wildRes && wildRes.data.length > 0) {
              results = wildRes;
            }
          } catch { }
        }

        // 4. Fallback internacional si está en español u otro idioma (ej. "Ángel de Serra")
        if ((!results || results.data.length === 0) && !query.includes(':')) {
          try {
            const langRes = await controller.scryfallClient.searchCards(
              `lang:any ${query} game:paper -is:digital`,
              { unique: 'prints', order: 'released', dir: 'asc', paperOnly: true }
            );
            if (langRes && langRes.data.length > 0) {
              results = langRes;
            }
          } catch { }
        }

        // 5. Fallback por si la consulta incluye sintaxis avanzada, asegurando exclusión digital
        if (!results || results.data.length === 0) {
          try {
            const anyRes = await controller.scryfallClient.searchCards(
              query.includes('game:') ? query : `${query} game:paper -is:digital`,
              { unique: 'prints', order: 'released', dir: 'asc', paperOnly: true }
            );
            if (anyRes && anyRes.data.length > 0) {
              results = anyRes;
            }
          } catch { }
        }

        if (!active) return;
        // Filtro estricto en cliente: solo cartas físicas reales de coleccionismo
        const paperCards = (results?.data ?? []).filter(
          (c) => !c.digital && (!c.games || c.games.includes('paper'))
        );
        setScryfallSuggestions(paperCards.slice(0, 30));
        setIsSearchingScryfall(false);
      } catch {
        if (!active) return;
        setScryfallSuggestions([]);
        setIsSearchingScryfall(false);
        setScryfallSearchError('No se pudo conectar con Scryfall.');
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [scryfallSearchText, controller]);

  const handleSelectScryfallSuggestion = (card: ScryfallCardData) => {
    setSelectedScryfallCard(card);

    // 1. Título preferente (español si existe) y nombre original en inglés
    const primaryTitle = card.printedName?.trim() || card.name.trim();
    const originalEn = card.name.trim();
    setNewTitle(primaryTitle);
    setNewNameEn(originalEn);

    // 2. Edición y código de set
    const setCodeUpper = card.set.toUpperCase();
    const foundSet = MTG_SETS.find((s) => s.code.toUpperCase() === setCodeUpper);
    if (foundSet) {
      setNewEdition(foundSet.name);
      setNewEditionCode(foundSet.code);
    } else {
      setNewEdition(card.setName || setCodeUpper);
      setNewEditionCode(setCodeUpper);
    }

    // 3. Cotización actual de Cardmarket en EUR (o USD como referencia)
    const preferFoil = newIsFoil || (!card.prices?.eur && Boolean(card.prices?.eurFoil));
    if (preferFoil && !newIsFoil && Boolean(card.prices?.eurFoil)) {
      setNewIsFoil(true);
    }
    const eurPrice = preferFoil
      ? (card.prices?.eurFoil ?? card.prices?.eur)
      : (card.prices?.eur ?? card.prices?.eurFoil);
    const usdPrice = preferFoil
      ? (card.prices?.usdFoil ?? card.prices?.usd)
      : (card.prices?.usd ?? card.prices?.usdFoil);
    if (eurPrice) {
      setNewCurrentPrice(eurPrice);
      if (!newBuyPrice || newBuyPrice === '0' || newBuyPrice === '') {
        setNewBuyPrice(eurPrice);
      }
    } else if (usdPrice) {
      setNewCurrentPrice(usdPrice);
      if (!newBuyPrice || newBuyPrice === '0' || newBuyPrice === '') {
        setNewBuyPrice(usdPrice);
      }
    }

    // 4. Portada de la carta y UUID canónico en Scryfall
    const imgUrl =
      card.imageUris?.normal ??
      card.imageUris?.large ??
      card.imageUris?.small ??
      card.cardFaces?.[0]?.imageUris?.normal ??
      card.cardFaces?.[0]?.imageUris?.small ??
      undefined;

    setNewImageUrl(imgUrl);
    setNewScryfallId(card.id);

    // Limpia la búsqueda para dejar ver el formulario completo con la previa
    setScryfallSuggestions([]);
    setScryfallSearchText('');
    setToast(`Datos de "${card.name}" [${setCodeUpper}] importados desde Scryfall.`);
  };

  const handleClearAddCardForm = () => {
    setNewTitle('');
    setNewNameEn('');
    setNewEdition('Unlimited Edition');
    setNewEditionCode('2ED');
    setNewLanguage('EN');
    setNewQuantity('1');
    setNewBuyPrice('');
    setNewCurrentPrice('');
    setNewCondition('NM');
    setNewIsFoil(false);
    setNewIsAltered(false);
    setNewIsSigned(false);
    setNewCardCollections(selectedCollectionFilter ? [selectedCollectionFilter] : ['Principal']);
    setSelectedScryfallCard(null);
    setScryfallSearchText('');
    setScryfallSuggestions([]);
    setNewImageUrl(undefined);
    setNewScryfallId(undefined);
    setShowInlineNewCollection(false);
    setInlineCollectionName('');
  };

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
      buyPrice: previous,
      isFoil: newIsFoil,
      isAltered: newIsAltered,
      isSigned: newIsSigned,
      condition: newCondition.trim() || undefined,
      imageUrl: newImageUrl || undefined,
      scryfallId: newScryfallId || undefined,
      collection: newCardCollections.join(', '),
      collections: newCardCollections,
      lastPriceSyncDate: current > 0 ? new Date().toISOString().split('T')[0] : undefined
    });

    handleClearAddCardForm();
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
    setEditBuyPrice(String(card.buyPrice ?? card.previousPrice));
    setEditCurrentPrice(String(card.currentPrice));
    setEditCondition(card.condition ?? 'NM');
    setEditIsFoil(Boolean(card.isFoil));
    setEditIsAltered(Boolean(card.isAltered));
    setEditIsSigned(Boolean(card.isSigned));
    setEditCollections(getCardCollections(card));
    setShowInlineNewCollection(false);
    setInlineCollectionName('');

    // Arte de la carta desde Scryfall
    setImageLoadError(false);
    setImageDownloading(Boolean(card.imageUrl));
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
          setImageDownloading(Boolean(url));
          setLoadingArt(false);
        })
        .catch(() => {
          setCardArtUrl(null);
          setImageDownloading(false);
          setLoadingArt(false);
        });
    }
  };

  const handleRefreshArt = async () => {
    if (!editingCard) return;
    setLoadingArt(true);
    setImageLoadError(false);
    if (cardArtUrl) {
      clearCardImageCache(cardArtUrl);
    }
    setImageRetryKey((k) => k + 1);
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
      setImageDownloading(false);
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
      buyPrice: previous,
      isFoil: editIsFoil,
      isAltered: editIsAltered,
      isSigned: editIsSigned,
      condition: editCondition.trim() || undefined,
      imageUrl: cardArtUrl ?? editingCard.imageUrl,
      collection: editCollections.join(', '),
      collections: editCollections
    });

    setShowInlineNewCollection(false);
    setInlineCollectionName('');
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

  const parsedImport = useMemo(() => {
    const trimmed = importText.trim();
    if (!trimmed) {
      return {
        cards: [] as CreateCardInput[],
        format: null as 'json' | 'csv' | null,
        error: null as string | null
      };
    }
    try {
      const res = detectAndParseCards(trimmed);
      if (res.cards.length === 0) {
        return {
          cards: [] as CreateCardInput[],
          format: res.format,
          error: 'No se encontraron cartas válidas en el contenido.'
        };
      }
      return { cards: res.cards, format: res.format, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al parsear el contenido.';
      return { cards: [] as CreateCardInput[], format: null, error: msg };
    }
  }, [importText]);

  const handleOpenImportModal = () => {
    setImportText('');
    setImportFileName(null);
    setImportReplace(false);
    setIsImporting(false);
    setShowImportModal(true);
  };

  const handlePickFileForImport = async () => {
    try {
      const picked = await openWebFilePicker('.json,.csv,text/csv,application/json');
      if (picked) {
        setImportFileName(picked.name);
        setImportText(picked.content);
      }
    } catch { }
  };

  const handleExecuteImport = async () => {
    if (parsedImport.cards.length === 0 || isImporting) return;
    setIsImporting(true);
    try {
      const result = await controller.importCards(parsedImport.cards, { replace: importReplace });
      setShowImportConfirmModal(false);
      setShowImportModal(false);
      setToast(
        importReplace
          ? `Cartera reemplazada con éxito (${result.importedCount} cartas importadas).`
          : `Se han añadido ${result.importedCount} cartas a la cartera con éxito.`
      );
      setImportText('');
      setImportFileName(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al importar';
      setToast(`Error en la importación: ${msg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      if (resetMode === 'clear') {
        await controller.clearInventory();
        setToast(t.clearToast);
      } else {
        await controller.resetToSeed();
        setToast(t.resetToast);
      }
      setShowResetConfirmModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el reseteo';
      setToast(`Error: ${msg}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportJson = async () => {
    const jsonStr = await controller.exportToJson();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `mintmox_cartera_${dateStr}.json`;

    setExportModalTitle('Exportar Cartera a JSON');
    setExportFileName(fileName);
    setExportContent(jsonStr);
    setExportFormat('json');
    setShowExportModal(true);

    if (Platform.OS === 'web') {
      triggerWebDownload(jsonStr, fileName, 'application/json');
      setToast(`Cartera exportada a ${fileName}`);
    } else {
      try {
        await Share.share({ title: fileName, message: jsonStr });
      } catch { }
    }
  };

  const handleExportCsv = async () => {
    const csvStr = await controller.exportToCsv();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `mintmox_cartera_${dateStr}.csv`;

    setExportModalTitle('Exportar Cartera a CSV');
    setExportFileName(fileName);
    setExportContent(csvStr);
    setExportFormat('csv');
    setShowExportModal(true);

    if (Platform.OS === 'web') {
      triggerWebDownload(csvStr, fileName, 'text/csv');
      setToast(`Cartera exportada a ${fileName}`);
    } else {
      try {
        await Share.share({ title: fileName, message: csvStr });
      } catch { }
    }
  };

  const handleCopyExportToClipboard = async () => {
    if (!exportContent) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportContent);
        setToast('¡Copiado al portapapeles!');
        return;
      }
    } catch { }
    try {
      await Share.share({ title: exportFileName, message: exportContent });
    } catch { }
  };

  // Manejo del botón físico "Atrás" en Android (cierre de modales y regreso a la pestaña Principal)
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (showInlineNewCollection) {
        setShowInlineNewCollection(false);
        setInlineCollectionName('');
        return true;
      }
      if (showPrivacyModal) {
        setShowPrivacyModal(false);
        return true;
      }
      if (showNewCollectionModal) {
        setShowNewCollectionModal(false);
        setNewCollectionNameInput('');
        return true;
      }
      if (showSortModal) {
        setShowSortModal(false);
        return true;
      }
      if (showAddModal) {
        setShowAddModal(false);
        handleClearAddCardForm();
        return true;
      }
      if (editingCard !== null) {
        setEditingCard(null);
        return true;
      }
      if (showExportModal) {
        setShowExportModal(false);
        return true;
      }
      if (showImportConfirmModal) {
        setShowImportConfirmModal(false);
        return true;
      }
      if (showImportModal) {
        setShowImportModal(false);
        return true;
      }
      if (showResetConfirmModal) {
        setShowResetConfirmModal(false);
        return true;
      }

      // Si no hay modales abiertos y el usuario no está en la pestaña Principal, vuelve a ella
      if (activeTab !== 'main') {
        setActiveTab('main');
        return true;
      }

      // Si ya está en la pestaña principal sin modales, permite salir/minimizar la app
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    activeTab,
    showPrivacyModal,
    showNewCollectionModal,
    showSortModal,
    showAddModal,
    editingCard,
    showExportModal,
    showImportConfirmModal,
    showImportModal,
    showResetConfirmModal,
    showInlineNewCollection
  ]);

  return (
    <AppShell<MTGTab>
      appName="MintMox"
      subtitle={`Gestor de Colecciones MTG · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'main', label: t.tabMain, icon: 'home' },
        { id: 'collections', label: t.tabCollections, icon: 'folder' },
        { id: 'analytics', label: t.tabAnalytics, icon: 'show-chart' },
        {
          id: APP_LAYOUT_BOUNDS.settingsTab.id,
          label: t.tabSettings,
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

            {/* Selector de vista: Galería (Cuadrícula) vs Lista compacta */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={viewMode === 'list' ? 'Cambiar a vista galería' : 'Cambiar a vista lista'}
              onPress={toggleViewMode}
              hitSlop={4}
              style={({ pressed }) => ({
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: viewMode === 'grid' ? theme.colors.accentSoft : theme.colors.surfaceMuted,
                borderColor: viewMode === 'grid' ? theme.colors.accent : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                height: 44,
                width: 44,
                opacity: pressed ? 0.8 : 1
              })}
            >
              <GoogleIcon
                name={viewMode === 'list' ? 'grid-view' : 'view-list'}
                size={20}
                color={viewMode === 'grid' ? theme.colors.accent : theme.colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Selector rápido de filtro por colección / carpeta */}
          {availableCollections.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              <ToggleChip
                label={`${t.allCollectionsLabel} (${portfolioSummary.totalQuantity})`}
                icon="layers"
                selected={selectedCollectionFilter === null}
                onPress={() => setSelectedCollectionFilter(null)}
              />
              {collectionSummaries.map((col) => (
                <ToggleChip
                  key={col.name}
                  label={`${col.name} (${col.totalUnits})`}
                  icon={col.name === 'Principal' ? 'home' : 'folder'}
                  selected={selectedCollectionFilter === col.name}
                  onPress={() =>
                    setSelectedCollectionFilter(
                      selectedCollectionFilter === col.name ? null : col.name
                    )
                  }
                />
              ))}
            </ScrollView>
          ) : null}

          {/* 2. Listado de Cartas: Galería visual o Lista compacta */}
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
            ) : viewMode === 'grid' ? (
              /* MODO CUADRÍCULA / GALERÍA VISUAL (BINDER) */
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.sm,
                  justifyContent: 'space-between'
                }}
              >
                {filteredAndSortedCards.map((card: CardEntity) => {
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

                  return (
                    <Pressable
                      key={card.id}
                      onPress={() => openEditModal(card)}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalles de ${card.title}`}
                      style={({ pressed }) => ({
                        width: '48.4%',
                        backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderWidth: 1,
                        borderRadius: theme.radius.lg,
                        overflow: 'hidden',
                        opacity: pressed ? 0.9 : 1,
                        marginBottom: theme.spacing.xs
                      })}
                    >
                      {/* Portada de la carta con badges flotantes */}
                      <View
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: 185,
                          backgroundColor: theme.colors.surfaceMuted
                        }}
                      >
                        <CardThumbnail
                          imageUrl={card.imageUrl}
                          title={card.title}
                          width="100%"
                          height={185}
                          borderRadius={0}
                          resizeMode="cover"
                          showBorder={false}
                          onResolveMissing={!card.imageUrl ? () => controller.getCardImageUrl(card) : undefined}
                        />

                        {/* Insignia de edición en esquina superior izquierda */}
                        <View style={{ position: 'absolute', top: 6, left: 6, zIndex: 2 }}>
                          <Badge
                            label={card.editionCode ? card.editionCode.toUpperCase() : card.edition}
                            tone="accent"
                          />
                        </View>

                        {/* Insignia de estado en esquina superior derecha */}
                        {card.condition ? (
                          <View style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
                            <Badge label={card.condition} tone="neutral" />
                          </View>
                        ) : null}

                        {/* Atributos de coleccionismo en esquina inferior izquierda */}
                        {card.isFoil || card.isAltered || card.isSigned ? (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              left: 6,
                              zIndex: 2,
                              flexDirection: 'row',
                              gap: 3
                            }}
                          >
                            {card.isFoil ? <Badge label="FOIL ✨" tone="accent" /> : null}
                            {card.isAltered ? <Badge label="ALTER 🎨" tone="neutral" /> : null}
                            {card.isSigned ? <Badge label="FIRMA ✍️" tone="neutral" /> : null}
                          </View>
                        ) : null}

                        {/* Pastilla flotante con cotización actual en esquina inferior derecha */}
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 6,
                            zIndex: 2,
                            backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            paddingHorizontal: 7,
                            paddingVertical: 3,
                            borderRadius: theme.radius.sm,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.15)'
                          }}
                        >
                          <Text
                            style={{
                              color: '#FFFFFF',
                              fontSize: 12,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {card.currentPrice.toFixed(2)} €
                          </Text>
                        </View>
                      </View>

                      {/* Información en el pie de la tarjeta */}
                      <View style={{ padding: theme.spacing.sm, gap: 3 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 4
                          }}
                        >
                          <Text
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.captionSize + 1,
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {card.title}
                          </Text>
                          {(card.quantity ?? 1) > 1 ? (
                            <Badge label={`x${card.quantity}`} tone="accent" />
                          ) : null}
                        </View>

                        {card.nameEn && card.nameEn !== card.title ? (
                          <Text
                            numberOfLines={1}
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: 11,
                              fontStyle: 'italic',
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {card.nameEn}
                          </Text>
                        ) : null}

                        {getCardCollections(card).filter((c) => c !== 'Principal').length > 0 ? (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: 1 }}>
                            {getCardCollections(card)
                              .filter((c) => c !== 'Principal')
                              .slice(0, 2)
                              .map((c) => (
                                <Badge key={c} label={c} tone="neutral" />
                              ))}
                          </View>
                        ) : null}

                        {/* Ticker de revalorización */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: 4
                          }}
                        >
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: 11,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {card.buyPrice !== undefined && card.buyPrice > 0
                              ? `Coste: ${card.buyPrice.toFixed(2)} €`
                              : `Ant: ${card.previousPrice.toFixed(2)} €`}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 2,
                              backgroundColor: trendBg,
                              paddingHorizontal: 5,
                              paddingVertical: 1,
                              borderRadius: theme.radius.sm
                            }}
                          >
                            <GoogleIcon
                              name={isUp ? 'trending-up' : isDown ? 'trending-down' : 'trending-flat'}
                              size={12}
                              color={trendColor}
                            />
                            <Text
                              style={{
                                color: trendColor,
                                fontSize: 10,
                                fontVariant: ['tabular-nums'],
                                ...textTypographyStyle(theme, 'bold')
                              }}
                            >
                              {percent >= 0 ? '+' : ''}{percent}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              /* MODO LISTA COMPACTA CON MINIATURAS VISUALES */
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
                      padding: theme.spacing.sm,
                      opacity: pressed ? 0.88 : 1
                    })}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.spacing.sm
                      }}
                    >
                      {/* Miniatura visual de la carta */}
                      <CardThumbnail
                        imageUrl={card.imageUrl}
                        title={card.title}
                        width={44}
                        height={62}
                        borderRadius={6}
                        resizeMode="cover"
                        onResolveMissing={!card.imageUrl ? () => controller.getCardImageUrl(card) : undefined}
                      />

                      {/* Datos de la carta: Nombre, Nombre original y Edición */}
                      <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: theme.colors.textPrimary,
                              fontSize: theme.typography.bodySize,
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {card.title}
                          </Text>
                          {(card.quantity ?? 1) > 1 ? (
                            <Badge label={`x${card.quantity}`} tone="accent" />
                          ) : null}
                        </View>

                        {card.nameEn && card.nameEn !== card.title ? (
                          <Text
                            numberOfLines={1}
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
                            flexWrap: 'wrap',
                            gap: 4,
                            marginTop: 4
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
                          {card.isFoil ? <Badge label="FOIL ✨" tone="accent" /> : null}
                          {card.isAltered ? <Badge label="ALTER 🎨" tone="neutral" /> : null}
                          {card.isSigned ? <Badge label="FIRMA ✍️" tone="neutral" /> : null}
                          {getCardCollections(card)
                            .filter((c) => c !== 'Principal')
                            .map((c) => (
                              <Badge key={c} label={c} tone="neutral" />
                            ))}
                        </View>
                      </View>

                      {/* Precios y Ticker Bursátil */}
                      <View style={{ alignItems: 'flex-end', minWidth: 105 }}>
                        <Text
                          style={{
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.bodySize + 1,
                            fontVariant: ['tabular-nums'],
                            ...textTypographyStyle(theme, 'bold')
                          }}
                        >
                          {card.currentPrice.toFixed(2)} €
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: 11,
                            fontVariant: ['tabular-nums'],
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          {card.buyPrice !== undefined && card.buyPrice > 0
                            ? `Coste: ${card.buyPrice.toFixed(2)} €`
                            : `Ant: ${card.previousPrice.toFixed(2)} €`}
                        </Text>
                        {(card.quantity ?? 1) > 1 ? (
                          <Text
                            style={{
                              color: theme.colors.accent,
                              fontSize: 11,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'medium')
                            }}
                          >
                            Total: {totalCardValue.toFixed(2)} €
                          </Text>
                        ) : null}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: trendBg,
                            paddingHorizontal: 5,
                            paddingVertical: 1,
                            borderRadius: theme.radius.sm,
                            marginTop: 2
                          }}
                        >
                          <GoogleIcon
                            name={isUp ? 'trending-up' : isDown ? 'trending-down' : 'trending-flat'}
                            size={12}
                            color={trendColor}
                          />
                          <Text
                            style={{
                              color: trendColor,
                              fontSize: 10,
                              fontVariant: ['tabular-nums'],
                              ...textTypographyStyle(theme, 'bold')
                            }}
                          >
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} € ({percent >= 0 ? '+' : ''}
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
            description="Busca una carta física en Scryfall para autocompletar edición, cotización en € y portada, o indícala manualmente."
            contentMaxHeight={540}
            confirmLabel="Guardar en Cartera"
            cancelLabel="Cancelar"
            onCancel={() => {
              setShowAddModal(false);
              handleClearAddCardForm();
            }}
            onConfirm={() => void handleAddCard()}
          >
            <View style={{ gap: theme.spacing.sm }}>
              {/* Buscador inteligente en Scryfall */}
              <View
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.sm,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  gap: theme.spacing.xs
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <GoogleIcon name="auto-awesome" size={16} color={theme.colors.accent} />
                    <Text
                      style={{
                        color: theme.colors.textPrimary,
                        fontSize: theme.typography.captionSize,
                        ...textTypographyStyle(theme, 'bold')
                      }}
                    >
                      Búsqueda de cartas físicas (Scryfall)
                    </Text>
                  </View>
                  <Badge label="Coleccionismo Físico" tone="accent" />
                </View>

                <SearchInput
                  placeholder="Buscar carta física (ej. Taiga, Black Lotus, Serra)..."
                  value={scryfallSearchText}
                  onChangeText={setScryfallSearchText}
                  onClear={() => {
                    setScryfallSearchText('');
                    setScryfallSuggestions([]);
                  }}
                />

                {isSearchingScryfall ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: 11,
                        ...textTypographyStyle(theme, 'regular')
                      }}
                    >
                      Buscando ediciones físicas y cotizaciones en Scryfall...
                    </Text>
                  </View>
                ) : null}

                {scryfallSearchError ? (
                  <Text
                    style={{
                      color: theme.colors.danger,
                      fontSize: 11,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    {scryfallSearchError}
                  </Text>
                ) : null}

                {/* Sugerencias devueltas por Scryfall con scroll propio y área acotada */}
                {scryfallSuggestions.length > 0 ? (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: theme.colors.border,
                      paddingTop: theme.spacing.xs,
                      gap: 6
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 2
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: 10,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                      >
                        EDICIONES FÍSICAS ENCONTRADAS ({scryfallSuggestions.length})
                      </Text>
                      <Pressable
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Cerrar sugerencias"
                        onPress={() => setScryfallSuggestions([])}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          opacity: pressed ? 0.7 : 1
                        })}
                      >
                        <GoogleIcon name="close" size={14} color={theme.colors.textSecondary} />
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: 10,
                            ...textTypographyStyle(theme, 'medium')
                          }}
                        >
                          Cerrar
                        </Text>
                      </Pressable>
                    </View>

                    {/* Contenedor con altura delimitada, overflow oculto y scroll vertical nativo */}
                    <View
                      style={{
                        height: 210,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.sm,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        overflow: 'hidden'
                      }}
                    >
                      <ScrollView
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={true}
                        style={{ flex: 1 }}
                        contentContainerStyle={{ padding: 6, gap: 6 }}
                      >
                        {scryfallSuggestions.map((card) => {
                          const eurVal = card.prices?.eur ?? card.prices?.eurFoil;
                          const usdVal = card.prices?.usd ?? card.prices?.usdFoil;
                          const thumbUri =
                            card.imageUris?.small ??
                            card.imageUris?.normal ??
                            card.cardFaces?.[0]?.imageUris?.small ??
                            undefined;
                          const setUpper = card.set.toUpperCase();
                          const foundSet = MTG_SETS.find((s) => s.code.toUpperCase() === setUpper);
                          const setLabel = foundSet?.name || card.setName || setUpper;
                          const yearLabel = foundSet?.year ? ` · ${foundSet.year}` : '';
                          return (
                            <Pressable
                              key={card.id}
                              onPress={() => handleSelectScryfallSuggestion(card)}
                              style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 6,
                                borderRadius: theme.radius.sm,
                                backgroundColor: pressed ? theme.colors.surfaceMuted : theme.colors.surface,
                                borderWidth: 1,
                                borderColor: pressed ? theme.colors.accent : theme.colors.border
                              })}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                <CardThumbnail
                                  imageUrl={thumbUri}
                                  title={card.name}
                                  width={28}
                                  height={39}
                                  borderRadius={4}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    numberOfLines={1}
                                    style={{
                                      color: theme.colors.textPrimary,
                                      fontSize: theme.typography.captionSize,
                                      ...textTypographyStyle(theme, 'bold')
                                    }}
                                  >
                                    {card.name}
                                  </Text>
                                  <Text
                                    numberOfLines={1}
                                    style={{
                                      color: theme.colors.textSecondary,
                                      fontSize: 10,
                                      ...textTypographyStyle(theme, 'regular')
                                    }}
                                  >
                                    [{setUpper}] {setLabel}{yearLabel}
                                  </Text>
                                </View>
                              </View>

                              <View style={{ alignItems: 'flex-end', marginLeft: 6 }}>
                                {eurVal ? (
                                  <Badge label={`${eurVal} €`} tone="success" />
                                ) : usdVal ? (
                                  <Badge label={`~${usdVal} $`} tone="neutral" />
                                ) : (
                                  <Badge label="Sin cotización" tone="neutral" />
                                )}
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Vista previa de la carta seleccionada desde Scryfall */}
              {newImageUrl ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.accent,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    gap: theme.spacing.sm
                  }}
                >
                  <CardThumbnail
                    imageUrl={newImageUrl}
                    title={newTitle}
                    width={48}
                    height={68}
                    borderRadius={6}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Badge label="Scryfall & Cardmarket" tone="accent" />
                      {newEditionCode ? <Badge label={newEditionCode} tone="neutral" /> : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: theme.colors.textPrimary,
                        fontSize: theme.typography.bodySize,
                        ...textTypographyStyle(theme, 'bold')
                      }}
                    >
                      {newTitle}
                    </Text>
                    {newNameEn && newNameEn !== newTitle ? (
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: theme.typography.captionSize,
                          ...textTypographyStyle(theme, 'regular')
                        }}
                      >
                        {newNameEn}
                      </Text>
                    ) : null}
                    <Text
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        ...textTypographyStyle(theme, 'regular')
                      }}
                    >
                      {newEdition} · Mercado: {newCurrentPrice || '0.00'} €
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar selección"
                    onPress={() => {
                      setSelectedScryfallCard(null);
                      setNewImageUrl(undefined);
                      setNewScryfallId(undefined);
                    }}
                    style={{
                      padding: 6,
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.surface
                    }}
                  >
                    <GoogleIcon name="close" size={18} color={theme.colors.textSecondary} />
                  </Pressable>
                </View>
              ) : null}

              {/* Formulario editable */}
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

              {/* Atributos especiales de coleccionismo físico */}
              <View style={{ gap: 4, marginTop: 2 }}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 11,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  Atributos de coleccionismo físico
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                  <ToggleChip
                    label="Foil ✨"
                    icon="auto-awesome"
                    selected={newIsFoil}
                    onPress={() => setNewIsFoil(!newIsFoil)}
                    accessibilityLabel="Marcar como versión Foil"
                  />
                  <ToggleChip
                    label="Alterada 🎨"
                    icon="palette"
                    selected={newIsAltered}
                    onPress={() => setNewIsAltered(!newIsAltered)}
                    accessibilityLabel="Marcar como carta Alterada"
                  />
                  <ToggleChip
                    label="Firmada ✍️"
                    icon="edit"
                    selected={newIsSigned}
                    onPress={() => setNewIsSigned(!newIsSigned)}
                    accessibilityLabel="Marcar como carta Firmada"
                  />
                </View>
              </View>

              {/* Asignación de Colección / Carpeta */}
              <View style={{ gap: 6, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 11,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    {t.collectionLabel} (puedes seleccionar varias)
                  </Text>
                  {!showInlineNewCollection ? (
                    <Pressable
                      hitSlop={6}
                      onPress={() => setShowInlineNewCollection(true)}
                    >
                      <Text
                        style={{
                          color: theme.colors.accent,
                          fontSize: 11,
                          ...textTypographyStyle(theme, 'semibold')
                        }}
                      >
                        + Nueva carpeta
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Creador en línea de nueva carpeta para evitar superposición de modales */}
                {showInlineNewCollection ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: theme.colors.surfaceMuted,
                      padding: 6,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.accent
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder={t.collectionNamePlaceholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={inlineCollectionName}
                        onChangeText={setInlineCollectionName}
                        onSubmitEditing={handleCreateInlineCollection}
                        returnKeyType="done"
                        autoFocus
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: 12,
                          paddingVertical: 4,
                          paddingHorizontal: 8
                        }}
                      />
                    </View>
                    <Button
                      size="sm"
                      variant="primary"
                      icon="check"
                      label="Añadir"
                      disabled={!inlineCollectionName.trim()}
                      onPress={handleCreateInlineCollection}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar"
                      onPress={() => {
                        setShowInlineNewCollection(false);
                        setInlineCollectionName('');
                      }}
                      style={{
                        padding: 6,
                        borderRadius: theme.radius.sm,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <GoogleIcon name="close" size={18} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {availableCollections.map((col) => {
                    const isSelected = newCardCollections.includes(col);
                    return (
                      <ToggleChip
                        key={col}
                        label={col}
                        selected={isSelected}
                        icon={isSelected ? 'check' : undefined}
                        tone="accent"
                        onPress={() => toggleNewCollection(col)}
                      />
                    );
                  })}
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
                  minHeight: 230
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
                    <View
                      style={{
                        width: 154,
                        height: 215,
                        borderRadius: 8,
                        overflow: 'hidden',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.colors.surfaceMuted,
                        borderWidth: 1,
                        borderColor: theme.colors.border
                      }}
                    >
                      {imageDownloading || !displayArtUri ? (
                        <View
                          style={{
                            position: 'absolute',
                            zIndex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4
                          }}
                        >
                          <ActivityIndicator size="small" color={theme.colors.accent} />
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: 10,
                              ...textTypographyStyle(theme, 'medium')
                            }}
                          >
                            Cargando...
                          </Text>
                        </View>
                      ) : null}
                      {displayArtUri ? (
                        <Image
                          key={`${displayArtUri.slice(0, 40)}-${imageRetryKey}`}
                          source={{
                            uri: displayArtUri,
                            headers: SCRYFALL_IMAGE_HEADERS,
                            cache: 'force-cache'
                          }}
                          style={{
                            width: 154,
                            height: 215,
                            borderRadius: 8,
                            backgroundColor: 'transparent'
                          }}
                          resizeMode="contain"
                          onLoadStart={() => {
                            setImageDownloading(true);
                            setImageLoadError(false);
                          }}
                          onLoadEnd={() => {
                            setImageDownloading(false);
                          }}
                          onError={async () => {
                            // Si la carga nativa falló en móvil y no es ya un Data URI, reintentamos con fallback JS
                            if (Platform.OS !== 'web' && cardArtUrl && !displayArtUri.startsWith('data:')) {
                              try {
                                const dataUri = await loadCardImageAsDataUri(cardArtUrl);
                                setDisplayArtUri(dataUri);
                                return;
                              } catch { }
                            }
                            setImageDownloading(false);
                            setImageLoadError(true);
                          }}
                        />
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      <Badge label="Scryfall CDN" tone="accent" />
                      {editingCard?.lastPriceSyncDate ? (
                        <Badge label={`Cardmarket: ${editingCard.lastPriceSyncDate}`} tone="neutral" />
                      ) : null}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Recargar arte desde Scryfall"
                        onPress={() => {
                          setImageLoadError(false);
                          if (cardArtUrl) {
                            clearCardImageCache(cardArtUrl);
                          }
                          setImageRetryKey((k) => k + 1);
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
                        if (cardArtUrl) {
                          clearCardImageCache(cardArtUrl);
                        }
                        setImageRetryKey((k) => k + 1);
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

              {/* Atributos especiales de coleccionismo físico */}
              <View style={{ gap: 4, marginTop: 2 }}>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 11,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  Atributos de coleccionismo físico
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                  <ToggleChip
                    label="Foil ✨"
                    icon="auto-awesome"
                    selected={editIsFoil}
                    onPress={() => setEditIsFoil(!editIsFoil)}
                    accessibilityLabel="Marcar como versión Foil"
                  />
                  <ToggleChip
                    label="Alterada 🎨"
                    icon="palette"
                    selected={editIsAltered}
                    onPress={() => setEditIsAltered(!editIsAltered)}
                    accessibilityLabel="Marcar como carta Alterada"
                  />
                  <ToggleChip
                    label="Firmada ✍️"
                    icon="edit"
                    selected={editIsSigned}
                    onPress={() => setEditIsSigned(!editIsSigned)}
                    accessibilityLabel="Marcar como carta Firmada"
                  />
                </View>
              </View>

              {/* Asignación de Colección / Carpeta */}
              <View style={{ gap: 6, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 11,
                      ...textTypographyStyle(theme, 'medium')
                    }}
                  >
                    {t.collectionLabel} (puedes seleccionar varias)
                  </Text>
                  {!showInlineNewCollection ? (
                    <Pressable
                      hitSlop={6}
                      onPress={() => setShowInlineNewCollection(true)}
                    >
                      <Text
                        style={{
                          color: theme.colors.accent,
                          fontSize: 11,
                          ...textTypographyStyle(theme, 'semibold')
                        }}
                      >
                        + Nueva carpeta
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Creador en línea de nueva carpeta para evitar superposición de modales */}
                {showInlineNewCollection ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: theme.colors.surfaceMuted,
                      padding: 6,
                      borderRadius: theme.radius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.accent
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder={t.collectionNamePlaceholder}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={inlineCollectionName}
                        onChangeText={setInlineCollectionName}
                        onSubmitEditing={handleCreateInlineCollection}
                        returnKeyType="done"
                        autoFocus
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: 12,
                          paddingVertical: 4,
                          paddingHorizontal: 8
                        }}
                      />
                    </View>
                    <Button
                      size="sm"
                      variant="primary"
                      icon="check"
                      label="Añadir"
                      disabled={!inlineCollectionName.trim()}
                      onPress={handleCreateInlineCollection}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar"
                      onPress={() => {
                        setShowInlineNewCollection(false);
                        setInlineCollectionName('');
                      }}
                      style={{
                        padding: 6,
                        borderRadius: theme.radius.sm,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <GoogleIcon name="close" size={18} color={theme.colors.textSecondary} />
                    </Pressable>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {availableCollections.map((col) => {
                    const isSelected = editCollections.includes(col);
                    return (
                      <ToggleChip
                        key={col}
                        label={col}
                        selected={isSelected}
                        icon={isSelected ? 'check' : undefined}
                        tone="accent"
                        onPress={() => toggleEditCollection(col)}
                      />
                    );
                  })}
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

      {/* Pestaña Colecciones / Carpetas: Gestión y desglose por archivadores, mazos o inversión */}
      {activeTab === 'collections' ? (
        <View style={{ gap: theme.spacing.md }}>
          {/* 1. Tarjeta Resumen de Colecciones */}
          <Card
            title={t.collectionsCardTitle}
            subtitle={t.collectionsCardSubtitle}
            icon="folder"
            rightSlot={
              <Button
                size="sm"
                variant="primary"
                icon="add"
                label={t.newCollectionButton}
                onPress={() => setShowNewCollectionModal(true)}
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
                borderRadius: theme.radius.md,
                flexWrap: 'wrap',
                gap: theme.spacing.sm
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
                  Total Carpetas
                </Text>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.titleSize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  {collectionSummaries.length}
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  Valor Total
                </Text>
                <Text
                  style={{
                    color: theme.colors.accentText,
                    fontSize: theme.typography.titleSize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  {portfolioSummary.totalCurrent.toFixed(2)} €
                </Text>
              </View>

              <View>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  Total Cartas
                </Text>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.titleSize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  {portfolioSummary.totalQuantity}
                </Text>
              </View>
            </View>
          </Card>

          {/* 2. Listado de Carpetas / Colecciones */}
          <View style={{ gap: theme.spacing.md }}>
            {collectionSummaries.map((col) => {
              const isProfitPositive = col.netProfit > 0;
              const isProfitNegative = col.netProfit < 0;
              const trendTone = isProfitPositive ? 'success' : isProfitNegative ? 'danger' : 'neutral';
              const trendSign = isProfitPositive ? '+' : '';

              return (
                <Card
                  key={col.name}
                  title={col.name}
                  subtitle={`${col.uniqueCards} cartas únicas · ${col.totalUnits} copias`}
                  icon={col.name === 'Principal' ? 'home' : 'folder-special'}
                  rightSlot={
                    <Badge
                      label={`${trendSign}${col.roi}%`}
                      tone={trendTone}
                    />
                  }
                >
                  <View style={{ gap: theme.spacing.sm }}>
                    {/* Fila de Métricas Financieras de la Carpeta */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: theme.colors.surfaceMuted,
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.sm
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize - 1,
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          Valoración
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textPrimary,
                            fontSize: theme.typography.bodySize,
                            ...textTypographyStyle(theme, 'bold')
                          }}
                        >
                          {col.totalValue.toFixed(2)} €
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize - 1,
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          Inversión
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.bodySize,
                            ...textTypographyStyle(theme, 'medium')
                          }}
                        >
                          {col.totalInvested.toFixed(2)} €
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize - 1,
                            ...textTypographyStyle(theme, 'regular')
                          }}
                        >
                          Plusvalía
                        </Text>
                        <Text
                          style={{
                            color:
                              isProfitPositive
                                ? theme.colors.success
                                : isProfitNegative
                                  ? theme.colors.danger
                                  : theme.colors.textSecondary,
                            fontSize: theme.typography.bodySize,
                            ...textTypographyStyle(theme, 'bold')
                          }}
                        >
                          {trendSign}{col.netProfit.toFixed(2)} €
                        </Text>
                      </View>
                    </View>

                    {/* Muestrario de Miniaturas / Portadas más valiosas */}
                    {col.topCards.length > 0 ? (
                      <View style={{ gap: 4, marginTop: 2 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.colors.textSecondary,
                            ...textTypographyStyle(theme, 'medium')
                          }}
                        >
                          Cartas destacadas:
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          {col.topCards.map((topCard) => (
                            <View
                              key={topCard.id}
                              style={{
                                alignItems: 'center',
                                borderRadius: theme.radius.sm,
                                overflow: 'hidden'
                              }}
                            >
                              <CardThumbnail
                                imageUrl={topCard.imageUrl}
                                title={topCard.title}
                                width={54}
                                height={75}
                                borderRadius={4}
                              />
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.colors.textSecondary,
                          fontStyle: 'italic',
                          ...textTypographyStyle(theme, 'regular')
                        }}
                      >
                        {t.emptyCollectionNotice}
                      </Text>
                    )}

                    {/* Botón para explorar o filtrar las cartas de esta colección */}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                      <Button
                        size="sm"
                        variant="outline"
                        icon="arrow-forward"
                        label={t.exploreCollectionButton}
                        onPress={() => {
                          setSelectedCollectionFilter(col.name);
                          setActiveTab('main');
                        }}
                      />
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Modal para Crear Nueva Colección */}
      <ModalDialog
        visible={showNewCollectionModal}
        title={t.createCollectionTitle}
        description={t.createCollectionDesc}
        cancelLabel="Cancelar"
        onCancel={() => {
          setShowNewCollectionModal(false);
          setNewCollectionNameInput('');
        }}
        confirmLabel={t.createCollectionSubmit}
        onConfirm={() => {
          const clean = newCollectionNameInput.trim();
          if (!clean) return;
          if (!availableCollections.some((c) => c.toLowerCase() === clean.toLowerCase())) {
            setUserCustomCollections((prev) => [...prev, clean]);
          }
          if (editingCard) {
            setEditCollections((prev) => Array.from(new Set([...prev, clean])));
          } else {
            setNewCardCollections((prev) => Array.from(new Set([...prev, clean])));
          }
          setShowNewCollectionModal(false);
          setNewCollectionNameInput('');
          setToast(t.collectionCreatedToast(clean));
        }}
      >
        <View style={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}>
          <TextField
            label={t.collectionNameLabel}
            placeholder={t.collectionNamePlaceholder}
            value={newCollectionNameInput}
            onChangeText={setNewCollectionNameInput}
          />
        </View>
      </ModalDialog>

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
                    minHeight: 48,
                    paddingVertical: theme.spacing.xs + 2,
                    paddingHorizontal: 6,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      activeMetricChart === 'value' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      lineHeight: 16,
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
                    minHeight: 48,
                    paddingVertical: theme.spacing.xs + 2,
                    paddingHorizontal: 6,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      activeMetricChart === 'profit' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      lineHeight: 16,
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
                    minHeight: 48,
                    paddingVertical: theme.spacing.xs + 2,
                    paddingHorizontal: 6,
                    borderRadius: theme.radius.sm,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      activeMetricChart === 'roi' ? theme.colors.surface : 'transparent'
                  }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      lineHeight: 16,
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
          {/* Selector de Tema y Aspecto Visual */}
          <Card
            title={t.themeCardTitle}
            subtitle={t.themeCardSubtitle}
            icon="palette"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {t.themeDescription}
              </Text>

              {/* Opciones visuales interactivas con muestras de color */}
              <View style={{ gap: theme.spacing.xs }}>
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = activeThemePreference === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Cambiar al ${opt.label}`}
                      onPress={() => handleSelectTheme(opt.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surfaceMuted,
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? theme.colors.accent : theme.colors.border
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          flex: 1,
                          marginRight: theme.spacing.sm
                        }}
                      >
                        <GoogleIcon
                          name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                          size={20}
                          color={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text
                              style={{
                                color: isSelected ? theme.colors.accentText : theme.colors.textPrimary,
                                fontSize: theme.typography.bodySize,
                                ...textTypographyStyle(theme, isSelected ? 'bold' : 'medium')
                              }}
                            >
                              {opt.label}
                            </Text>
                            <Badge
                              label={opt.badge}
                              tone={isSelected ? 'accent' : 'neutral'}
                            />
                          </View>
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.captionSize,
                              marginTop: 2,
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {opt.description}
                          </Text>
                        </View>
                      </View>

                      {/* Muestra de color (paleta de 3 círculos) */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 4,
                          borderRadius: 20,
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1,
                          borderColor: theme.colors.border
                        }}
                      >
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: opt.previewColors.bg,
                            borderWidth: 1,
                            borderColor: '#D1D5DB'
                          }}
                        />
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: opt.previewColors.surface,
                            marginLeft: -3,
                            borderWidth: 1,
                            borderColor: '#9CA3AF'
                          }}
                        />
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: opt.previewColors.accent,
                            marginLeft: -3
                          }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Selector de Idioma */}
          <Card
            title={t.languageCardTitle}
            subtitle={t.languageCardSubtitle}
            icon="translate"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {t.languageDescription}
              </Text>

              {/* Opciones interactivas de Idioma */}
              <View style={{ gap: theme.spacing.xs }}>
                {APP_LANGUAGE_OPTIONS.map((opt) => {
                  const isSelected = activeLanguage === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Cambiar idioma a ${opt.label}`}
                      onPress={() => handleSelectLanguage(opt.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        backgroundColor: isSelected ? theme.colors.accentSoft : theme.colors.surfaceMuted,
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? theme.colors.accent : theme.colors.border
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
                          flex: 1
                        }}
                      >
                        <GoogleIcon
                          name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                          size={20}
                          color={isSelected ? theme.colors.accent : theme.colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={{
                                color: isSelected ? theme.colors.accentText : theme.colors.textPrimary,
                                fontSize: theme.typography.bodySize,
                                ...textTypographyStyle(theme, isSelected ? 'bold' : 'medium')
                              }}
                            >
                              {opt.label}
                            </Text>
                            <Badge
                              label={opt.badge}
                              tone={isSelected ? 'accent' : 'neutral'}
                            />
                          </View>
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.captionSize,
                              marginTop: 2,
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {opt.description}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          <Card
            title={t.cardmarketCardTitle}
            subtitle={
              state.lastPriceSyncDate
                ? t.lastSyncSubtitle(state.lastPriceSyncDate)
                : t.syncDailySubtitle
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
                {t.cardmarketDescription}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
                <Button
                  size="sm"
                  variant="primary"
                  icon="refresh"
                  label={state.isSyncingPrices ? t.syncingButton : t.syncButton}
                  disabled={state.isSyncingPrices}
                  onPress={async () => {
                    setToast(t.syncConsultingToast);
                    const res = await controller.syncCardmarketPrices({ force: true });
                    setToast(t.syncDoneToast(res.updatedCount));
                  }}
                />
              </View>
            </View>
          </Card>

          <Card
            title={t.inventoryCardTitle}
            subtitle={t.inventoryCardSubtitle}
            icon="inventory-2"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {t.inventoryDescription(state.items.length)}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                <Button
                  size="sm"
                  variant="outline"
                  icon="delete-sweep"
                  label={t.resetButton}
                  onPress={() => {
                    setResetMode('clear');
                    setShowResetConfirmModal(true);
                  }}
                />
              </View>
            </View>
          </Card>

          <Card
            title={t.importExportCardTitle}
            subtitle={t.importExportCardSubtitle}
            icon="import-export"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {t.importExportDescription}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                <Button
                  size="sm"
                  variant="primary"
                  icon="file-download"
                  label={t.importButton}
                  onPress={handleOpenImportModal}
                />
                <Button
                  size="sm"
                  variant="outline"
                  icon="code"
                  label={t.exportJsonButton}
                  onPress={handleExportJson}
                />
                <Button
                  size="sm"
                  variant="outline"
                  icon="table-chart"
                  label={t.exportCsvButton}
                  onPress={handleExportCsv}
                />
              </View>
            </View>
          </Card>

          <Card
            title={t.aboutCardTitle}
            subtitle={t.aboutCardSubtitle}
            icon="info"
          >
            <View style={{ gap: theme.spacing.md }}>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {t.aboutDescription}
              </Text>

              {/* Sección de Propiedad Intelectual y Política de Contenido de Fans de Wizards of the Coast */}
              <View
                style={{
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: theme.spacing.md,
                  gap: theme.spacing.xs
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <GoogleIcon name="gavel" size={16} color={theme.colors.textSecondary} />
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.captionSize,
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {t.legalDisclaimerTitle}
                  </Text>
                </View>

                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    lineHeight: 18,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  {t.wotcDisclaimer}
                </Text>

                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize - 1,
                    lineHeight: 16,
                    marginTop: 4,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  {t.thirdPartyDisclaimer}
                </Text>

                <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'flex-start' }}>
                  <Button
                    size="sm"
                    variant="outline"
                    icon="security"
                    label={t.privacyPolicyButton}
                    onPress={() => setShowPrivacyModal(true)}
                  />
                </View>
              </View>
            </View>
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

      {/* Modal para Visualizar y Compartir la Exportación (JSON / CSV) */}
      <ModalDialog
        visible={showExportModal}
        title={exportModalTitle}
        description={`Archivo: ${exportFileName} (${exportContent.length} caracteres)`}
        cancelLabel="Cerrar"
        onCancel={() => setShowExportModal(false)}
        contentMaxHeight={440}
      >
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: theme.spacing.xs
            }}
          >
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs, alignItems: 'center' }}>
              <Badge label={exportFormat.toUpperCase()} tone="accent" />
              <Badge label={`${state.items.length} cartas`} tone="neutral" />
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
              <Button
                size="sm"
                variant="outline"
                icon="content-copy"
                label="Copiar"
                onPress={handleCopyExportToClipboard}
              />
              <Button
                size="sm"
                variant="primary"
                icon="download"
                label="Descargar / Compartir"
                onPress={() => {
                  if (Platform.OS === 'web') {
                    triggerWebDownload(
                      exportContent,
                      exportFileName,
                      exportFormat === 'json' ? 'application/json' : 'text/csv'
                    );
                    setToast(`Descargando ${exportFileName}...`);
                  } else {
                    void Share.share({ title: exportFileName, message: exportContent });
                  }
                }}
              />
            </View>
          </View>

          <ScrollView
            horizontal={true}
            style={{
              maxHeight: 280,
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing.sm
            }}
          >
            <Text
              selectable={true}
              style={{
                color: theme.colors.textPrimary,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                fontSize: 11,
                lineHeight: 16
              }}
            >
              {exportContent}
            </Text>
          </ScrollView>
        </View>
      </ModalDialog>

      {/* Modal para Importar Cartas desde JSON o CSV */}
      <ModalDialog
        visible={showImportModal}
        title="Importar cartas a la cartera"
        description="Pega contenido en formato JSON o CSV, o selecciona un archivo desde tu dispositivo."
        confirmLabel={
          isImporting
            ? 'Importando...'
            : parsedImport.cards.length > 0
              ? `Continuar importación (${parsedImport.cards.length})`
              : 'Importar'
        }
        cancelLabel="Cancelar"
        onConfirm={
          parsedImport.cards.length > 0 && !isImporting
            ? () => setShowImportConfirmModal(true)
            : undefined
        }
        onCancel={() => {
          if (!isImporting) {
            setShowImportModal(false);
          }
        }}
        contentMaxHeight={480}
      >
        <View style={{ gap: theme.spacing.md }}>
          {/* Botón para seleccionar archivo en Web */}
          {Platform.OS === 'web' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm }}>
              <Button
                size="sm"
                variant="outline"
                icon="file-upload"
                label="Seleccionar archivo (.json, .csv)"
                onPress={handlePickFileForImport}
              />
              {importFileName ? (
                <Badge label={importFileName} tone="accent" />
              ) : null}
            </View>
          ) : null}

          {/* Área de texto para pegar el contenido */}
          <View style={{ gap: 4 }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'medium')
              }}
            >
              Contenido JSON o CSV:
            </Text>
            <TextInput
              multiline
              numberOfLines={6}
              value={importText}
              onChangeText={(txt) => {
                setImportText(txt);
                setImportFileName(null);
              }}
              placeholder={`Pega aquí el contenido JSON o CSV. Ejemplos:\nJSON: [{"title": "Black Lotus", "edition": "Alpha", "quantity": 1, "buyPrice": 5000}]\nCSV: title,edition,quantity,buyPrice,currentPrice,language,condition\nBlack Lotus,Alpha,1,5000,12000,EN,NM`}
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: parsedImport.error ? theme.colors.danger : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                color: theme.colors.textPrimary,
                fontSize: theme.typography.captionSize,
                fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                minHeight: 120,
                maxHeight: 180,
                textAlignVertical: 'top'
              }}
            />
          </View>

          {/* Indicador de validación y vista previa */}
          {parsedImport.format && parsedImport.cards.length > 0 ? (
            <View
              style={{
                backgroundColor: theme.colors.successSoft,
                borderColor: theme.colors.success,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                gap: 4
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <GoogleIcon name="check-circle" size={16} color={theme.colors.success} />
                <Text
                  style={{
                    color: theme.colors.success,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  Formato {parsedImport.format.toUpperCase()} válido · {parsedImport.cards.length} carta(s) detectada(s)
                </Text>
              </View>
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                Muestra: {parsedImport.cards.slice(0, 3).map((c) => `${c.title} (${c.edition || 'General'})`).join(', ')}
                {parsedImport.cards.length > 3 ? ` ...y ${parsedImport.cards.length - 3} más` : ''}
              </Text>
            </View>
          ) : parsedImport.error ? (
            <View
              style={{
                backgroundColor: theme.colors.dangerSoft,
                borderColor: theme.colors.danger,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6
              }}
            >
              <GoogleIcon name="error" size={16} color={theme.colors.danger} />
              <Text
                style={{
                  color: theme.colors.danger,
                  fontSize: theme.typography.captionSize,
                  flex: 1,
                  ...textTypographyStyle(theme, 'medium')
                }}
              >
                {parsedImport.error}
              </Text>
            </View>
          ) : null}

          {/* Opciones de importación: Añadir vs Reemplazar */}
          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'medium')
              }}
            >
              Modo de importación:
            </Text>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: !importReplace }}
              onPress={() => setImportReplace(false)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: !importReplace ? theme.colors.accentSoft : theme.colors.surfaceMuted,
                borderColor: !importReplace ? theme.colors.accent : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1
              })}
            >
              <GoogleIcon
                name={!importReplace ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={!importReplace ? theme.colors.accent : theme.colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, !importReplace ? 'bold' : 'regular')
                  }}
                >
                  Añadir a la cartera actual
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Conserva las {state.items.length} carta(s) existentes e incorpora las nuevas.
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: importReplace }}
              onPress={() => setImportReplace(true)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: importReplace ? theme.colors.dangerSoft : theme.colors.surfaceMuted,
                borderColor: importReplace ? theme.colors.danger : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1
              })}
            >
              <GoogleIcon
                name={importReplace ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={importReplace ? theme.colors.danger : theme.colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, importReplace ? 'bold' : 'regular')
                  }}
                >
                  Reemplazar cartera completa
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Borra las {state.items.length} carta(s) actuales y deja únicamente las importadas.
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ModalDialog>

      {/* Modal de doble check para confirmar la importación */}
      <ModalDialog
        visible={showImportConfirmModal}
        title={importReplace ? '¿Confirmar reemplazo completo?' : '¿Confirmar importación de cartas?'}
        description={
          importReplace
            ? 'Esta acción eliminará todas las cartas actuales antes de importar.'
            : 'Las cartas importadas se añadirán a tu colección existente.'
        }
        destructive={importReplace}
        cancelLabel="Volver"
        confirmLabel={
          isImporting
            ? 'Importando...'
            : importReplace
              ? 'Sí, reemplazar cartera'
              : 'Sí, importar cartas'
        }
        onCancel={() => {
          if (!isImporting) {
            setShowImportConfirmModal(false);
          }
        }}
        onConfirm={!isResetting && !isImporting ? handleExecuteImport : undefined}
        contentMaxHeight={420}
      >
        <View style={{ gap: theme.spacing.md }}>
          {importReplace ? (
            <View
              style={{
                backgroundColor: theme.colors.dangerSoft,
                borderColor: theme.colors.danger,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}
            >
              <GoogleIcon name="warning" size={22} color={theme.colors.danger} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.danger,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  ¡Atención: Borrado masivo!
                </Text>
                <Text
                  style={{
                    color: theme.colors.danger,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Se eliminarán permanentemente las {state.items.length} cartas guardadas actualmente en tu cartera y se sustituirán por las {parsedImport.cards.length} cartas importadas.
                </Text>
              </View>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.colors.accentSoft,
                borderColor: theme.colors.accent,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                padding: theme.spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}
            >
              <GoogleIcon name="add-circle" size={22} color={theme.colors.accent} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.accent,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  Añadir cartas a la colección
                </Text>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Se conservarán tus {state.items.length} cartas actuales y se sumarán las {parsedImport.cards.length} nuevas (total resultante: {state.items.length + parsedImport.cards.length} cartas).
                </Text>
              </View>
            </View>
          )}

          <View
            style={{
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing.sm,
              gap: 4
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'semibold')
                }}
              >
                Muestra de cartas a importar ({parsedImport.cards.length} en total):
              </Text>
              <Badge label={parsedImport.format?.toUpperCase() ?? 'ARCHIVO'} tone="neutral" />
            </View>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {parsedImport.cards.slice(0, 6).map((c) => `${c.title} (${c.edition || 'General'})`).join(', ')}
              {parsedImport.cards.length > 6 ? ` ...y ${parsedImport.cards.length - 6} más` : ''}
            </Text>
          </View>
        </View>
      </ModalDialog>

      {/* Modal de doble check para confirmar el borrado / reseteo de inventario */}
      <ModalDialog
        visible={showResetConfirmModal}
        title="¿Confirmar borrado de inventario?"
        description="Esta acción afectará a todas las cartas de tu cartera actual."
        destructive={true}
        cancelLabel="Cancelar"
        confirmLabel={
          isResetting
            ? 'Procesando...'
            : resetMode === 'clear'
              ? 'Sí, vaciar cartera'
              : 'Sí, restablecer cartas'
        }
        onCancel={() => {
          if (!isResetting) {
            setShowResetConfirmModal(false);
          }
        }}
        onConfirm={!isResetting ? handleExecuteReset : undefined}
        contentMaxHeight={440}
      >
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              backgroundColor: theme.colors.dangerSoft,
              borderColor: theme.colors.danger,
              borderWidth: 1,
              borderRadius: theme.radius.md,
              padding: theme.spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}
          >
            <GoogleIcon name="warning" size={22} color={theme.colors.danger} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.danger,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'bold')
                }}
              >
                ¡Atención: Acción destructiva!
              </Text>
              <Text
                style={{
                  color: theme.colors.danger,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {state.items.length > 0
                  ? `Vas a borrar de golpe las ${state.items.length} cartas que tienes guardadas actualmente.`
                  : 'Tu cartera actual está vacía.'}
              </Text>
            </View>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'medium')
              }}
            >
              Selecciona qué deseas hacer:
            </Text>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: resetMode === 'clear' }}
              onPress={() => setResetMode('clear')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: resetMode === 'clear' ? theme.colors.dangerSoft : theme.colors.surfaceMuted,
                borderColor: resetMode === 'clear' ? theme.colors.danger : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1
              })}
            >
              <GoogleIcon
                name={resetMode === 'clear' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={resetMode === 'clear' ? theme.colors.danger : theme.colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, resetMode === 'clear' ? 'bold' : 'regular')
                  }}
                >
                  Vaciar cartera (borrar todo, 0 cartas)
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Elimina todas las cartas de tu almacenamiento local para empezar una cartera limpia desde cero o importar tu colección desde JSON/CSV.
                </Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: resetMode === 'seed' }}
              onPress={() => setResetMode('seed')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: theme.spacing.sm,
                backgroundColor: resetMode === 'seed' ? theme.colors.accentSoft : theme.colors.surfaceMuted,
                borderColor: resetMode === 'seed' ? theme.colors.accent : theme.colors.border,
                borderWidth: 1,
                borderRadius: theme.radius.md,
                opacity: pressed ? 0.85 : 1
              })}
            >
              <GoogleIcon
                name={resetMode === 'seed' ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={resetMode === 'seed' ? theme.colors.accent : theme.colors.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize,
                    ...textTypographyStyle(theme, resetMode === 'seed' ? 'bold' : 'regular')
                  }}
                >
                  Restablecer cartas de prueba (57 cartas)
                </Text>
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  Sustituye la cartera actual por el lote predeterminado de 57 cartas de demostración.
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ModalDialog>

      {/* Modal de Política de Privacidad integrada en la app */}
      <ModalDialog
        visible={showPrivacyModal}
        title={t.privacyPolicyTitle}
        description={t.privacyPolicySubtitle}
        cancelLabel="Cerrar"
        onCancel={() => setShowPrivacyModal(false)}
        contentMaxHeight={520}
      >
        <View style={{ gap: theme.spacing.md }}>
          <View
            style={{
              backgroundColor: theme.colors.accentSoft,
              padding: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.accent
            }}
          >
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'medium')
              }}
            >
              MintMox es 100% gratuita, local y sin publicidad.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'bold')
              }}
            >
              1. {t.privacyP1Title}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                lineHeight: 18,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {t.privacyP1Desc}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'bold')
              }}
            >
              2. {t.privacyP2Title}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                lineHeight: 18,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {t.privacyP2Desc}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'bold')
              }}
            >
              3. {t.privacyP3Title}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                lineHeight: 18,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {t.privacyP3Desc}
            </Text>
          </View>

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'bold')
              }}
            >
              4. {t.privacyP4Title}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                lineHeight: 18,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {t.privacyP4Desc}
            </Text>
          </View>
        </View>
      </ModalDialog>
    </AppShell>
  );
}

export { MintMoxScreen as MTGInvestScreen };
