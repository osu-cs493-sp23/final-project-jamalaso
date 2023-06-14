const { Router } = require('express');
const router = Router()
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

const { validateAgainstSchema } = require('../lib/validation')
const { generateAuthToken, requireAuthentication } = require("../lib/auth")

const { validateUser, getAllUsers, getUserById, insertUser, UserSchema, getUserByEmail } = require('../models/users');
const { getCoursesByInstructorId, getCoursesByStudentId } = require('../models/courses');

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


router.post('/', requireAuthentication, async (req, res) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    const requestingUser = req.user;

    const newUser = {
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role
    };

    try {
      const permissionsRole = await getUserByEmail(requestingUser.id)
      if (permissionsRole.role !== 'admin' && (newUser.role === 'admin' || newUser.role === 'instructor')) {
        return res.status(403).send({ error: 'Forbidden: You are not allowed to create an admin user.' });
      }

      const id = await insertUser(newUser);
      res.status(201).send({ id });

    } catch (err) {
      next(err)
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid user object or an invalid 'role' was specified."
    })
  }
})


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


router.get('/:id', requireAuthentication, async function (req, res, next) {
  const permissionsRole = await getUserByEmail(req.user.id)
  const requestingUserId = String(permissionsRole._id);
  const requestedUserId = String(req.params.id);

  console.log("first= " + requestedUserId + "\nsecond = " + requestingUserId)

  // Check if the authenticated user matches the requested user
  if (requestingUserId !== requestedUserId) {
    return res.status(403).json({ error: 'Forbidden: You are not allowed to access this user\'s information.' });
  }

  try {
    const userDetails = await getUserByEmail(new ObjectId(requestedUserId));

    if (!userDetails) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.user.role === 'instructor') {
      // Get the list of course IDs taught by the instructor
      const courses = await getCoursesByInstructorId(requestedUserId);
      userDetails.coursesTaught = courses.map(course => course.id);
    } else if (req.user.role === 'student') {
      // Get the list of course IDs enrolled by the student
      const courses = await getCoursesByStudentId(requestedUserId);
      userDetails.coursesEnrolled = courses.map(course => course.id);
    }

    res.status(200).json({ user: userDetails });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

module.exports = router