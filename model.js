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

module.exports = {
  LyftUser,
};
