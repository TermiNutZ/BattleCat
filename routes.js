
var db = require('./database'),
    photos = db.photos,
    users = db.users;

var path = require('path'),
    fs = require('fs');
var url = require("url");

//get number of round
function getRound(length)
{
    var round = "1/64";
    if (length <= 32) round = "1/32";
    if (length <= 16) round = "1/16";
    if (length <= 8)  round = "QuarterFinal";
    if (length <= 4)  round = "SemiFinal";
    if (length <= 2)  round = "Final";
    return round;
}

module.exports = function(app) {

    // homepage

    app.get('/', function(req, res) {
        res.redirect('/tournament');
    });


    app.get('/tournament', function(req, res) {

        // find all photos
        var tournamentSize = 8;
        photos.find({type: "kitten"}, function(err, all_kittens) {
            // find the current user
            users.find({ip: req.ip}, function(err, u) {

                var fightKittens = [];

                if (u.length == 1) {
                    fightKittens = u[0].battle;
                }

                if (fightKittens.length == 0)
                {
                    all_kittens.sort( function() { return 0.5 - Math.random() } );
                    fightKittens = all_kittens.slice(0, tournamentSize);
                }

                if (fightKittens.length == 1)
                {
                    return res.redirect('/winner?winner=' + fightKittens[0].name);
                }

                console.log(fightKittens.length);

                //get round
                var round = getRound(fightKittens.length);
                // find which photos the user hasn't still voted on

                var leftKitten = fightKittens[0]; fightKittens.shift();
                var rightKitten = fightKittens[0]; fightKittens.shift();


                users.update({ip: req.ip}, {$set: {battle: fightKittens}});

                //send the two pics to the home page
                res.render('home', {photo1: leftKitten, photo2: rightKitten, header: round});
            });
        });
    });



    // register the user in the database by ip address; doesnt work on heroku
    app.get('*', function(req, res, next) {
        users.insert({
            ip: req.ip,
            battle: []
        }, function() {
            // pass to next middleware
            next();
        });

    });

    app.get('/new_game', function(req, res) {

        var _get = url.parse(req.url, true).query;
        //get winner photo name
        var count = _get['count'];
        console.log(count);

        photos.find({type: "kitten"}, function(err, all_kittens) {
            // find the current user
            users.find({ip: req.ip}, function(err, u) {

                var fightKittens = [];

                all_kittens.sort( function() { return 0.5 - Math.random() } );
                fightKittens = all_kittens.slice(0, count);


                users.update({ip: req.ip}, {$set: {battle: fightKittens}});
                res.redirect('/tournament');
            });
        });

    });


    app.get('/winner', function(req, res) {

        var _get = url.parse(req.url, true).query;

        var winner = _get['winner'];

        photos.findOne({name: winner}, function(err, found1) {
            console.log(found1);
            res.render('winner', {photo: found1.name, header: "Winner!", kittenName: found1.kittenName});
        });
    });




    app.get('/score', function(req, res) {

        var _get = url.parse(req.url, true).query;
        //get winner photo name
        var winner = _get['winner'];
        //get loser photo name
        var loser = _get['loser'];
        console.log(_get);
        console.log(loser);

        var winner_rating = 0;
        var loser_rating = 0;
        var winnerAdjustment = 0;
        var loserAdjustment = 0;
        var k = 20;

        //find winner ratings
        photos.findOne({name: winner}, function(err, found1) {



            winner_rating = found1.ratings;



            //find loser ratings
            photos.findOne({name: loser}, function(err, found2) {



                loser_rating = found2.ratings;

                //Elo's rating algorithm
                winnerExpected = 1 / (1 + (Math.pow(10, (loser_rating - winner_rating) / 400)));
                loserExpected = 1 / (1 + (Math.pow(10, (winner_rating - loser_rating) / 400)));



                winnerAdjustment = Math.round(winner_rating + (k * (1 - winnerExpected)));
                loserAdjustment = Math.round(loser_rating + (k * (0 - loserExpected)));




                photos.find({name: winner}, function(err, found_win) {

                    if (found_win.length == 1) {
                        //update new winner ratings
                        photos.update(found_win[0], {$set: {ratings: winnerAdjustment}}, function(err) {
                            //mark photo voted by user
                            users.update({ip: req.ip}, {$addToSet: {battle: found1}}, function(err) {
                                photos.find({name: loser}, function(err, found_los) {
                                    if (found_los.length == 1) {
                                        //update new loser ratings
                                        photos.update(found_los[0], {$set: {ratings: loserAdjustment}}, function(err) {
                                            res.redirect('/tournament');
                                        });
                                    }
                                });
                            });
                        });
                    }
                });

            });
        });
    });


    app.get('/standings', function(req, res) {

        photos.find({type: "kitten"}).sort({ratings: -1}).exec(function(err, all_photos) {


            // render the standings page and pass the photos
            res.render('standings', {standings: all_photos});

        });
    });

    app.get('/upload', function(req,res){
        res.render('upload');
    });



    app.post('/upload', function (req, res) {
            console.log('lol');
            console.log(req.body);
            var fstream;
            req.pipe(req.busboy);
            req.busboy.on('file', function (fieldname, file, filename) {
                console.log("Uploading: " + filename);

                //Path where image will be uploaded
                fstream = fs.createWriteStream(__dirname + '/public/kittens/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    console.log("Upload Finished of " + filename);
                });

                fstream = fs.createWriteStream(__dirname + '/public/photos/' + filename);
                file.pipe(fstream);
                fstream.on('close', function () {
                    console.log("Upload Finished of " + filename);

                    photos.insert({
                        name: filename,
                        ratings: 1400,
                        type: "kitten",
                        kittenName: "Simon's Cat"
                    });
                    res.redirect('/standings#'+filename);
                });
            });

        });
};
