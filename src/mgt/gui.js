import { HtmlRouter } from '../ops/gui.js'

window.addEventListener('DOMContentLoaded', () => {
  const main = new HtmlRouter({
    id: 'main'
  })

  const menu = new HtmlRouter({
    id: 'menu'
  })

  const pop = new HtmlRouter({
    id: 'pop'
  })

  main
    .setBase(document.querySelector('.app>.main'))
    .setName('main')
    .start()

  menu
    .setBase(document.querySelector('.app>.menu'))
    .setMenu(document.querySelector('.app>.main'))
    .setName('menu')
    .start()

  pop
    .setBase(document.querySelector('.pop>.up'))
    .setPopup(document.querySelector('.pop'))
    .setName('pop')
    .start()
})
