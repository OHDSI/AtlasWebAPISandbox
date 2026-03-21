import { useRef, useEffect } from 'react';
import type { TrellislineChartProps } from './types';

/**
 * React wrapper for D3.js Trellisline chart.
 */
export function Trellisline({ data, width = 400, height = 300, className, xLabel, yLabel }: TrellislineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.trellisline().render(data, el, width, height, { xLabel, yLabel });
  }, [data, width, height, xLabel, yLabel]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-trellisline"
      role="img"
      aria-label="Trellis line chart"
    />
  );
}

export default Trellisline;
