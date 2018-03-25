const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const config = require('config');
const mongoose = require('mongoose');

const {LyftRide} = require('./model');
const lyftClient = require('./lyft-client');

const PORT = config.get('app.port');
const SESS_SECRET = config.get('app.sess_secret');

const app = express();
app.use(
  session({
    secret: SESS_SECRET,
    cookie: {secure: false},
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost/test');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('DB connected!');
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
});

app.get('/step1', (req, res) => {
  res.redirect('/index.html');
});

app.post('/step2', (req, res) => {
  req.session.phone = req.body.phone;
  res.redirect('/lyft_auth');
});

app.get('/step3', (req, res) => {
  lyftClient.handleAuthorizeRedirect(req.query.code, req.session.phone);
  res.send('Hello World!');
});

app.post('/rides', (req, res) => {
  const body = req.body;
  const phone = body.phone;
  lyftClient
    .requestRide(
      phone,
      lyftClient.RIDE_TYPES.LYFT_LINE,
      body.origin,
      body.destination
    )
    .then((ride) => {
      if (ride) {
        LyftRide.create({
          phone: phone,
          ride_id: ride.ride_id,
          status: ride.status,
        });
      }
    });
  res.send('okp');
});

app.post('/update', (req, res) => {
  const body = req.body;
  const event = body.event;
  LyftRide.findOne({ride_id: event.ride_id}, (err, ride) => {
    if (ride) {
      ride.status = event.status;
      ride.can_cancel = event.can_cancel;
      ride.save();
    }
  });
  res.send('okp');
});

app.get('/lyft_auth', (req, res) => res.redirect(lyftClient.authorizeUrl()));
