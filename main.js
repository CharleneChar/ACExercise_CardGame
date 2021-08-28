// define five game states with a state machine
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

// store unchangeable data in a constant
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // spade
  'https://image.flaticon.com/icons/svg/105/105220.svg', // heart
  'https://image.flaticon.com/icons/svg/105/105212.svg', // diamond
  'https://image.flaticon.com/icons/svg/105/105219.svg' // club
]

// set view object (in Modal-View-Controller)
const view = {
  // get different content for different cards
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="card symbol">
      <p>${number}</p>
    </div>`
  },

  // get only the element tag to wrap up the above card content
  getCardElement(index) {
    return `    <div class="card back" data-index='${index}'></div>`
  },

  // display cards
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // deal well with special characters by transforming number to character
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // change card content
  flipCards(...cards) {
    cards.map(card => {
      // turn to the front of a card
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }

      // turn to the back of a card
      card.classList.add('back')
      card.innerHTML = null
    })
  },

  // change card patterns when two cards match
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  // change scores according to the result of card comparison
  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  // change times of trying
  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried: ${times} time(s)`
  },

  // light the card's border
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', e => {
        card.classList.remove('wrong')
      }, {
        once: true
      })
    })
  },

  // display pattern of game over
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>`
    const header = document.querySelector('#header')
    header.before(div)
  }
}

// create a place for storing external techniques
const utility = {
  // shuffle cards with the Fsiher-Yates shuffle algorithm
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

// set model object (in Modal-View-Controller)
const model = {
  // create a temporary storage for revealed cards
  revealedCards: [],

  // compare numbers on two cards and return the comparison result
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  // record scores and times of trying
  score: 0,
  triedTimes: 0
}

// set controller object (in Modal-View-Controller)
const controller = {
  // initialize the game by setting the game state
  currentState: GAME_STATE.FirstCardAwaits,

  // call view's inside function to generate and display cards
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // create a system to start tasks assignment depending on the current state
  dispatchCardAction(card) {
    // do nothing when the card is already flipped (to avoid double flipping)
    if (!card.classList.contains('back')) {
      return
    }

    // determine state and execute different actions depending on the state
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(model.triedTimes += 1)
        view.flipCards(card)
        model.revealedCards.push(card)
        // determine if the cards match
        if (model.isRevealedCardsMatched()) {
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          // PS "..." means spread operator (instead of rest parameters)
          view.pairCards(...model.revealedCards)
          model.revealedCards = []
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          // delay card flipping for a while for game players to remember the card positions
          setTimeout(this.resetCards, 1000)
        }
        break
    }
  },

  // reset to first card await state
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}

// call to generate and display cards for card game initialization
controller.generateCards()

// Select all cards as a node list to set DOM event listener for each card
document.querySelectorAll('.card').forEach(card => {
  // click a card to start the game 
  card.addEventListener('click', event => {
    controller.dispatchCardAction(card)
  })
})