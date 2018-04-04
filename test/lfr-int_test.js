require('./util/env.js');

const url = require('url');
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const config = require('config');

const SESS_SECRET = config.get('app.sess_secret');
const base64Auth = Buffer.from(
  `${config.get('auth.lyft.client_id')}:${config.get(
    'auth.lyft.client_secret'
  )}`
).toString('base64');
const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');
const request = require('supertest');

const app = express();
const router = require('../server');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

nock('https://api.lyft.com')
  .post('/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: 'refresh_token',
  })
  .reply(200, {access_token: 'abc'})
  .post('/oauth/token', {grant_type: 'authorization_code', code: 'code'})
  .matchHeader('authorization', `Basic ${base64Auth}`)
  .reply(200, {access_token: 'abc'})
  .post('/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: 'refresh_token',
  })
  .matchHeader('authorization', `Basic ${base64Auth}`)
  .reply(200, {access_token: 'abc'})
  .post('/v1/rides', {
    ride_type: 'lyft_line',
    origin: {lat: 123, lng: 123},
    destination: {lat: 234, lng: 234},
  })
  .matchHeader('authorization', 'Bearer abc')
  .reply(204, {ride_id: 123})
  .get('/v1/cost')
  .query({
    ride_type: 'ride_type',
    start_lat: 123,
    start_lng: 123,
    end_lat: 234,
    end_lng: 234,
  })
  .matchHeader('authorization', 'Bearer abc')
  .reply(200, {ride_id: 123});
let req = request.agent(app);
let state;
describe('lfr-ride', function() {
  before(require('mongodb-runner/mocha/before'));
  before(() => {
    return mongoose.connect(config.get('app.dburi')).then(() => {
      app.use(
        session({
          store: new MongoStore({mongooseConnection: mongoose.connection}),
          secret: SESS_SECRET,
          cookie: {secure: false},
          resave: false,
          saveUninitialized: true,
        })
      );
      app.use(router);
    });
  });
  after(require('mongodb-runner/mocha/after'));
  it('should redirect to /index.html', function() {
    return req
      .get('/step1')
      .expect('Location', '/index.html')
      .expect(302);
  });
  it('should redirect to /lyft_auth', function() {
    return req
      .post('/step2')
      .type('form')
      .send({phone: '+15555558383'})
      .expect('Location', '/lyft_auth')
      .expect(302);
  });
  it('should redirect to the lyft website', function() {
    return req
      .get('/lyft_auth')
      .expect((res) => {
        const locationHeader = res.headers.location;
        const redirectUrl = url.parse(locationHeader, true);
        expect(redirectUrl.protocol).to.equal('https:');
        expect(redirectUrl.hostname).to.equal('api.lyft.com');
        expect(redirectUrl.pathname).to.equal('/oauth/authorize');
        expect(redirectUrl.query.client_id).to.equal(
          config.get('auth.lyft.client_id')
        );
        expect(redirectUrl.query.scope).to.equal(
          'public profile rides.read rides.request offline'
        );
        expect(redirectUrl.query).to.have.property('state');
        state = redirectUrl.query.state;
      })
      .expect(302);
  });

  it('it should request the authorization token', function() {
    return req
      .get('/step3')
      .query({code: 'code', state: state})
      .expect(200);
  });

  it('it should request a ride', function() {
    req
      .post('/rides')
      .send({
        phone: '+15555558383',
        origin: {lat: 123, lng: 123},
        destination: {lat: 234, lng: 234},
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .end();
  });
});
