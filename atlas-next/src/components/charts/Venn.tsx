import { useRef, useEffect } from 'react';
import type { VennChartProps } from './types';

/**
 * React wrapper for D3.js Venn diagram.
 */
export function Venn({ data, width = 400, height = 300, className, showOverlap }: VennChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const el = containerRef.current;
    el.innerHTML = '';
    // D3 rendering: new atlascharts.venn().render(data, el, width, height, { showOverlap });
  }, [data, width, height, showOverlap]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height }}
      data-testid="chart-venn"
      role="img"
      aria-label="Venn diagram"
    />
  );
}

export default Venn;
