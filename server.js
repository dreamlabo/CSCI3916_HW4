

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
//var http = require('https');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });
    });
});


router.route('/movies')
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

app.use('/', router);
app.listen(process.env.PORT || 8080);
