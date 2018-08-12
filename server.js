const express = require('express');
const {LyftRide} = require('./model');
const lyftClient = require('./lyft-client');

/* eslint-disable new-cap */
const router = express.Router();

router.get('/step1', (req, res) => {
  res.redirect('/index.html');
});

router.post('/step2', (req, res) => {
  req.session.phone = req.body.phone;
  res.redirect('/lyft_auth');
});

router.get('/step3', (req, res) => {
  return lyftClient
    .handleAuthorizeRedirect(req.query.code, req.query.state)
    .then(() => {
      res.send('Hello World!');
    });
});

router.post('/rides', (req, res) => {
  const body = req.body;
  const phone = body.phone;
  return lyftClient
    .requestRide(
      phone,
      lyftClient.RIDE_TYPES.LYFT_LINE,
      body.origin,
      body.destination
    )
    .then((ride) => {
      if (ride) {
        return LyftRide.create({
          phone: phone,
          ride_id: ride.ride_id,
          status: ride.status,
        });
      }
      throw new Error();
    })
    .then((ride) => {
      res.json(ride);
    });
});

router.post('/estimate', (req, res) => {
  const body = req.body;
  const phone = body.phone;
  return lyftClient
    .estimateRide(
      phone,
      lyftClient.RIDE_TYPES.LYFT_LINE,
      body.origin,
      body.destination
    )
    .then((estimate) => {
      if (estimate) {
        return res.json(estimate);
      }
      throw new Error();
    });
});

router.post('/update', (req, res) => {
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

router.get('/lyft_auth', (req, res) =>
  res.redirect(lyftClient.authorizeUrl(req.session.phone))
);

module.exports = router;
