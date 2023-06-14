const { Router } = require('express')

const router = Router()
const { getAllCourses, insertCourse, getCourseById, updateCourse, deleteCourse,
  getAssignmentsByCourse, getCourseStudents, addEnrolledStudents, getCourseRoster } = require('../models/courses');

const { requireAuthentication } = require("../lib/auth");

const { ObjectId } = require('mongodb');


router.get('/', async function (req, res) {
  try {
    const courses = await getAllCourses(req.query.page || 1);
    res.status(200).send(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});


router.post('/', requireAuthentication, async function (req, res, next) {
  if (validateAgainstSchema(req.body, UserSchema)) {
    const requestingUser = req.user;

    const course = {
      subject: req.body.subject,
      number: req.body.number,
      title: req.body.title,
      term: req.body.term,
      instructorId: parseInt(req.body.instructorId)
    };

    try {
      if (!requestingUser.isAdmin) {
        return res.status(403).send({ error: 'Forbidden: You are not allowed to post a course.' });
      }

      const courseId = await insertCourse(course);

      res.status(200).json({
        message: 'Course inserted successfully',
        courseId: courseId
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      error: "Request body does not contain a valid course object. Please include a subject, number, title, term, and instructorId."
    })
  }
});


router.get('/:id', async function (req, res, next) {
  const reqId = parseInt(req.params.id);
  try {
    const course = await getCourseById(reqId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json({ course: course });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch course',
      message: error.message,
    });
  }
});


router.patch('/:id', requireAuthentication, async function (req, res, next) {
  if (Object.keys(req.body).some(field => ["subject", "number", "title", "term", "instructorId"].includes(field))) {
    try {
      const requestingUser = req.user;
      const courseId = parseInt(req.params.id);

      // Retrieve the existing course
      const existingCourse = await getCourseById(courseId);

      // Check if the course exists
      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check authorization
      if (requestingUser.role !== 'admin' || !!(requestingUser.role === 'instructor' && requestingUser.id === existingCourse.instructorId)) {
        return res.status(403).json({ error: 'Forbidden: You are not allowed to update this course' });
      }

      const updatedCourse = {
        subject: req.body.subject,
        number: req.body.number,
        title: req.body.title,
        term: req.body.term,
        instructorId: parseInt(req.body.instructorId)
      };

      const modifiedCount = await updateCourse(id, updatedCourse);

      res.status(200).json({
        message: 'Course updated successfully',
        modifiedCount: modifiedCount
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Business."
    });
  }
});


router.delete('/:id', requireAuthentication, async function (req, res, next) {
  try {
    const courseId = parseInt(req.params.id);

    // Retrieve the existing course
    const existingCourse = await getCourseById(courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (requestingUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to update this course' });
    }

    const deletedCount = await deleteCourse(courseId);

    res.status(200).json({
      message: 'Course deleted successfully',
      deletedCount: deletedCount
    });
  } catch (err) {
    next(err);
  }
});


router.get('/:id/students', requireAuthentication, async function (req, res, next) {
  try {
    const requestingUser = req.user;
    const courseId = parseInt(req.params.id);

    // Retrieve the existing course
    const existingCourse = await getCourseById(courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (requestingUser.role !== 'admin' || !!(requestingUser.role === 'instructor' && requestingUser.id === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to retrieve information about this course' });
    }

    const students = await getCourseStudents(courseId);

    res.status(200).json({
      courseId: courseId,
      enrolled: students
    });
  } catch (err) {
    next(err);
  }
});



router.post('/:id/students', async function (req, res, next) {
  try {
    const courseId = req.params.id;
    const enrolledStudents = req.body.students;

    await addEnrolledStudents(courseId, enrolledStudents);

    res.status(200).json({
      message: 'Succesfully Enrolled Student'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/roster', async function (req, res, next) {
  try {
    const courseId = req.params.id;

    const roster = await getCourseRoster(courseId);

    res.status(200).json({
      message: 'Roster',
      roster: roster
    });
  } catch (err) {
    next(err);
  }
});




router.get('/:id/assignments', async function (req, res, next) {
  try {
    const courseId = req.params.id;
    const assignments = await getAssignmentsByCourse(courseId);

    res.status(200).json({
      assignments: assignments
    });
  } catch (err) {
    next(err);
  }
});



module.exports = router