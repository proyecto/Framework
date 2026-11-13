import { useMemo, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { Button } from './Button.js';
import { GoogleIcon } from './Icon.js';

export interface MarkedDateConfig {
  marked?: boolean;
  dotColor?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CalendarProps {
  selectedDate?: string | null; // Formato 'YYYY-MM-DD'
  onSelectDate?: (dateString: string) => void;
  minDate?: string; // Formato 'YYYY-MM-DD'
  maxDate?: string; // Formato 'YYYY-MM-DD'
  markedDates?: Record<string, MarkedDateConfig>;
  initialYear?: number;
  initialMonth?: number; // 1 - 12
  firstDayOfWeek?: 0 | 1; // 1 = Lunes (por defecto), 0 = Domingo
  showTodayButton?: boolean;
  style?: ViewStyle;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const WEEKDAY_NAMES_MON = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAY_NAMES_SUN = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function formatDateIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDateIso(iso: string): { year: number; month: number; day: number } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1]!, 10),
    month: parseInt(match[2]!, 10),
    day: parseInt(match[3]!, 10)
  };
}

interface CalendarGridCell {
  dateString: string;
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  markedConfig?: MarkedDateConfig;
}

/**
 * Componente canónico de calendario del framework (`<Calendar />`).
 *
 * Características:
 * - Construido exclusivamente con primitivas estándar de React Native (`View`, `Text`, `Pressable`).
 * - Navegación entre meses con botones accesibles y botón de retorno rápido a "Hoy".
 * - Selección de fecha individual (`YYYY-MM-DD`) con soporte de límites `minDate` y `maxDate`.
 * - Marcadores visuales de eventos (`markedDates`) con puntos de color o badges configurables.
 * - Soporte de semana europea (Lunes a Domingo por defecto) o americana (Domingo a Sábado).
 * - Totalmente adaptado a temas claro y oscuro (`useFrameworkTheme()`).
 */
