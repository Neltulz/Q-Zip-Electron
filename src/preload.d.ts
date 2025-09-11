export { };

declare global {
  interface Window {
    api: {
      compress: (job: {
        inputs: string[];
        out: string;
        level?: number;
      }) => Promise<{ ok: boolean; error?: string }>;
      onProgress: (callback: (data: { percent: number; message: string }) => void) => () => void;
      selectOutputPath: () => Promise<string | null>;
      selectFiles: () => Promise<string[]>;
    };
  }
}
