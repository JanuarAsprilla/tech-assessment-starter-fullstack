import '@testing-library/jest-dom/vitest'

// jsdom no implementa <dialog>.showModal()/close(): se simulan lo justo para probar el diálogo.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
