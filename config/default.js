module.exports = {
  app: {
    port: process.env.PORT || 3000,
    dburi: process.env.MONGODB_URI,
    sess_secret: process.env.SESS_SECRET,
  },
  crypto: {
    algorithm: process.env.CRYPTO_ALGORITHM,
    password: process.env.CRYPTO_PASSWORD,
  },
  auth: {
    lyft: {
      client_id: process.env.LYFT_CLIENT_ID,
      client_secret: `SANDBOX-${process.env.LYFT_CLIENT_SECRET}`,
    },
  },
  services: {
    'sms-service': process.env.SMS_SERVICE,
  },
};
