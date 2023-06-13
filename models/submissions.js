const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');


const SubmissionsSchema = {
    assignmentId: { type: String, required: true },
    studentId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    grade: { type: Number, required: true },
    file: { type: String, required: true },
};
  
exports.SubmissionsSchema = SubmissionsSchema;



async function getAssignmentById(id) {
    const db = getDbReference();
    const collection = db.collection('assignments');
  
    const assignment = await collection.findOne({ _id: id });
    return assignment;
}
exports.getAssignmentById = getAssignmentById;



