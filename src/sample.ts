import type { Entry, SlamBook } from './types.ts'

export const SAMPLE_BOOK_ID = 'sample-the-long-recess'

function page(id: string, signedAt: string, answers: Record<string, string>): Entry {
  return { id, signedAt, answers }
}

export function createSampleBook(): SlamBook {
  return {
    id: SAMPLE_BOOK_ID,
    ownerName: 'Meera Iyer',
    title: 'The Long Recess',
    dedication: 'For the people who saved me a seat.',
    theme: 'rose',
    createdAt: '2024-06-14T12:00:00.000Z',
    sample: true,
    entries: [
      page('sample-arjun', '2024-06-15T12:00:00.000Z', {
        name: 'Arjun Desai',
        nickname: 'Arj',
        birthday: '3 August',
        hometown: 'Pune',
        color: 'Electric blue',
        food: 'Roadside poha',
        song: 'Yellow — Coldplay',
        movie: 'Zindagi Na Milegi Dobara',
        hobby: 'Drawing tiny cars in the margins',
        words: 'loud, loyal, late',
        memory:
          'We missed the last bus and split a melting ice candy all the way down the hill. You kept saying we should run. We did not run.',
        wish: 'May your group projects always include one person who actually read the chapter.',
        message:
          'You saved the window seat and pretended you had not. I knew. Thank you for every ordinary Tuesday.',
      }),
      page('sample-sara', '2024-06-16T12:00:00.000Z', {
        name: 'Sara Qureshi',
        nickname: 'Saru',
        birthday: '19 November',
        hometown: 'Hyderabad',
        color: 'Marigold',
        food: 'Biryani, no debate',
        song: 'Ocean Eyes — Billie Eilish',
        movie: 'Queen',
        hobby: 'Making playlists nobody asked for',
        words: 'gentle, sharp, gold',
        memory:
          'The rain drill where we hid in the library and you quizzed me with song lyrics instead of the textbook.',
        wish: 'I hope you keep choosing the long walk when the short one is boring.',
        message: 'If this book ever feels too full, remember you made room for all of us first.',
      }),
      page('sample-leo', '2024-06-18T12:00:00.000Z', {
        name: 'Leo Fernandes',
        nickname: 'Leo',
        birthday: '27 January',
        hometown: 'Goa',
        color: 'Sea glass',
        food: 'Prawn balchão',
        song: 'Dreams — Fleetwood Mac',
        movie: 'The Grand Budapest Hotel',
        hobby: 'Kicking a football against the compound wall',
        words: 'chaos, kindness, encore',
        memory: 'Sports day, your undone shoelace, my terrible pep talk, and somehow a bronze medal.',
        wish: 'Go somewhere with salt in the air and send a photograph.',
        message: 'You are the friend I would call if I needed a plan and a joke in the same minute.',
      }),
      page('sample-ananya', '2024-06-20T12:00:00.000Z', {
        name: 'Ananya Rao',
        nickname: 'Anu',
        birthday: '8 May',
        hometown: 'Bengaluru',
        color: 'Ink black',
        food: 'Filter coffee, and anything fried',
        song: 'Anti-Hero — Taylor Swift',
        movie: 'Little Miss Sunshine',
        hobby: 'Reading the last page of a book first',
        words: 'brave, funny, mine',
        memory: 'We rewrote the farewell speech on the bus because the first one sounded like a circular.',
        wish: 'Take the front of the room. You already belong there.',
        message: 'Keep this page. When the year gets loud, I meant every word.',
      }),
    ],
  }
}
