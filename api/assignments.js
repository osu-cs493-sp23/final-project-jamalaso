const { Router } = require('express')

const router = Router()
const { getAllAssignments, insertAssignment, getAssignmentById, updateAssignment, deleteAssignment,
  getSubmissions, addSubmission, AssignmentsSchema } = require('../models/assignments');

const { getCourseById } = require('../models/courses');
const {getUserByEmail } = require('../models/users');

const { requireAuthentication } = require("../lib/auth");
const { validateAgainstSchema } = require('../lib/validation')

const { ObjectId } = require('mongodb');


//TEST FUNCTION TO GET ALL ASSIGNMENTS
router.get('/', async function (req, res) {
  try {
    const assignments = await getAllAssignments();
    res.json(assignments);
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});


router.post('/', requireAuthentication, async function (req, res, next) {
  if (validateAgainstSchema(req.body, AssignmentsSchema)) {
    const permissionsRole = await getUserByEmail(req.user.id)

    const assignment = {
      courseId: req.body.courseId,
      title: req.body.title,
      points: req.body.points,
      due: req.body.due
    };

    try {
      // Retrieve the existing course
      const existingCourse = await getCourseById(req.body.courseId);

      // Check if the course exists
      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check authorization
      if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
        return res.status(403).json({ error: 'Forbidden: You are not allowed to update this course' });
      }

      const assignmentId = await insertAssignment(assignment);

      res.status(201).json({
        message: 'Assignment inserted successfully',
        assignmentId: assignmentId
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      error: "Request body does not contain a valid assignment object. Please include a courseId, title, points, and due date."
    })
  }
});


router.get('/:id', async function (req, res, next) {
  const assignmentId = String(req.params.id);
  try {
    // const id = new ObjectId(reqId);
    const assignment = await getAssignmentById(new ObjectId(assignmentId));

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.status(200).json({ assignment: assignment });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch assignment',
      message: error.message,
    });
  }
});




router.patch('/:id', requireAuthentication, async function (req, res, next) {
  if (Object.keys(req.body).some(field => ["courseId", "title", "points", "due"].includes(field))) {
    try {
      const permissionsRole = await getUserByEmail(req.user.id)
      const assignmentId = req.params.id;
      
      // Retrieve the existing assignment
      const existingAssignment = await getAssignmentById(assignmentId);

      // Check if the assignment exists
      if (!existingAssignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      // Retrieve the existing course
      const existingCourse = await getCourseById(existingAssignment.courseId);

      // Check if the course exists
      if (!existingCourse) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check authorization
      if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
        return res.status(403).json({ error: 'Forbidden: You are not allowed to update this assignment' });
      }

      const updatedAssignment = {
        courseId: req.body.courseId,
        title: req.body.title,
        points: req.body.points,
        due: req.body.due
      };

      const modifiedCount = await updateAssignment(assignmentId, updatedAssignment);

      res.status(200).json({
        message: 'Assignment updated successfully',
        modifiedCount: modifiedCount
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body does not contain a valid Assignment."
    });
  }
});



router.delete('/:id', requireAuthentication, async function (req, res, next) {
  try {
    const permissionsRole = await getUserByEmail(req.user.id)
    const assignmentId = req.params.id;

    // Retrieve the existing assignment
    const existingAssignment = await getAssignmentById(assignmentId);

    // Check if the assignment exists
    if (!existingAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Retrieve the existing course
    const existingCourse = await getCourseById(existingAssignment.courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to delete this assignment' });
    }

    const deletedCount = await deleteAssignment(assignmentId);

    res.status(204).json({
      message: 'Assignment deleted successfully',
      deletedCount: deletedCount
    });
  } catch (err) {
    next(err);
  }
});



router.get('/:id/submissions', requireAuthentication, async function (req, res, next) {
  try {
    const permissionsRole = await getUserByEmail(req.user.id)
    const assignmentId = req.params.id;

    // Retrieve the existing assignment
    const existingAssignment = await getAssignmentById(assignmentId);

    // Check if the assignment exists
    if (!existingAssignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Retrieve the existing course
    const existingCourse = await getCourseById(existingAssignment.courseId);

    // Check if the course exists
    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check authorization
    if (permissionsRole.role !== 'admin' && !(permissionsRole.role === 'instructor' && String(permissionsRole._id) === existingCourse.instructorId)) {
      return res.status(403).json({ error: 'Forbidden: You are not allowed to view the submissions for this assignment' });
    }

    const submissions = await getSubmissions(assignmentId, (req.query.page || 1));

    res.status(200).send(
      submissions
    );
  } catch (err) {
    next(err);
  }
});



router.post('/:id/submissions', requireAuthentication, async function (req, res, next) {
  try {
    const assignmentId = req.params.id;
    const newSubmission = {
      assignmentId: assignmentId,
      studentId: req.body.studentId,
      timestamp: req.body.timestamp,
      grade: req.body.grade,
      file: req.body.file
    };

    const insertedId = await addSubmission(newSubmission);

    res.status(201).json({
      insertedId: insertedId
    });
  } catch (err) {
    next(err);
  }
});



module.exports = router