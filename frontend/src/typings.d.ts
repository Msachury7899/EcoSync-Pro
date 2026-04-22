declare module 'apexcharts' {
  export default class ApexCharts {
    constructor(el: any, options: any);
    render(): Promise<void>;
    updateOptions(options: any): Promise<void>;
    updateSeries(newSeries: any[]): Promise<void>;
    destroy(): void;
  }
  export type ApexAnnotations = any;
  export type ApexAxisChartSeries = any;
  export type ApexChart = any;
  export type ApexDataLabels = any;
  export type ApexFill = any;
  export type ApexGrid = any;
  export type ApexLegend = any;
  export type ApexMarkers = any;
  export type ApexNonAxisChartSeries = any;
  export type ApexPlotOptions = any;
  export type ApexResponsive = any;
  export type ApexStroke = any;
  export type ApexTheme = any;
  export type ApexTitleSubtitle = any;
  export type ApexTooltip = any;
  export type ApexXAxis = any;
  export type ApexYAxis = any;
}
