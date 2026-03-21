import { useRef, useEffect } from 'react';
import type { BoxplotChartProps } from './types';

/**
 * React wrapper for D3.js Boxplot chart.
 * Uses useRef + useEffect pattern to integrate D3 with React.
 */
export function Boxplot({ data, width = 400, height = 300, className, xLabel, yLabel }: BoxplotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    // Clear previous render
    el.innerHTML = '';
    // D3 rendering will be integrated here
    // e.g. new atlascharts.boxplot().render(data, el, width, height, { xLabel, yLabel });
  }, [data, width, height, xLabel, yLabel]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-boxplot"
      role="img"
      aria-label="Boxplot chart"
    />
  );
}

export default Boxplot;
