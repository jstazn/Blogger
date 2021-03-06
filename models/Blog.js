const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const currentDate = Date.now
//ref users refers to users model which allows us to know what came from which user (ie the blog or the likes)
const BlogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    header: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    picture: {
        type: String
    },
    postedOn: {
        type: Date,
        default: currentDate
    },
    lastEdited: {
        type: Date,
        default: currentDate
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    likes: [
        {
            user: {
                type: Schema.Types.ObjectId,
                ref: 'users'
            }
        }
    ]

})

module.exports = Blog = mongoose.model('blog', BlogSchema)
