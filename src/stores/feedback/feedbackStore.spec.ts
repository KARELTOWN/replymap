// Moving a card between two kanban columns.
//
// This is the only logic of the tracking board that changes the displayed state
// before the API answers: if it is wrong, the card vanishes or is duplicated
// before the user's eyes.
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { feedbackStore } from './feedbackStore'

const OPEN = 'statut-ouvert'
const DOING = 'statut-en-cours'
const DONE = 'statut-resolu'

const buildBoard = () => [
  {
    status: { _id: OPEN, libelle: 'Ouvert' },
    feedbacks: [{ _id: 'f1', title: 'A' }, { _id: 'f2', title: 'B' }],
  },
  { status: { _id: DOING, libelle: 'En cours' }, feedbacks: [] },
  { status: { _id: DONE, libelle: 'Résolu' }, feedbacks: [{ _id: 'f3', title: 'C' }] },
]

describe('moveFeedbackLocally', () => {
  let store: ReturnType<typeof feedbackStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = feedbackStore()
    store.feedbacks = buildBoard()
  })

  it('retire la carte de sa colonne et la place en tête de la cible', () => {
    store.moveFeedbackLocally('f1', OPEN, DOING)

    expect(store.feedbacks[0].feedbacks.map((f: any) => f._id)).toEqual(['f2'])
    expect(store.feedbacks[1].feedbacks.map((f: any) => f._id)).toEqual(['f1'])
  })

  it('ne perd pas la carte quand la colonne cible contient déjà des éléments', () => {
    store.moveFeedbackLocally('f1', OPEN, DONE)

    expect(store.feedbacks[2].feedbacks.map((f: any) => f._id)).toEqual(['f1', 'f3'])
  })

  it('ignore une carte absente de la colonne annoncée', () => {
    store.moveFeedbackLocally('inconnue', OPEN, DOING)

    expect(store.feedbacks[0].feedbacks).toHaveLength(2)
    expect(store.feedbacks[1].feedbacks).toHaveLength(0)
  })

  it('ignore un statut qui ne correspond à aucune colonne', () => {
    store.moveFeedbackLocally('f1', OPEN, 'statut-inexistant')

    // The card must stay where it is rather than vanish from the board.
    expect(store.feedbacks[0].feedbacks.map((f: any) => f._id)).toEqual(['f1', 'f2'])
  })
})
