'use strict';
const knex = require('knex');
const app = require('../src/app');
const store = require('../src/store');

function makeBookmarks() {
  return [
    { id: 1,
      title: 'Google',
      url: 'https://www.google.com',
      description: 'Search engine',
      rating: 4 },
    { id: 2,
      title: 'Thinkful',
      url: 'https://www.thinkful.com',
      description: 'remote classroom for devs',
      rating: 5 },
    { id: 3,
      title: 'MDN',
      url: 'https://developer.mozilla.org',
      description: 'web docs for devs',
      rating: 5 }
  ];
}

describe('Bookmarks Endpoints', () => {
  let bookmarksCopy, db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  beforeEach('copy the bookmarks', () => {
    bookmarksCopy = store.bookmarks.slice();
  });

  afterEach('restore the bookmarks', () => {
    store.bookmarks = bookmarksCopy;
  });

  describe('401, unauthorized requests', () => {

    it('401 res for /bookmarks GET req', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it('401 res for /bookmarks POST', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({ title: 'test-title', url: 'http://some.thing.com', rating: 1 })
        .expect(401, { error: 'Unauthorized request' });
    });

    it('401 res for GET /bookmarks/:id', () => {
      const secondBookmark = store.bookmarks[1];
      return supertest(app)
        .get(`/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });

    it('401 res for DELETE /bookmarks/:id', () => {
      const aBookmark = store.bookmarks[1];
      return supertest(app)
        .delete(`/bookmarks/${aBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 and empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks', () => {
      const testBookmarks = makeBookmarks();
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('gets the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds 404 when bookmark does not exist', () => {
        return supertest(app)
          .get('/bookmarks/123')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Bookmark Not Found' }
          });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarks();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and the specified bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });
  });
  
});