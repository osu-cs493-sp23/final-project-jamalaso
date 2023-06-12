const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');


const CourseSchema = {
    subject: { type: String, required: true },
    number: { type: String, required: true },
    title: { type: String, required: true },
    term: { type: String, required: true },
    instructorId: { type: Number, required: true }
  };
  
  exports.CourseSchema = CourseSchema;

async function getAllCourses() {
    const db = getDbReference();
    const collection = db.collection('courses');
    const results = await collection.find().toArray();
    return results;
}
exports.getAllCourses = getAllCourses;

async function insertCourse(course) {
    const db = getDbReference();
    const collection = db.collection('courses');
    const result = await collection.insertOne(course);
    return result.insertedId;
}
exports.insertCourse = insertCourse;

async function getCourseById(id) {
    const db = getDbReference();
    const collection = db.collection('courses');
  
    const course = await collection.findOne({ _id: id });
    return course;
}
exports.getCourseById = getCourseById;


async function updateCourse(courseId, updatedCourse) {
    const db = getDbReference();
    const collection = db.collection('courses');
  
    const result = await collection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updatedCourse }
    );
  
    return result.modifiedCount;
}
exports.updateCourse = updateCourse;


async function deleteCourse(courseId) {
    const db = getDbReference();
    const collection = db.collection('courses');
  
    const result = await collection.deleteOne({ _id: new ObjectId(courseId) });
    return result.deletedCount;
}
exports.deleteCourse = deleteCourse;

