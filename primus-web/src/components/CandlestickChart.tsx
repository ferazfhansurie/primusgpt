import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';

interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Zone {
  price_low: number;
  price_high: number;
}

interface CandlestickChartProps {
  data: OHLCVData[];
  zone?: Zone;
  stopLoss?: number;
  takeProfit1?: number;
  takeProfit2?: number;
  timeframe: string;
  pair: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  zone,
  stopLoss,
  takeProfit1,
  takeProfit2,
  timeframe,
  pair
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.06)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: Math.min(500, Math.max(350, window.innerWidth < 768 ? 300 : 450)),
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: 'rgba(255, 107, 53, 0.5)',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: 'rgba(255, 107, 53, 0.5)',
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Convert data to chart format
    const chartData = data.map(d => ({
      time: (new Date(d.time).getTime() / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(chartData);

    // Add zone as price lines
    if (zone) {
      candleSeries.createPriceLine({
        price: zone.price_high,
        color: '#8b5cf6',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Zone High',
      });

      candleSeries.createPriceLine({
        price: zone.price_low,
        color: '#8b5cf6',
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'Zone Low',
      });
    }

    // Add stop loss
    if (stopLoss) {
      candleSeries.createPriceLine({
        price: stopLoss,
        color: '#ef4444',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'Stop Loss',
      });
    }

    // Add take profit levels
    if (takeProfit1) {
      candleSeries.createPriceLine({
        price: takeProfit1,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'TP1',
      });
    }

    if (takeProfit2) {
      candleSeries.createPriceLine({
        price: takeProfit2,
        color: '#10b981',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'TP2',
      });
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, zone, stopLoss, takeProfit1, takeProfit2]);

  return (
    <div className="candlestick-chart-container">
      <div className="chart-header">
        <div className="chart-title">
          <div className="chart-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3V21H21"/><path d="M7 14L11 10L15 14L21 8"/>
            </svg>
          </div>
          <div>
            <h3>{pair}</h3>
            <span className="chart-timeframe">{timeframe}</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="chart" />
      <style>{`
        .candlestick-chart-container {
          background: rgba(26, 26, 46, 0.5);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.25rem;
          margin: 1.5rem 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .candlestick-chart-container:hover {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }
        .chart-header {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .chart-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .chart-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 107, 53, 0.1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 107, 53, 0.8);
        }
        .chart-icon svg {
          width: 20px;
          height: 20px;
        }
        .chart-header h3 {
          color: #fff;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
        }
        .chart-timeframe {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
          font-weight: 500;
        }
        .chart {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .candlestick-chart-container {
            padding: 1rem;
            border-radius: 12px;
          }
          .chart-header h3 {
            font-size: 1rem;
          }
          .chart-icon {
            width: 32px;
            height: 32px;
          }
          .chart-icon svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default CandlestickChart;
