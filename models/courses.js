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



async function getAssignmentsByCourse(courseId) {
  const db = getDbReference();
  const collection = db.collection('assignments');

  const assignments = await collection.find({ courseId: courseId }).toArray();

  return assignments;
}
exports.getAssignmentsByCourse = getAssignmentsByCourse;


async function getCourseStudents(courseId) {
  const db = getDbReference();
  const collection = db.collection('students');

  const course = await collection.findOne({ courseId: courseId });
  return course ? course.enrolled : [];
}
exports.getCourseStudents = getCourseStudents;


async function addEnrolledStudents(courseId, students) {
  const db = getDbReference();
  const collection = db.collection('students');

  const existingCourse = await collection.findOne({ courseId: courseId });

  if (existingCourse) {
    await collection.updateOne(
      { courseId: courseId },
      { $addToSet: { enrolled: { $each: students } } }
    );
  } else {
    await collection.insertOne({
      courseId: courseId,
      enrolled: students
    });
  }
}
exports.addEnrolledStudents = addEnrolledStudents;


async function getCourseRoster(courseId) {
  const db = getDbReference();
  const studentsCollection = db.collection('students');
  const usersCollection = db.collection('users');

  const enrolledStudents = await studentsCollection.findOne({ courseId: courseId });

  if (enrolledStudents) {
    const enrolledUserIds = enrolledStudents.enrolled;

    console.log('Enrolled User IDs:', enrolledUserIds);

    const roster = [];

    for (const userId of enrolledUserIds) {
      console.log('Processing User ID:', userId);


      const newUserId = new ObjectId(String(userId));

      const user = await usersCollection.findOne({ _id: newUserId });

      console.log('Retrieved User:', user);

      if (user) {
        roster.push(user);
      }
    }

    console.log('Final Roster:', roster);

    return roster;
  } else {
    return [];
  }
}
exports.getCourseRoster = getCourseRoster;

async function getCoursesByInstructorId(instructorId) {
  const db = getDbReference();
  const collection = db.collection('courses');

  const courses = await collection.find({ instructorId: instructorId }).toArray();

  return courses;
}
exports.getCoursesByInstructorId = getCoursesByInstructorId;


async function getCoursesByStudentId(studentId) {
  const db = getDbReference();
  const collection = db.collection('courses');

  const courses = await collection.find({ students: studentId }).toArray();

  return courses;
}
exports.getCoursesByStudentId = getCoursesByStudentId;
