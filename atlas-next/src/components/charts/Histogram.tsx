import { useRef, useEffect } from 'react';
import type { HistogramChartProps } from './types';

/**
 * React wrapper for D3.js Histogram chart.
 */
export function Histogram({ data, width = 400, height = 300, className, bins, xLabel, yLabel }: HistogramChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.histogram().render(data, el, width, height, { bins, xLabel, yLabel });
  }, [data, width, height, bins, xLabel, yLabel]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-histogram"
      role="img"
      aria-label="Histogram chart"
    />
  );
}

export default Histogram;
