import type { ScolaElement } from '../elements/element'
import { isArray } from '../../common'

export class ScolaDrop {
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

    this.element.propagator.dispatch('dropfile', files.map((file) => {
      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type
      }
    }), event)

    this.element.propagator.dispatch('dropfiles', [{
      files
    }], event)
  }

  public dropItems (keys: unknown[], on = 'drop', event?: Event): void {
    this.element.propagator.dispatch(`${on}item`, keys, event)

    this.element.propagator.dispatch(`${on}items`, [{
      items: keys
    }], event)
  }

  public reset (): void {
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
  }

  protected handleDrop (event: DragEvent): void {
    event.preventDefault()
    this.element.toggleAttribute('sc-drop-over', false)

    if (
      this.isDroppable(event) &&
      event.dataTransfer !== null
    ) {
      if (event.dataTransfer.files.length > 0) {
        this.dropFiles(event.dataTransfer.files, event)
      } else {
        const keys = JSON.parse(event.dataTransfer.getData('sc-keys')) as unknown[]

        if (isArray(keys)) {
          if (event.ctrlKey) {
            this.dropItems(keys, 'dropcopy', event)
          } else {
            this.dropItems(keys, 'drop', event)
          }
        }
      }
    }
  }

  protected isDroppable (event: DragEvent): boolean {
    if (event.dataTransfer?.getData('sc-origin') === this.element.id) {
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

      if (event.dataTransfer.types.includes('sc-type')) {
        types.push(event.dataTransfer.getData('sc-type'))
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
