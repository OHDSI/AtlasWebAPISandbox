import { useRef, useEffect } from 'react';
import type { ScatterplotChartProps } from './types';

/**
 * React wrapper for D3.js Scatterplot chart.
 */
export function Scatterplot({ data, width = 400, height = 300, className, xLabel, yLabel }: ScatterplotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.scatterplot().render(data, el, width, height, { xLabel, yLabel });
  }, [data, width, height, xLabel, yLabel]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-scatterplot"
      role="img"
      aria-label="Scatterplot chart"
    />
  );
}

export default Scatterplot;
