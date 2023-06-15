const { Router } = require('express')

const router = Router()
const { getAllCourses, insertCourse, getCourseById, updateCourse, deleteCourse,
  getAssignmentsByCourse, getCourseStudents, addEnrolledStudents, getCourseRoster, CourseSchema } = require('../models/courses');

const { requireAuthentication } = require("../lib/auth");
const { validateAgainstSchema } = require('../lib/validation')
const {getUserByEmail } = require('../models/users');

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
  if (validateAgainstSchema(req.body, CourseSchema)) {
    const permissionsRole = await getUserByEmail(req.user.id)

    const course = {
      subject: req.body.subject,
      number: req.body.number,
      title: req.body.title,
      term: req.body.term,
      instructorId: req.body.instructorId
    };

    try {
      if (permissionsRole.role != "admin") {
        return res.status(403).send({ error: 'Forbidden: You are not allowed to post a course.' });
      }

      const courseId = await insertCourse(course);

      res.status(201).json({
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
  const reqId = req.params.id;
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
      const permissionsRole = await getUserByEmail(req.user.id)
      const courseId = req.params.id;
      
      // Retrieve the existing course
      const existingCourse = await getCourseById(courseId);
      // console.log(" ======permissionsRole:", String(permissionsRole._id))
      // console.log(" ======permissionsRole role:", permissionsRole.role)
      // console.log(" ======existingCourse:", existingCourse.instructorId)

      // Check if the course exists
      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // console.log("Bool: ", String(permissionsRole._id) === existingCourse.instructorId)
      // console.log("Bool 2: ", !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId))
      // console.log("Bool 3: ", permissionsRole.role !== 'admin')
      
      // Check authorization
      if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
        return res.status(403).json({ error: 'Forbidden: You are not allowed to update this course' });
      }

      const updatedCourse = {
        subject: req.body.subject,
        number: req.body.number,
        title: req.body.title,
        term: req.body.term,
        instructorId: req.body.instructorId
      };

      const modifiedCount = await updateCourse(courseId, updatedCourse);

      res.status(200).json({
        message: 'Course updated successfully',
        modifiedCount: modifiedCount
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Course."
    });
  }
});



router.delete('/:id', requireAuthentication, async function (req, res, next) {
  try {
    const courseId = req.params.id;

    const permissionsRole = await getUserByEmail(req.user.id)
    // Check authorization
    if (permissionsRole.role !== 'admin') {
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

    const permissionsRole = await getUserByEmail(req.user.id)
    const courseId = req.params.id;

    // Retrieve the existing course
    const existingCourse = await getCourseById(courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to retrieve information about this course' });
    }

    const students = await getCourseStudents(courseId);

    res.status(200).json({
      courseId: courseId,
      students: students
    });
  } catch (err) {
    next(err);
  }
});



router.post('/:id/students', requireAuthentication, async function (req, res, next) {
  try {

    const permissionsRole = await getUserByEmail(req.user.id)
    const courseId = req.params.id;
    const enrolledStudents = req.body.students;

    // Retrieve the existing course
    const existingCourse = await getCourseById(courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to retrieve information about this course' });
    }

    await addEnrolledStudents(courseId, enrolledStudents);

    res.status(200).json({
      message: 'Succesfully Enrolled Student'
    });
  } catch (err) {
    next(err);
  }
});



router.get('/:id/roster', requireAuthentication, async function (req, res, next) {
  try {

    const permissionsRole = await getUserByEmail(req.user.id)
    const courseId = req.params.id;
    
    if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to retrieve information about this course' });
    }
    
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
    
    // Retrieve the existing course
    const existingCourse = await getCourseById(courseId);
    
    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const assignments = await getAssignmentsByCourse(courseId);
    res.status(200).json({
      assignments: assignments
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router