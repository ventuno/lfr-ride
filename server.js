const express = require('express');
const lyftClient = require('./lyft-client');

/* eslint-disable new-cap */
const router = express.Router();

router.post('/step3', (req, res) => {
  return lyftClient
    .handleAuthorizeRedirect(req.body.code, req.body.state)
    .then(() => {
      res.json({status: 'success'});
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
  // TODO forward events
  res.send('okp');
});

router.post('/lyft_auth', (req, res) =>
  res.json({
    url: lyftClient.authorizeUrl(req.body.phone),
  })
);

module.exports = router;
