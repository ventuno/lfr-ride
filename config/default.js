module.exports = {
  app: {
    port: 3000,
    sess_secret: process.env.SESS_SECRET,
  },
  auth: {
    lyft: {
      client_id: process.env.LYFT_CLIENT_ID,
      client_secret: `SANDBOX-${process.env.LYFT_CLIENT_SECRET}`,
    },
  },
};
