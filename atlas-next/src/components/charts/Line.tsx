import { useRef, useEffect } from 'react';
import type { LineChartProps } from './types';

/**
 * React wrapper for D3.js Line chart.
 */
export function Line({ data, width = 400, height = 300, className, xLabel, yLabel }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.line().render(data, el, width, height, { xLabel, yLabel });
  }, [data, width, height, xLabel, yLabel]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-line"
      role="img"
      aria-label="Line chart"
    />
  );
}

export default Line;
