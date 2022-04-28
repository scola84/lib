import type { ScolaElement, ScolaTableElement } from '../elements'
import type { Struct } from '../../common'

export class Dropper {
  public copy: boolean

  public element: ScolaElement

  public type: string[]

  protected handleDragenterBound = this.handleDragenter.bind(this)

  protected handleDragleaveBound = this.handleDragleave.bind(this)

  protected handleDragoverBound = this.handleDragover.bind(this)

  protected handleDropBound = this.handleDrop.bind(this)

  public constructor (element: ScolaElement) {
    this.element = element
    this.reset()
  }

  public connect (): void {
    this.addEventListeners()
  }

  public disconnect (): void {
    this.removeEventListeners()
  }

  public dropFiles (fileList: FileList, event?: Event): void {
    const files = Array.from(fileList)

    this.element.propagator.dispatchEvents<File>('dropfile', files, event)
    this.element.propagator.dispatchEvents<Struct<File[]>>('dropfiles', [{ files }], event)
  }

  public dropItems (items: unknown[], on = 'drop', event?: Event): void {
    this.element.propagator.dispatchEvents(`${on}item`, items, event)

    this.element.propagator.dispatchEvents(`${on}items`, [{
      items
    }], event)
  }

  public dropKeys (keys: unknown[], on = 'drop', event?: Event): void {
    this.element.propagator.dispatchEvents(`${on}key`, keys, event)

    this.element.propagator.dispatchEvents(`${on}keys`, [{
      keys
    }], event)
  }

  public reset (): void {
    this.copy = this.element.hasAttribute('sc-drop-copy')

    this.type = this.element.getAttribute('sc-drop-type')
      ?.trim()
      .split(/\s+/u) ?? []
  }

  protected addEventListeners (): void {
    this.element.addEventListener('dragenter', this.handleDragenterBound)
    this.element.addEventListener('dragleave', this.handleDragleaveBound)
    this.element.addEventListener('dragover', this.handleDragoverBound)
    this.element.addEventListener('drop', this.handleDropBound)
  }

  protected getDrag (): Struct {
    return JSON.parse(window.sessionStorage.getItem('sc-drag') ?? '{}') as Struct
  }

  protected handleDragenter (event: DragEvent): void {
    event.preventDefault()

    if (this.isDroppable(event)) {
      this.element.toggleAttribute('sc-drop-over', true)
    }
  }

  protected handleDragleave (event: DragEvent): void {
    event.preventDefault()

    if (this.isDroppable(event)) {
      this.element.toggleAttribute('sc-drop-over', false)
    }
  }

  protected handleDragover (event: DragEvent): void {
    event.preventDefault()

    if (this.isDroppable(event)) {
      this.element.toggleAttribute('sc-drop-over', true)
    }

    if (event.dataTransfer !== null) {
      if (
        this.copy ||
        event.ctrlKey
      ) {
        event.dataTransfer.dropEffect = 'copy'
      } else {
        event.dataTransfer.dropEffect = 'move'
      }
    }
  }

  protected handleDrop (event: DragEvent): void {
    event.preventDefault()
    this.element.toggleAttribute('sc-drop-over', false)

    const drag = this.getDrag()

    if (
      this.isDroppable(event, drag) &&
      event.dataTransfer !== null
    ) {
      if (event.dataTransfer.files.length > 0) {
        this.dropFiles(event.dataTransfer.files, event)
      } else {
        let on = 'drop'

        if (
          this.copy ||
          event.ctrlKey
        ) {
          on += 'copy'
        }

        document
          .querySelectorAll<ScolaTableElement>(`#${String(drag.origin)}[is="sc-table"]`)
          .forEach((element) => {
            this.dropKeys(element.selector?.getKeysByRow() ?? [], on, event)
            this.dropItems(element.selector?.getItemsByRow() ?? [], on, event)
          })

        document
          .querySelectorAll<ScolaTableElement>(`#${String(drag.origin)}:not([is="sc-table"])`)
          .forEach((element) => {
            this.dropItems([element.data], on, event)
          })
      }
    }
  }

  protected isDroppable (event: DragEvent, drag: Struct = this.getDrag()): boolean {
    if (drag.origin === this.element.id) {
      return false
    }

    const types = []

    if (event.dataTransfer !== null) {
      if (event.dataTransfer.types.includes('Files')) {
        if (
          event.dataTransfer.files.length === 0 ||
          this.type.includes('files')
        ) {
          return true
        }

        types.push(...Array
          .from(event.dataTransfer.files)
          .map((file) => {
            return file.type
          }))
      }

      if (typeof drag.type === 'string') {
        types.push(drag.type)
      }
    }

    if (types.length === 0) {
      return false
    }

    return types.every((type) => {
      return this.type.includes(type)
    })
  }

  protected removeEventListeners (): void {
    this.element.removeEventListener('dragenter', this.handleDragenterBound)
    this.element.removeEventListener('dragleave', this.handleDragleaveBound)
    this.element.removeEventListener('dragover', this.handleDragoverBound)
    this.element.removeEventListener('drop', this.handleDropBound)
  }
}
