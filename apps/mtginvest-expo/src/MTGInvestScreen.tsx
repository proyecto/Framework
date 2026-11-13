import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  GoogleIcon,
  ModalDialog,
  TextField,
  textTypographyStyle,
  useFrameworkTheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import { calculateCardReturn, type CardEntity, type IMtginvestController } from './mvc';
import { APP_VERSION } from './version';

export type MTGTab = 'main' | 'settings';

export interface MTGInvestScreenProps {
  controller: IMtginvestController;
}

/**
 * Pantalla principal de MTGInvest (@framework/mtginvest-expo).
 *
 * Muestra la cartera de inversión en MTG con listado de cartas,
 * cotización actual, valor anterior e indicador bursátil de tendencia (subiendo/bajando).
 */
export function MTGInvestScreen({ controller }: MTGInvestScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<MTGTab>('main');
  const [toast, setToast] = useState<string | null>(null);

  // Estado del formulario modal para añadir una nueva carta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newEdition, setNewEdition] = useState('');
  const [newBuyPrice, setNewBuyPrice] = useState('');
  const [newCurrentPrice, setNewCurrentPrice] = useState('');

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

  // Cálculos globales de la cartera de inversión
  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;

    for (const card of state.items) {
      totalInvested += card.previousPrice;
      totalCurrent += card.currentPrice;
    }

    const totalDiff = totalCurrent - totalInvested;
    const totalPercent = totalInvested > 0 ? (totalDiff / totalInvested) * 100 : 0;
    const trend = totalDiff > 0.01 ? 'up' : totalDiff < -0.01 ? 'down' : 'flat';

    return {
      totalInvested: Number(totalInvested.toFixed(2)),
      totalCurrent: Number(totalCurrent.toFixed(2)),
      totalDiff: Number(totalDiff.toFixed(2)),
      totalPercent: Number(totalPercent.toFixed(1)),
      trend
    };
  }, [state.items]);

  const handleAddCard = async () => {
    if (!newTitle.trim()) {
      setToast('Indica al menos el nombre de la carta.');
      return;
    }
    const current = parseFloat(newCurrentPrice.replace(',', '.')) || 0;
    const previous = parseFloat(newBuyPrice.replace(',', '.')) || current;

    await controller.createItem({
      title: newTitle.trim(),
      nameEn: newNameEn.trim() || undefined,
      edition: newEdition.trim() || 'General',
      currentPrice: current,
      previousPrice: previous
    });

    setNewTitle('');
    setNewNameEn('');
    setNewEdition('');
    setNewBuyPrice('');
    setNewCurrentPrice('');
    setShowAddModal(false);
    setToast('Carta añadida a la cartera.');
  };

  return (
    <AppShell<MTGTab>
      appName="MTGInvest"
      subtitle={`Gestor de Inversiones MTG · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'main', label: 'Principal', icon: 'home' },
        {
          id: APP_LAYOUT_BOUNDS.settingsTab.id,
          label: APP_LAYOUT_BOUNDS.settingsTab.label,
          icon: APP_LAYOUT_BOUNDS.settingsTab.icon
        }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerRight={
        <Badge
          label={`v${APP_VERSION}`}
          tone="accent"
        />
      }
    >
      {activeTab === 'main' ? (
        <>
          {/* 1. Tarjeta Resumen: Cartera de Inversión */}
          <Card
            title="Cartera de inversión"
            subtitle={`${state.items.length} carta(s) en cartera`}
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
                  VALOR DE MERCADO
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
                  Coste compra:{' '}
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

          {/* 2. Listado de Cartas con cotización estilo bolsa */}
          <View style={{ gap: theme.spacing.sm }}>
            {state.items.map((card: CardEntity) => {
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
                <View
                  key={card.id}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.md,
                    gap: theme.spacing.xs
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    {/* Datos de la carta: Nombre y Edición */}
                    <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
                      <Text
                        style={{
                          color: theme.colors.textPrimary,
                          fontSize: theme.typography.bodySize + 1,
                          ...textTypographyStyle(theme, 'bold')
                        }}
                      >
                        {card.title}
                      </Text>

                      {card.nameEn && card.nameEn !== card.title ? (
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize,
                            fontStyle: 'italic',
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
                          marginTop: 4
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.textSecondary,
                            fontSize: theme.typography.captionSize,
                            ...textTypographyStyle(theme, 'medium')
                          }}
                        >
                          {card.edition}
                        </Text>
                        {card.condition ? (
                          <Badge label={card.condition} tone="neutral" />
                        ) : null}
                      </View>
                    </View>

                    {/* Precios y Ticker Bursátil */}
                    <View style={{ alignItems: 'flex-end', minWidth: 110 }}>
                      {/* Valor Actual */}
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

                      {/* Valor Anterior */}
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
                </View>
              );
            })}
          </View>

          {/* Modal para añadir carta */}
          <ModalDialog
            visible={showAddModal}
            title="Añadir Carta a la Cartera"
            description="Registra una nueva carta indicando su nombre, edición y cotización."
            confirmLabel="Guardar"
            cancelLabel="Cancelar"
            onCancel={() => setShowAddModal(false)}
            onConfirm={() => void handleAddCard()}
          >
            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
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
              <TextField
                label="Edición"
                placeholder="Ej. Unlimited Edition (2ed)"
                value={newEdition}
                onChangeText={setNewEdition}
              />
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Precio compra (€)"
                    placeholder="Ej. 45.00"
                    value={newBuyPrice}
                    onChangeText={setNewBuyPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField
                    label="Valor actual (€)"
                    placeholder="Ej. 75.00"
                    value={newCurrentPrice}
                    onChangeText={setNewCurrentPrice}
                  />
                </View>
              </View>
            </View>
          </ModalDialog>
        </>
      ) : null}

      {activeTab === 'settings' ? (
        <Card
          title="Ajustes"
          subtitle="Configuración general de MTGInvest"
          icon="settings"
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.bodySize,
              ...textTypographyStyle(theme, 'regular')
            }}
          >
            Sin ajustes configurados por el momento.
          </Text>
        </Card>
      ) : null}
    </AppShell>
  );
}
