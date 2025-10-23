export default {
  server: {
    port: parseInt(process.env.PORT, 10) || 4000,
    baseUrl: process.env.BASE_URL || 'http://localhost:4000'
  },
  database: {
    uri: process.env.MONGODB_URI || '',
    replitKey: process.env.REPLIT_DB_URL || ''
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    tokenExpiresIn: '7d',
    sessionSecret: process.env.SESSION_SECRET || 'session-secret'
  },
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    apple: {
      clientID: process.env.APPLE_CLIENT_ID || '',
      teamID: process.env.APPLE_TEAM_ID || '',
      keyID: process.env.APPLE_KEY_ID || '',
      privateKey: process.env.APPLE_PRIVATE_KEY || ''
    },
    facebook: {
      clientID: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || ''
    }
  },
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    gemProducts: {
      small: process.env.STRIPE_PRICE_GEM_SMALL || '',
      medium: process.env.STRIPE_PRICE_GEM_MEDIUM || '',
      large: process.env.STRIPE_PRICE_GEM_LARGE || ''
    },
    subscriptionPriceId: process.env.STRIPE_SUBSCRIPTION_PRICE || ''
  }
};
