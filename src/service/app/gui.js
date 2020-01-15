import { HtmlRouter } from '../../worker/gui.js'

window.addEventListener('DOMContentLoaded', () => {
  const main = HtmlRouter.singleton({
    id: 'main'
  })

  const menu = HtmlRouter.singleton({
    id: 'menu'
  })

  const pop = HtmlRouter.singleton({
    id: 'pop'
  })

  main
    .setBase(document.querySelector('.app>.main'))
    .setName('main')
    .start()

  menu
    .setBase(document.querySelector('.app>.menu'))
    .setName('menu')
    .start()

  pop
    .setBase(document.querySelector('.pop>.up'))
    .setName('pop')
    .setPopup(true)
    .start()
})
