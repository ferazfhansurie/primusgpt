import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';

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
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Convert data to chart format
    const chartData = data.map(d => ({
      time: new Date(d.time).getTime() / 1000,
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
        <h3>{pair} - {timeframe}</h3>
      </div>
      <div ref={chartContainerRef} className="chart" />
      <style>{`
        .candlestick-chart-container {
          background: #1a1a2e;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
        }
        .chart-header {
          margin-bottom: 12px;
        }
        .chart-header h3 {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        .chart {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default CandlestickChart;
