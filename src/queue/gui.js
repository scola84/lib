import { HtmlRouter } from '../actor/gui.js'

const main = new HtmlRouter({
  id: 'router-main',
  name: 'main'
})

const menu = new HtmlRouter({
  id: 'router-menu',
  name: 'menu'
})

const pop = new HtmlRouter({
  id: 'router-pop',
  name: 'pop'
})

window.addEventListener('DOMContentLoaded', () => {
  main
    .setBase(document.querySelector('.app>.main'))
    .start()

  menu
    .setBase(document.querySelector('.app>.menu'))
    .setMenu(document.querySelector('.app>.main'))
    .start()

  pop
    .setBase(document.querySelector('.pop>.up'))
    .setPopup(document.querySelector('.pop'))
    .start()
})
