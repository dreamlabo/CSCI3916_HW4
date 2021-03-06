var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);


// Review schema
var ReviewSchema = new Schema({
    reviewerName: { type: String, required: [true, "A user name is required"], index: { unique: false }},
    movieTitle: {type: String, required: [true, "Review must have a title attached."]},
    review: { type: String, required: false},
    rating: {type: Number, required: [true, "User must supply a rating between 1 and 5 stars"]},

});


// return the model
module.exports = mongoose.model('Review', ReviewSchema);