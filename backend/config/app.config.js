const getEnv = require('../utils/get-env')

const appConfig = () =>({
    NODE_ENV:getEnv('NODE_ENV','development'),
    PORT:getEnv('PORT','5000'),
    BASE_PATH:getEnv('BASE_PATH','/api'),
    MONGO_URL:getEnv('MONGO_URL',''),
    
    JWT_SECRET:getEnv('JWT_SECRET'),

    SESSION_SECRET:getEnv('SESSION_SECRET'),
    SESSION_EXPIRES_IN:getEnv('SESSION_EXPIRES_IN'),

    GOOGLE_CLIENT_ID:getEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET:getEnv('GOOGLE_CLIENT_SECRET'),
    GOOGLE_CALLBACK_URL:getEnv('GOOGLE_CALLBACK_URL'),

    FRONTEND_ORIGIN:getEnv('FRONTEND_ORIGIN','http://localhost:5173'), // Default to frontend dev server
    FRONTEND_GOOGLE_CALLBACK_URL:getEnv('FRONTEND_GOOGLE_CALLBACK_URL'),
})

const config = appConfig();
module.exports = {config}