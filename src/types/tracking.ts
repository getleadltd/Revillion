export {};

declare global {
  interface MetaPixelFunction {
    (...args: unknown[]): void;
    callMethod?: (...args: unknown[]) => void;
    loaded: boolean;
    push: MetaPixelFunction;
    queue: unknown[][];
    version: string;
  }

  interface HotjarFunction {
    (...args: unknown[]): void;
    q: unknown[][];
  }

  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    hj?: HotjarFunction;
    _hjSettings?: { hjid: number; hjsv: number };
    __gaDebugInfo?: () => Record<string, unknown>;
  }
}
