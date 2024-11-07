type EmittedEvents = Record<string | symbol, (...args: any[]) => any>

export class AsyncEventEmitter<Events extends EmittedEvents> {
  private events: Partial<Record<keyof Events, ((...args: any[]) => any)[]>> =
    {}

  on<E extends keyof Events>(event: E, listener: Events[E]): () => void {
    if (!this.events[event]) this.events[event] = []
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.events[event]!.push(listener)
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.events[event] = this.events[event]!.filter((i) => i !== listener)
    }
  }

  emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): Promise<any> {
    return Promise.all((this.events[event] || []).map((i) => i(...args)))
  }
}