export function Calendar({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  markedDates = {},
  initialYear,
  initialMonth,
  firstDayOfWeek = 1,
  showTodayButton = true,
  style
}: CalendarProps) {
  const theme = useFrameworkTheme();
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(
    () => formatDateIso(today.getFullYear(), today.getMonth() + 1, today.getDate()),
    [today]
  );

  const parsedInitial = selectedDate ? parseDateIso(selectedDate) : null;
  const [currentYear, setCurrentYear] = useState(
    initialYear ?? parsedInitial?.year ?? today.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    initialMonth ?? parsedInitial?.month ?? today.getMonth() + 1
  );

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    setCurrentYear(y);
    setCurrentMonth(m);
    onSelectDate?.(todayIso);
  };

  const cells = useMemo(() => {
    const grid: CalendarGridCell[] = [];
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Día de la semana del 1 del mes actual: 0=Domingo, 1=Lunes, ...
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    // Ajuste para semana con inicio en Lunes (1) o Domingo (0)
    const offset = firstDayOfWeek === 1 ? (firstDayIndex === 0 ? 6 : firstDayIndex - 1) : firstDayIndex;

    // 1. Días del mes anterior para rellenar la primera semana
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth, 0).getDate();

    for (let i = offset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const dateString = formatDateIso(prevMonthYear, prevMonth, day);
      const isToday = dateString === todayIso;
      const isSelected = dateString === selectedDate;
      const markedConfig = markedDates[dateString];
      const isDisabled =
        Boolean(markedConfig?.disabled) ||
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      grid.push({
        dateString,
        year: prevMonthYear,
        month: prevMonth,
        day,
        isCurrentMonth: false,
        isToday,
        isSelected,
        isDisabled,
        markedConfig
      });
    }

    // 2. Días del mes actual
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateString = formatDateIso(currentYear, currentMonth, day);
      const isToday = dateString === todayIso;
      const isSelected = dateString === selectedDate;
      const markedConfig = markedDates[dateString];
      const isDisabled =
        Boolean(markedConfig?.disabled) ||
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      grid.push({
        dateString,
        year: currentYear,
        month: currentMonth,
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isDisabled,
        markedConfig
      });
    }

    // 3. Días del mes siguiente para completar la cuadrícula (múltiplo de 7 días, máx. 42 celdas)
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const remaining = (7 - (grid.length % 7)) % 7;
    const totalTarget = grid.length + remaining < 35 ? 35 : grid.length + remaining;
    const fillNextCount = totalTarget - grid.length;

    for (let day = 1; day <= fillNextCount; day++) {
      const dateString = formatDateIso(nextMonthYear, nextMonth, day);
      const isToday = dateString === todayIso;
      const isSelected = dateString === selectedDate;
      const markedConfig = markedDates[dateString];
      const isDisabled =
        Boolean(markedConfig?.disabled) ||
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      grid.push({
        dateString,
        year: nextMonthYear,
        month: nextMonth,
        day,
        isCurrentMonth: false,
        isToday,
        isSelected,
        isDisabled,
        markedConfig
      });
    }

    return grid;
  }, [
    currentYear,
    currentMonth,
    firstDayOfWeek,
    todayIso,
    selectedDate,
    markedDates,
    minDate,
    maxDate
  ]);

  const weekdayLabels = firstDayOfWeek === 1 ? WEEKDAY_NAMES_MON : WEEKDAY_NAMES_SUN;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.md,
          gap: theme.spacing.sm
        },
        style
      ]}
    >
      {/* 1. Barra de Navegación de Mes y Año */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: theme.spacing.xs
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.headingSize - 1,
              ...textTypographyStyle(theme, 'bold')
            }}
          >
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {showTodayButton ? (
            <Button
              size="sm"
              variant="outline"
              label="Hoy"
              onPress={handleGoToToday}
              style={{ paddingHorizontal: 10, paddingVertical: 4, height: 32 }}
            />
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
            onPress={handlePrevMonth}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent'
            })}
          >
            <GoogleIcon name="chevron-left" size={20} tone="secondary" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
            onPress={handleNextMonth}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent'
            })}
          >
            <GoogleIcon name="chevron-right" size={20} tone="secondary" />
          </Pressable>
        </View>
      </View>

      {/* 2. Cabecera de Días de la Semana */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: theme.colors.border, paddingBottom: 6 }}>
        {weekdayLabels.map((name, idx) => (
          <View key={idx} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'semibold')
              }}
            >
              {name}
            </Text>
          </View>
        ))}
      </View>

      {/* 3. Cuadrícula de Días */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell) => {
          const isSelected = cell.isSelected;
          const isToday = cell.isToday;
          const isCurrentMonth = cell.isCurrentMonth;
          const isDisabled = cell.isDisabled;
          const hasDot = Boolean(cell.markedConfig?.marked);
          const dotColor = cell.markedConfig?.dotColor ?? theme.colors.accent;

          let textColor = theme.colors.textPrimary;
          if (isSelected) {
            textColor = theme.colors.textInverse;
          } else if (!isCurrentMonth) {
            textColor = theme.colors.textSecondary;
          } else if (isDisabled) {
            textColor = theme.colors.textSecondary;
          }

          return (
            <View
              key={cell.dateString}
              style={{
                width: '14.285%',
                height: 42,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !isCurrentMonth ? 0.35 : isDisabled ? 0.4 : 1
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${cell.day} de ${MONTH_NAMES[cell.month - 1]} de ${cell.year}`}
                accessibilityState={{ selected: isSelected, disabled: isDisabled }}
                disabled={isDisabled}
                onPress={() => {
                  if (!isCurrentMonth) {
                    setCurrentYear(cell.year);
                    setCurrentMonth(cell.month);
                  }
                  onSelectDate?.(cell.dateString);
                }}
                style={({ pressed }) => ({
                  width: 32,
                  height: 32,
                  borderRadius: theme.radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? theme.colors.accent
                    : pressed
                    ? theme.colors.surfaceMuted
                    : 'transparent',
                  borderWidth: isToday && !isSelected ? 1.5 : 0,
                  borderColor: isToday && !isSelected ? theme.colors.accent : 'transparent'
                })}
              >
                <Text
                  style={{
                    color: textColor,
                    fontSize: theme.typography.bodySize - 1,
                    fontVariant: ['tabular-nums'],
                    ...textTypographyStyle(theme, isSelected || isToday ? 'bold' : 'medium')
                  }}
                >
                  {cell.day}
                </Text>
              </Pressable>

              {/* Punto indicador de evento o marca */}
              {hasDot ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    width: 4,
                    height: 4,
                    borderRadius: theme.radius.full,
                    backgroundColor: isSelected ? theme.colors.textInverse : dotColor
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

