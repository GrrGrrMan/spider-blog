type TeardownFn = () => void;

class ClientLifecycleRegistry {
  private cleanups: Set<TeardownFn> = new Set();
  private initialized = false;

  public register(cleanup: TeardownFn): void {
    this.cleanups.add(cleanup);
  }

  public init(callback: () => void): void {
    if (!this.initialized) {
      document.addEventListener('astro:before-swap', () => this.teardown());
      this.initialized = true;
    }
    document.addEventListener('astro:page-load', callback);
  }

  public teardown(): void {
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch (err) {
        console.error('[Lifecycle] Cleanup error:', err);
      }
    }
    this.cleanups.clear();
  }
}

export const lifecycle = new ClientLifecycleRegistry();