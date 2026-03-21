import { useRef, useEffect } from 'react';
import type { DonutChartProps } from './types';

/**
 * React wrapper for D3.js Donut chart.
 */
export function Donut({ data, width = 300, height = 300, className, showLabels }: DonutChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.donut().render(data, el, width, height, { showLabels });
  }, [data, width, height, showLabels]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-donut"
      role="img"
      aria-label="Donut chart"
    />
  );
}

export default Donut;
