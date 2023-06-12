const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');


const AssignmentsSchema = {
    courseId: { type: Number, required: true },
    title: { type: String, required: true },
    points: { type: Number, required: true },
    due: { type: Date, required: true }
};
  
exports.AssignmentsSchema = AssignmentsSchema;

async function getAllAssignments() {
    const db = getDbReference();
    const collection = db.collection('assignments');
    const results = await collection.find().toArray();
    return results;
}
exports.getAllAssignments = getAllAssignments;

async function insertAssignment(assignment) {
    const db = getDbReference();
    const collection = db.collection('assignments');
    const result = await collection.insertOne(assignment);
    return result.insertedId;
}
exports.insertAssignment = insertAssignment;

async function getAssignmentById(id) {
    const db = getDbReference();
    const collection = db.collection('assignments');
  
    const assignment = await collection.findOne({ _id: id });
    return assignment;
}
exports.getAssignmentById = getAssignmentById;


async function updateAssignment(assignmentId, updatedAssignment) {
    const db = getDbReference();
    const collection = db.collection('assignments');
  
    const result = await collection.updateOne(
      { _id: new ObjectId(assignmentId) },
      { $set: updatedAssignment }
    );
  
    return result.modifiedCount;
}
exports.updateAssignment = updateAssignment;


async function deleteAssignment(assignmentId) {
    const db = getDbReference();
    const collection = db.collection('assignments');
  
    const result = await collection.deleteOne({ _id: new ObjectId(assignmentId) });
    return result.deletedCount;
}
exports.deleteAssignment = deleteAssignment;