const { Router } = require('express')

const router = Router()
const { getAllCourses, insertCourse, getCourseById, updateCourse, deleteCourse, 
  getAssignmentsByCourse, getCourseStudents, addEnrolledStudents, getCourseRoster} = require('../models/courses');
const { ObjectId } = require('mongodb');



router.get('/', async function (req, res) {
    try {
      const courses = await getAllCourses();
      res.json(courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  });

  router.post('/', async function (req, res, next) {
    try {
      const course = {
        subject: req.body.subject,
        number: req.body.number,
        title: req.body.title,
        term: req.body.term,
        instructorId: parseInt(req.body.instructorId)
      };
  
      const courseId = await insertCourse(course);
  
      res.status(200).json({
        message: 'Course inserted successfully',
        courseId: courseId
      });
    } catch (err) {
      next(err);
    }
  });


  router.get('/:id', async function (req, res, next) {
    const reqId = req.params.id;
    try {
      const id = new ObjectId(reqId);
      const course = await getCourseById(id);
  
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


  router.patch('/:id', async function (req, res, next) {
    try {
      const id = req.params.id;
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
  });





  router.delete('/:id', async function (req, res, next) {
    try {
      const courseId = req.params.id;
      const deletedCount = await deleteCourse(courseId);
  
      res.status(200).json({
        message: 'Course deleted successfully',
        deletedCount: deletedCount
      });
    } catch (err) {
      next(err);
    }
  });





  router.get('/:id/students', async function (req, res, next) {
    try {
      const courseId = req.params.id;
      const students = await getCourseStudents(courseId);
  
      res.status(200).json({
        courseId:courseId,
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