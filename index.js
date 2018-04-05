const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo')(session);
const config = require('config');
const mongoose = require('mongoose');
const app = express();
const router = require('./server');

const PORT = config.get('app.port');
const SESS_SECRET = config.get('app.sess_secret');
const db = mongoose.connection;
mongoose.connect(config.get('app.dburi'));
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('DB connected!');
  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(
    session({
      store: new MongoStore({mongooseConnection: db}),
      secret: SESS_SECRET,
      cookie: {secure: false},
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(router);
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
});
