var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"];

// user schema
var MovieSchema = new Schema({
    Title: { type: String, required: [true, "A movie title is required"], index: { unique: false }},
    Year: { type: Number, required: [true, "You must enter the year the movie was released."]},
    Genre: { type: String,
             required: true, enum: GENRES},
    Actors:[{ActorName: String, CharacterName: String}],
    imageUrl: {type: String, required: true}
});

MovieSchema.path("Actors").validate(function(actors) {
    //todo: return false if no actors or actors length is less that 3
   return true;
}, "error message to the user");



// return the model
module.exports = mongoose.model('Movie', MovieSchema);