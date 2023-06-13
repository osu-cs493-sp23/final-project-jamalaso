const { Router } = require('express');
const router = Router()
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const { generateAuthToken, requireAuthentication } = require("../lib/auth")

const { getAllUsers, getUserById, insertUser, UserSchema } = require('../models/users');

const {
  validateUser
} = require('../models/users')


//FOR TESTING PURPOSES
router.get('/', async function (req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


router.post('/', async function (req, res) {
  try {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role
    };
    const insertedId = await insertUser(newUser);
    res.status(201).json({ insertedId });
  } catch (error) {
    console.error('Failed to insert user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});


router.post('/login', async function (req, res, next) {
  if (req.body && req.body.email && req.body.password) {
      try {
          const authenticated = await validateUser(
              req.body.email,
              req.body.password
          )
          if (authenticated) {
              const token = generateAuthToken(req.body.email)
              res.status(200).send({
                  token: token
              })
          } else {
              res.status(401).send({
                  error: "Unauthorized: Invalid authentication credentials"
              })
          }
      } catch (e) {
          next(e)
      }
  } else {
      res.status(400).send({
          error: "Request body requires `email` and `password`."
      })
  }
})


router.get('/:id', async function (req, res, next) {
  const reqId = req.params.id;
  try {

    const id = new ObjectId(reqId);
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userDetails } = user;

    res.status(200).json({ user: userDetails });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});





module.exports = router