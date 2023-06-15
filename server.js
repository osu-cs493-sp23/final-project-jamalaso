/*
 * This require() statement reads environment variable values from the file
 * called .env in the project directory.  You can set up the environment
 * variables in that file to specify connection information for your own DB
 * server.
 */
require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const redis = require('redis')

const api = require('./api')
const { connectToDb } = require('./lib/mongo')
const { requireAuthenticationRateLimiting } = require('./lib/auth')

const app = express()
const port = process.env.PORT || 8000

/*
 * Morgan is a popular logger.
 */
app.use(morgan('dev'))

app.use(express.json())


const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || "6379"
const redisClient = redis.createClient({
  url: `redis://${redisHost}:${redisPort}`
})


const rateLimitWindowMilliseconds = 60000;

// Rate limit for requests without valid authentication token (per IP address)
const rateLimitWindowMaxRequests = 10;

const rateLimitRefreshRate = rateLimitWindowMaxRequests / rateLimitWindowMilliseconds

// Rate limit for requests with valid authentication token (per user)
const authenticatedRateLimitWindowMaxRequests = 30;

async function rateLimit(req, res, next) {
  let tokenBucket
  const ip = req.ip
  const authToken = req.headers.authorization // Assuming authentication token is passed in the headers

  console.log(" ===authToken: ", authToken)
  console.log(" ===req.user: ", req.user)
  console.log(" ===req.isAuthenticated: ", req.isAuthenticated)
  
  try {
    if (req.isAuthenticated) {
      tokenBucket = await redisClient.hGetAll(`user:${authToken}`)
    } else {
      tokenBucket = await redisClient.hGetAll(`ip:${ip}`)
    }
  } catch (e) {
    next()
    return
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || rateLimitWindowMaxRequests,
    last: parseInt(tokenBucket.last) || Date.now()
  }

  const timestamp = Date.now()
  const elapsedMillis = timestamp - tokenBucket.last

  if (req.isAuthenticated) {
    tokenBucket.tokens += elapsedMillis * (authenticatedRateLimitWindowMaxRequests / rateLimitWindowMilliseconds)
    tokenBucket.tokens = Math.min(tokenBucket.tokens, authenticatedRateLimitWindowMaxRequests)
  } else {
    tokenBucket.tokens += elapsedMillis * rateLimitRefreshRate
    tokenBucket.tokens = Math.min(tokenBucket.tokens, rateLimitWindowMaxRequests)
  }

  tokenBucket.last = timestamp

  if (tokenBucket.tokens >= 1) {
    tokenBucket.tokens -= 1
    if (req.isAuthenticated) {
      await redisClient.hSet(`user:${authToken}`, [
        ["tokens", tokenBucket.tokens],
        ["last", tokenBucket.last]
      ])
    } else {
      await redisClient.hSet(`ip:${ip}`, [
        ["tokens", tokenBucket.tokens],
        ["last", tokenBucket.last]
      ])
    }
    next()
  } else {
    if (req.isAuthenticated) {
      res.status(429).send({
        error: "Too many requests per minute (per user)"
      })
    } else {
      res.status(429).send({
        error: "Too many requests per minute (per IP)"
      })
    }
  }
}

app.use(requireAuthenticationRateLimiting);
app.use(rateLimit)


/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api)

app.use('*', function (req, res, next) {
    res.status(404).json({
        error: "Requested resource " + req.originalUrl + " does not exist"
    })
})

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
    console.error("== Error:", err)
    res.status(500).send({
        err: "Server error.  Please try again later."
    })
})

connectToDb(function () {
    app.listen(port, function () {
        console.log("== Server is running on port", port)
    })
})