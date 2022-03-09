export class Indexer {
  public static indexes: number[] = [0]

  public index: string | null = null

  public get (): number {
    const index = Math.max(...Indexer.indexes) + 1

    Indexer.indexes.push(index)
    return index
  }

  public remove (element: HTMLElement, backdrop?: HTMLElement | null): void {
    if (this.index === null) {
      const elementIndex = element.style.getPropertyValue('z-index')
      const backdropIndex = backdrop?.style.getPropertyValue('z-index')

      Indexer.indexes = Indexer.indexes.filter((index) => {
        return (
          index.toString() !== elementIndex &&
          index.toString() !== backdropIndex
        )
      })
    }

    element.style.removeProperty('z-index')
    backdrop?.style.removeProperty('z-index')
  }

  public set (element: HTMLElement, backdrop?: HTMLElement | null): void {
    if (this.index === null) {
      backdrop?.style.setProperty('z-index', this.get().toString())
      element.style.setProperty('z-index', this.get().toString())
    } else {
      backdrop?.style.setProperty('z-index', this.index)
      element.style.setProperty('z-index', this.index)
    }
  }
}
