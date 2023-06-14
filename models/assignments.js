const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');


const AssignmentsSchema = {
    courseId: { type: String, required: true },
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


async function getSubmissions(assignmentId, page) {
    const db = getDbReference();
    const collection = db.collection('submissions');

    const count = await collection.countDocuments();
    const pageSize = 10;
    const lastPage = Math.ceil(count / pageSize);
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const submissions = await collection.find({ assignmentId: assignmentId })
    .skip(offset)
    .limit(pageSize)
    .toArray();

    return {
        submissions: submissions,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        totalCount: count
    };
}
exports.getSubmissions = getSubmissions;


async function addSubmission(submission) {
    const db = getDbReference();
    const collection = db.collection('submissions');
    const result = await collection.insertOne(submission);

    return result.insertedId;
}
exports.addSubmission = addSubmission;


