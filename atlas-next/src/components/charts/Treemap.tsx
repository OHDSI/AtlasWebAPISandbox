import { useRef, useEffect } from 'react';
import type { TreemapChartProps } from './types';

/**
 * React wrapper for D3.js Treemap chart.
 */
export function Treemap({ data, width = 400, height = 300, className, valueKey }: TreemapChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.treemap().render(data, el, width, height, { valueKey });
  }, [data, width, height, valueKey]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-treemap"
      role="img"
      aria-label="Treemap chart"
    />
  );
}

export default Treemap;
