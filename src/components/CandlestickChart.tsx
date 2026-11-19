import React, { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, type UTCTimestamp } from 'lightweight-charts';
import type { MarketCandle } from '../types';

interface Props {
  candles: MarketCandle[];
  theme: 'dark' | 'light';
  decimals?: number;
  height?: number;
}

export const CandlestickChart: React.FC<Props> = ({
  candles,
  theme,
  decimals = 4,
  height = 380,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || candles.length === 0) return;

    const isDark = theme === 'dark';
    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#0D1321' : '#FFFFFF' },
        textColor: isDark ? '#94A3B8' : '#334155',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.05)' },
        horzLines: { color: isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(15, 23, 42, 0.05)' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E293B' : '#E2E8F0',
      },
      timeScale: {
        borderColor: isDark ? '#1E293B' : '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: isDark ? 'rgba(244, 63, 94, 0.45)' : 'rgba(136, 19, 55, 0.35)' },
        horzLine: { color: isDark ? 'rgba(244, 63, 94, 0.45)' : 'rgba(136, 19, 55, 0.35)' },
      },
      handleScale: {
        mouseWheel: true,
        pinch: false,
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#15803D',
      downColor: '#9F1239',
      borderVisible: false,
      wickUpColor: '#15803D',
      wickDownColor: '#9F1239',
      priceFormat: {
        type: 'price',
        precision: decimals,
        minMove: Number((1 / Math.pow(10, decimals)).toFixed(decimals)),
      },
    });

    const seen = new Set<number>();
    const formatted = candles
      .slice()
      .sort((a, b) => a.time - b.time)
      .filter((c) => {
        if (seen.has(c.time)) return false;
        seen.add(c.time);
        return true;
      })
      .map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    series.setData(formatted);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          chart.applyOptions({ width: entry.contentRect.width });
        }
      }
    });
    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, theme, decimals, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
};
