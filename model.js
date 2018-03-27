/* eslint-disable new-cap */
const mongoose = require('mongoose');

const lyftUserSchema = mongoose.Schema({
  phone: String,
  auth: {
    access_token: String,
    refresh_token: String,
    expires_in: Number,
    updated_at: Date,
  },
});

const LyftUser = mongoose.model('LyftUser', lyftUserSchema);

const lyftRideSchema = mongoose.Schema({
  phone: String,
  ride_id: String,
  status: String,
  can_cancel: [String],
});

const LyftRide = mongoose.model('LyftRide', lyftRideSchema);

module.exports = {
  LyftUser,
  LyftRide,
};
