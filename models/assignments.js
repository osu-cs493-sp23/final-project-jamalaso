const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');
const fs = require("node:fs")


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

    const assignment = await collection.findOne({ _id: new ObjectId(id) });
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
    const pageSize = 5;
    const lastPage = Math.ceil(count / pageSize);
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;

    const submissions = await collection.find({ assignmentId: assignmentId })
        .skip(offset)
        .limit(pageSize)
        .toArray();

    console.log(" ===submissions: ", submissions)

    return {
        submissions: submissions,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        links: {
            nextPage: page < lastPage ? `/assignments/${assignmentId}?page=${Number(page) + 1}` : null,
            lastPage: page > 1 ? `/assignments/${assignmentId}?page=${Number(page) - 1}` : null
        }
    };
}
exports.getSubmissions = getSubmissions;


async function getSubmissionById(id) {
    const db = getDbReference();
    const collection = db.collection('submissions');
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const results = await collection
        .find({ _id: new ObjectId(id) })
        .toArray();
      return results[0];
    }
}
exports.getSubmissionById = getSubmissionById;


async function addSubmission(submission) {
    const db = getDbReference();
    const collection = db.collection('submissions');
    const result = await collection.insertOne(submission);

    return result.insertedId;
}
exports.addSubmission = addSubmission;


async function saveFileInfo(file) {
    const db = getDbReference();
    const collection = db.collection('submissions');
    const result = await collection.insertOne(file);
    return result.insertedId;
}
exports.saveFileInfo = saveFileInfo


function removeUploadedFile(file) {
    return new Promise((resolve, reject) => {
        fs.unlink(file.path, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
exports.removeUploadedFile = removeUploadedFile


async function getFileInfoById(id) {
    const db = getDbReference();
    const collection = db.collection('submissions');
    if (!ObjectId.isValid(id)) {
        return null;
    } else {
        const results = await collection
            .find({ _id: new ObjectId(id) })
            .toArray();
        return results[0];
    }
}
exports.getFileInfoById = getFileInfoById
