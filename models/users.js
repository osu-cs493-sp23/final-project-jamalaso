const { getDbReference } = require('../lib/mongo')
const bcrypt = require('bcryptjs');


const UserSchema = {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'instructor', 'student'],
    },
};
exports.UserSchema = UserSchema



async function insertUser(user) {
    const db = getDbReference();
    const collection = db.collection('users');
    const result = await collection.insertOne(user);
    return result.insertedId;
}

exports.insertUser = insertUser;



async function getAllUsers() {
    const db = getDbReference();
    const collection = db.collection('users');
    const results = await collection.find().toArray();
    return results;
}
exports.getAllUsers = getAllUsers;



async function getUserById(id) {
    const db = getDbReference();
    const collection = db.collection('users');

    const user = await collection.findOne(
        { _id: id },
        { projection: { password: 0 } }
    );
    console.log(user)
    return user;
}
exports.getUserById = getUserById;



async function getUserByEmail(email) {
    const db = getDbReference();
    const collection = db.collection('users');

    const user = await collection.findOne({ email });
    return user;
}
exports.getUserByEmail = getUserByEmail;



exports.validateUser = async function (email, password) {
    const user = await getUserByEmail(email, true)
    return user && await bcrypt.compare(password, user.password)
}



