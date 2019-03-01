'use strict';
const express = require('express');
const uuid = require('uuid/v4');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const store = require('../store');
const BookmarksService = require('./bookmarks-service');

const bookmarksRoute = express.Router();
const parser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
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
  .post(parser, (req, res, next) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        return res.status(400).send({
          error: { message: `'${field}' is required` }
        });
      }
    }

    const { title, url, description, rating } = req.body;

    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return res.status(400).send('Rating must be a number between 0 and 5');
    }
    if (!isWebUri(url)) {
      return res.status(400).send('Please input a valid URL');
    }

    const id = uuid(); 

    const newBookmark = { 
      id, 
      title, 
      url, 
      description, 
      rating 
    };

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then(bookmark => {
        res
          .status(201)
          .location(`http://localhost:8001/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
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
  .delete((req, res, next) => {
    const { bookmark_id } = req.params;

    BookmarksService.deleteBookmark(req.app.get('db'), bookmark_id)
      .then(num => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRoute;