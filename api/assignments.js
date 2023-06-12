const { Router } = require('express')

const router = Router()
const { getAllAssignments, insertAssignment, getAssignmentById, updateAssignment, deleteAssignment} = require('../models/assignments');
const { ObjectId } = require('mongodb');


router.get('/', async function (req, res) {
    try {
      const assignments = await getAllAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });


  router.post('/', async function (req, res, next) {
    try {
      const assignment = {
        courseId: req.body.courseId,
        title: req.body.title,
        points: req.body.points,
        due: req.body.due
      };
  
      const assignmentId = await insertAssignment(assignment);
  
      res.status(200).json({
        message: 'Assignment inserted successfully',
        courseId: assignmentId
      });
    } catch (err) {
      next(err);
    }
  });


  router.get('/:id', async function (req, res, next) {
    const reqId = req.params.id;
    try {
      const id = new ObjectId(reqId);
      const assignment = await getAssignmentById(id);
  
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




  router.patch('/:id', async function (req, res, next) {
    try {
      const id = req.params.id;
      const updatedAssignment = {
        courseId: req.body.courseId,
        title: req.body.title,
        points: req.body.points,
        due: req.body.due
      };
  
      const modifiedCount = await updateAssignment(id, updatedAssignment);
  
      res.status(200).json({
        message: 'Assignment updated successfully',
        modifiedCount: modifiedCount
      });
    } catch (err) {
      next(err);
    }
  });



router.delete('/:id', async function (req, res, next) {
    try {
      const assignmentId = req.params.id;
      const deletedCount = await deleteAssignment(assignmentId);
  
      res.status(200).json({
        message: 'Assignment deleted successfully',
        deletedCount: deletedCount
      });
    } catch (err) {
      next(err);
    }
  });




router.get('/:id/submissions', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /assignments/{id}/submissions'
    });
})

router.post('/:id/submissions', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /assignments/{id}/submissions'
    });
})





module.exports = router