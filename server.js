// updated for hw4

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var jwt = require('jsonwebtoken');
var cors = require('cors');
const mongoose = require('mongoose');
//var http = require('https');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
                }
            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, username: userNew.username, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});

// update the route with movie ID
router.route('/movies/:_ID')
    .put(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params._ID;
        Movie.findById(id, function (err, movie) {
            if (err) res.send(err);

            if (req.body.Title) {
                movie.Title = req.body.Title;
            }
            if (req.body.Year) {
                movie.Year = req.body.Year;
            }
            if (req.body.Genre) {
                movie.Genre = req.body.Genre;
            }
            if (req.body.Actors) {
                movie.Actors = req.body.Actors;
            }
            if (req.body.imageUrl){
                movie.imageUrl = req.body.imageUrl;
            }

            movie.save(function (err) {
                if (err) {
                    return res.send(err);
                }
                res.json({success: true, message: 'The movie has been updated'});
            });
        })
    })

    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params._ID;
        Movie.findById(id, function(err, movie) {
            if (err) res.send(err);

            //var movieJson = JSON.stringify(movie);
            // return that user
            res.json(movie);
        });
    });


router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {

        if (req.query.reviews === 'true'){
            Movie.aggregate([
                {
                    "$lookup":
                        {
                            from: "reviews",
                            localField: "Title",
                            foreignField: "movieTitle",
                            as: "movieReviews"
                        }
                }
            ]).exec((err, moviesReview) => {
                if (err) res.json({message: "Failed"});
                res.json(moviesReview);
            })
        }
        else {   // else the review query not set to true, just return the movie without the review
            Movie.find(function (err, moviesFound) {
                if (err) res.send(err);

                if (moviesFound == null) {
                    res.status(400);
                    res.json({success: false, message: "The movies is not in the database."});
                }

                else {
                    res.json(moviesFound)
                }
            })
        }
    })

    .delete(authJwtController.isAuthenticated, function (req, res){

        Movie.findOneAndDelete({Title: req.body.Title}, function(err, movie){
            if (err) {   // if an error happens within the findOneAndDelete function
                res.send(err);
            }
            else if (movie == null){   // if the movie Title doesn't exist
                res.status(400).send({success: false, message: 'Movie doesnt exist.'})
            }
            else{   // the movie has been deleted
                res.status(200).send({success: true, message: 'Movie Deleted.'});
            }
        });
    })

    .post(authJwtController.isAuthenticated,function (req, res) {
        // the rest of the error messages are generated from the MovieSchema via the "require: true" statement
        // except for this one.
        // todo : put this validation in the movie schema instead of here
        if(req.body.Actors.length < 3) {
            res.json({success: false, message: 'Please pass at least three actors.'})
        }

        else{
            var movieNew = new Movie();
            movieNew.Title = req.body.Title;
            movieNew.Year = req.body.Year;
            movieNew.Genre = req.body.Genre;
            movieNew.Actors = req.body.Actors;
            movieNew.imageUrl = req.body.imageUrl;

            // save the movie
            movieNew.save(function(err) {
                if (err) {
                    //duplicate entry
                    if (err.code == 11000)
                        return res.json({ success: false, message: 'A movie with that title already exists. '});
                    else
                        return res.send(err);
                }
                else {
                    res.json({success: true, message: 'New movie created!'});
                }
            });
        }
    });

router.route('/reviews')
    .post(authJwtController.isAuthenticated,function (req, res) {
        // Todo: check reviewer name is in database?
        if (!req.body.reviewerName) {
            res.json({success: false, message: "username required"})
        }
        else if (!req.body.movieTitle) {
            res.json({success: false, message: "Review must have a title."})
        } else if (!req.body.rating) {
            res.json({success: false, message: "Review must have a rating."})
        } else if (req.body.rating < 1 || req.body.rating > 5) {
            res.json({success: false, message: "Rating must be between 1 and 5 stars."})
        } else
            Movie.findOne({Title: req.body.movieTitle}).select('Title').exec(function (err, movieFound) {
                if (err) res.send(err);

                if (movieFound) {
                    var reviewNew = new Review();
                    reviewNew.reviewerName = req.body.reviewerName;
                    reviewNew.movieTitle = req.body.movieTitle;
                    reviewNew.review = req.body.review;
                    reviewNew.rating = req.body.rating;

                    // save the movie
                    reviewNew.save(function (err) {
                        if (err) {
                            return res.send(err);
                        } else {
                            res.json({success: true, message: 'New review created!'});
                        }
                    })
                } else {
                    //var movieTitle = req.body.movieTitle.replace(/\//g, '')
                    res.status(400);
                    res.json({message: "The movie \'" + req.body.movieTitle + "\' does not exist in the database."});
                }
            })
    });

router.route('/reviews')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var title = req.body.Title;

        if (req.query.reviews === 'true'){

            Movie.findOne({Title: req.body.Title}).select('Title').exec(function (err, movieFound) {
                if (err) res.send(err);

                else if(movieFound)
                {
                    Movie.aggregate([
                        {
                            $match: {
                                Title: title
                            }
                        },
                        {
                            "$lookup":
                                {
                                    from: "reviews",
                                    localField: "Title",
                                    foreignField: "movieTitle",
                                    as: "movieReviews"
                                }
                        }
                    ]).exec((err, movieReview) => {
                        if (err) res.json({message: "Failed"});
                        res.json(movieReview);
                    })

                }
                else {res.status(400);
                    res.json({success: false, message: "The movie '" + title + "' is not in the database."});
                }
            });
        }

        else {   // else the review query not set to true, just return the movie without the review
                Movie.findOne({Title: title}).exec(function (err, movieFound) {
                    if (err) res.send(err);

                    if (movieFound == null) {
                            res.status(400);
                            res.json({success: false, message: "The movie '" + title + "' is not in the database."});
                    }

                    else {
                        res.json(movieFound)
                    }
                })
            }
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
