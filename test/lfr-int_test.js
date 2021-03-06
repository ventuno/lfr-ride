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

const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const nock = require('nock');
const request = require('supertest');

const app = express();
const router = require('../server');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const lyft = nock('https://api.lyft.com');

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
  after(() => {
    require('mongodb-runner/mocha/after')();
    mongoose.connection.close();
  });
  describe('authentication', function() {
    it('should return the lyft website URL', function() {
      return req
        .post('/lyft_auth')
        .send({
          phone: '+15555558383',
        })
        .set('Content-Type', 'application/json')
        .expect((res) => {
          const redirectUrl = url.parse(res.body.url, true);
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
        .expect(200);
    });
    it('it should request the authorization token', function() {
      lyft
        .post('/oauth/token', {grant_type: 'authorization_code', code: 'code'})
        .matchHeader('authorization', `Basic ${base64Auth}`)
        .reply(200, {
          access_token: 'abc',
          refresh_token: 'refresh_token',
          expires_in: 3600,
        });
      return req
        .post('/step3')
        .send({code: 'code', state: state})
        .set('Content-Type', 'application/json')
        .expect((res) => {
          expect(res.body.status).to.equal('success');
        })
        .expect(200);
    });
  });

  describe('ride APIs', function() {
    it('it should request a ride', function() {
      lyft
        .post('/v1/rides', {
          ride_type: 'lyft_line',
          origin: {lat: 123, lng: 123},
          destination: {lat: 234, lng: 234},
        })
        .matchHeader('authorization', 'Bearer abc')
        .reply(204, {ride_id: 123});
      return req
        .post('/rides')
        .send({
          phone: '+15555558383',
          origin: {lat: 123, lng: 123},
          destination: {lat: 234, lng: 234},
        })
        .set('Content-Type', 'application/json')
        .expect(200);
    });
    it('it should estimate a ride', function() {
      lyft
        .get('/v1/cost')
        .query({
          ride_type: 'lyft_line',
          start_lat: 123,
          start_lng: 123,
          end_lat: 234,
          end_lng: 234,
        })
        .matchHeader('authorization', 'Bearer abc')
        .reply(200, {ride_id: 123});

      return req
        .post('/estimate')
        .send({
          phone: '+15555558383',
          origin: {lat: 123, lng: 123},
          destination: {lat: 234, lng: 234},
        })
        .set('Content-Type', 'application/json')
        .expect(200);
    });
  });

  describe('refresh token', function() {
    it('it should refresh the token', function() {
      lyft
        .post('/oauth/token', {
          grant_type: 'refresh_token',
          refresh_token: 'refresh_token',
        })
        .matchHeader('authorization', `Basic ${base64Auth}`)
        .reply(200, {access_token: 'def', expires_in: 3600})
        .post('/v1/rides', {
          ride_type: 'lyft_line',
          origin: {lat: 456, lng: 456},
          destination: {lat: 456, lng: 456},
        })
        .matchHeader('authorization', 'Bearer def')
        .reply(204, {ride_id: 456});

       const clock = sinon.useFakeTimers(new Date(9999, 0));
       return req
        .post('/rides')
        .send({
          phone: '+15555558383',
          origin: {lat: 456, lng: 456},
          destination: {lat: 456, lng: 456},
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .then(clock.restore);
    });
  });
});
