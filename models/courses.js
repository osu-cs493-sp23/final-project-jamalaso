const { getDbReference } = require('../lib/mongo')
const { ObjectId } = require('mongodb');
const fs = require("node:fs")


const CourseSchema = {
  subject: { type: String, required: true },
  number: { type: String, required: true },
  title: { type: String, required: true },
  term: { type: String, required: true },
  instructorId: { type: Number, required: true }
};

exports.CourseSchema = CourseSchema;

async function getAllCourses(page) {
  const db = getDbReference();
  const collection = db.collection('courses');

  const count = await collection.countDocuments();
  const pageSize = 5;
  const lastPage = Math.ceil(count / pageSize);
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({})
    .project({ students: 0, assignments: 0 })
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
    links: {
      nextPage: page < lastPage ? `/courses?page=${page + 1}` : null,
      lastPage: page > 1 ? `/courses?page=${page - 1}` : null
    }
  };
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

  const course = await collection.findOne({ _id: new ObjectId(id) });
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

  const students = await collection.find({ enrolled: courseId }).toArray();
  return students;
}
exports.getCourseStudents = getCourseStudents;


async function addEnrolledStudents(courseId, studentId) {
  console.log("===studentId:", studentId)
  console.log("===studentId2:", new ObjectId(studentId))
  const db = getDbReference();
  const students = db.collection('students');

  const existingStudent = await students.findOne({ _id: new ObjectId(studentId) });

  if (existingStudent) {
    await students.updateOne(
      { _id: new ObjectId(studentId) },
      { $addToSet: { enrolled: courseId } }
    );
  } else {
    await students.insertOne({
      _id: new ObjectId(studentId),
      enrolled: [courseId]
    });
  }
}
exports.addEnrolledStudents = addEnrolledStudents;


async function removeEnrolledCourse(courseId, studentId) {
  console.log("===studentId:", studentId)
  console.log("===studentId2:", new ObjectId(studentId))
  const db = getDbReference();
  const students = db.collection('students');

  const existingStudent = await students.findOne({ _id: new ObjectId(studentId) });

  if (existingStudent) {
    await students.updateOne(
      { _id: new ObjectId(studentId) },
      { $pull: { enrolled: courseId } }
    );
    return 0;
  } else {
    return 1;
  }
}
exports.removeEnrolledCourse = removeEnrolledCourse;


async function getCourseRoster(courseId) {
  const db = getDbReference();
  const studentsCollection = db.collection('students');
  const usersCollection = db.collection('users');
  
  // const enrolledStudents = await studentsCollection.find({ courseId: courseId }).project({ _id: 1 }).toArray();
  const matchingStudents = await studentsCollection
    .find(
      { enrolled: { $in: [courseId] } },
      { _id: 1 } // Projection to include only the _id field
    )
    .toArray();

  // Extract the _id field from each matching student
  const studentIds = matchingStudents.map(student => student._id);

  const roster = [];

  for (const studentId of studentIds) {
    console.log("==== studentId:", studentId);
    const user = await usersCollection.findOne(
      { _id: new ObjectId(studentId) },
      { projection: { _id: 1, name: 1, email: 1 } }
    );
  
    if (user) {
      roster.push(user);
    }
  }

  console.log(" =====roster:", roster)
  return roster;
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
