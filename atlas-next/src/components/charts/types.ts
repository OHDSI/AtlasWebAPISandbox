/**
 * Shared chart props for all D3.js chart wrappers.
 */
export interface ChartProps {
  data: unknown[];
  width?: number;
  height?: number;
  className?: string;
}

export interface BoxplotChartProps extends ChartProps {
  /** Label for the x-axis */
  xLabel?: string;
  /** Label for the y-axis */
  yLabel?: string;
}

export interface DonutChartProps extends ChartProps {
  /** Whether to show labels on slices */
  showLabels?: boolean;
}

export interface HistogramChartProps extends ChartProps {
  /** Number of bins */
  bins?: number;
  xLabel?: string;
  yLabel?: string;
}

export interface LineChartProps extends ChartProps {
  xLabel?: string;
  yLabel?: string;
}

export interface ScatterplotChartProps extends ChartProps {
  xLabel?: string;
  yLabel?: string;
}

export interface TreemapChartProps extends ChartProps {
  /** Value accessor key */
  valueKey?: string;
}

export interface TrellislineChartProps extends ChartProps {
  xLabel?: string;
  yLabel?: string;
}

export interface VennChartProps extends ChartProps {
  /** Whether to show overlap labels */
  showOverlap?: boolean;
}
