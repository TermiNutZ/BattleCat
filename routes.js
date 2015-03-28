
var db = require('./database'),
        photos = db.photos,
        users = db.users;



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
            res.render('winner', {photo: found1.name, header: "Winner!"});
        });
    });




    app.get('/score/', function(req, res) {

        var _get = url.parse(req.url, true).query;
        //get winner photo name
        var winner = _get['winner'];


        //find winner ratings
        photos.findOne({name: winner}, function(err, found1) {
            users.update({ip: req.ip}, {$addToSet: {battle: found1}}, function()
            {
                res.redirect('/tournament');
            });
        });
    });
};






