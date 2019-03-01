'use strict';
const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const store = require('../store');
const BookmarksService = require('./bookmarks-service');

const bookmarksRoute = express.Router();
const parser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating),
});

bookmarksRoute
  .route('/bookmarks')
  .get((req,res,next) => {
    console.log('hello!');
    BookmarksService.getAll(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(parser, (req,res) => {
    // still using store here, update to db
    if (!req.body.title) {
      return res.status(400).send('Please include title.'); 
    }
    
    if (!req.body.description) {
      return res.status(400).send('Please include description.'); 
    } 
    
    if (!req.body.url) {
      return res.status(400).send('Please include link.'); 
    }
    const { title, url, description, rating } = req.body;
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return res.status(400).send('Rating must be a number between 0 and 5');
    }
    if (!isWebUri(url)) {
      return res.status(400).send('Please input a valid URL');
    }
    const id = uuid(); 
    const bookmark = { 
      id, 
      title, 
      url, 
      description, 
      rating 
    };
    store.bookmarks.push(bookmark);
    res.status(201).location(`http://localhost:8001/bookmarks/${id}`).json(bookmark);
  });

bookmarksRoute
  .route('/bookmarks/:bookmarkId')
  .get((req, res, next) => {
    const { bookmarkId } = req.params;
    BookmarksService.getById(req.app.get('db'), bookmarkId)
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: 'bookmark not found' }
          });
        }
        res.json(serializeBookmark(bookmark));
      })
      .catch(next);
  })
  .delete((req, res) => {
    //still using store here, update to db
    const { bookmark_id } = req.params;

    const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id);

    if (bookmarkIndex === -1) {
      return res.status(404).send('bookmark not found');
    }
    store.bookmarks.splice(bookmarkIndex, 1);
  });

module.exports = bookmarksRoute;