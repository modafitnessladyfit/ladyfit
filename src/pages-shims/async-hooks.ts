// Shim usado APENAS pelo build isolado do GitHub Pages
// (ver vite.pages.config.ts, alias de "node:async_hooks").
//
// @tanstack/start-storage-context importa `AsyncLocalStorage` de
// "node:async_hooks" para propagar o contexto de pedido no servidor. Esse
// módulo é atravessado mesmo no bundle do cliente porque `checkout-server.ts`
// (createServerFn) é importado pela árvore de componentes — mas o código que
// efetivamente USA esse contexto só corre no `.handler()` do servidor, que
// nunca executa no GitHub Pages (não há servidor). Este shim replica apenas
// a API mínima (`run`/`getStore`) para o módulo carregar sem erro no browser.
export class AsyncLocalStorage<T> {
  private store: T | undefined;

  run<R>(store: T, fn: () => R): R {
    const previous = this.store;
    this.store = store;
    try {
      return fn();
    } finally {
      this.store = previous;
    }
  }

  getStore(): T | undefined {
    return this.store;
  }
}
