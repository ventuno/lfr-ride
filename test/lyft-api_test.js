require('./util/env.js');
const nock = require('nock');
const chai = require('chai');
const expect = chai.expect;

const config = require('config');

const lyftApi = require('../lyft-api');

const base64Auth = Buffer.from(
  `${config.get('auth.lyft.client_id')}:${config.get(
    'auth.lyft.client_secret'
  )}`
).toString('base64');

const lyft = nock('https://api.lyft.com');

describe('lyft-api', function() {
  it('should return the auth URL', function() {
    expect(lyftApi.authorizeUrl('abc')).to.equal(
      'https://api.lyft.com/oauth/authorize?client_id=lyft_client_id&scope=public%20profile%20rides.read%20rides.request%20offline&response_type=code&state=abc'
    );
  });

  it('should retrieve the access token', function() {
    lyft
      .post('/oauth/token', {grant_type: 'authorization_code', code: 'code'})
      .matchHeader('authorization', `Basic ${base64Auth}`)
      .reply(200, {access_token: 'abc'});
    return lyftApi.handleAuthorizeRedirect('code').then((auth) => {
      expect(auth).to.have.property('access_token');
    });
  });

  it('should refresh the access token', function() {
    lyft
      .post('/oauth/token', {
        grant_type: 'refresh_token',
        refresh_token: 'refresh_token',
      })
      .matchHeader('authorization', `Basic ${base64Auth}`)
      .reply(200, {access_token: 'abc'});
    return lyftApi.refreshAccessToken('refresh_token').then((auth) => {
      expect(auth).to.have.property('access_token');
    });
  });

  it('should request a new ride', function() {
    lyft
      .post('/v1/rides', {
        ride_type: 'ride_type',
        origin: {lat: 123, lng: 123},
        destination: {lat: 234, lng: 234},
      })
      .matchHeader('authorization', 'Bearer access_token')
      .reply(204, {ride_id: 123});
    return lyftApi
      .requestRide(
        'access_token',
        'ride_type',
        {lat: 123, lng: 123},
        {lat: 234, lng: 234}
      )
      .then((auth) => {
        expect(auth).to.have.property('ride_id');
      });
  });

  it('should estimate a new ride', function() {
    lyft
      .get('/v1/cost')
      .query({
        ride_type: 'ride_type',
        start_lat: 123,
        start_lng: 123,
        end_lat: 234,
        end_lng: 234,
      })
      .matchHeader('authorization', 'Bearer access_token')
      .reply(200, {ride_id: 123});
    return lyftApi
      .estimateRide(
        'access_token',
        'ride_type',
        {lat: 123, lng: 123},
        {lat: 234, lng: 234}
      )
      .then((auth) => {
        expect(auth).to.have.property('ride_id');
      });
  });
});
