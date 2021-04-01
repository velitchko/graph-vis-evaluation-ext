//Install express server
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ResultModel = require('./results');

const app = express();
const router = express.Router();

// parse application/json
app.use(bodyParser.json())

// Serve only the static files form the dist directory
app.use(express.static(__dirname + '/dist/graph-evaluation-two'));

app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname + '/dist/graph-evaluation-two/index.html'));
});

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

mongoose.connect('mongodb+srv://velitchko:mebehere@cluster0.dhrbg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority')

router.post('/results', function(request, response) {
    let survey_id = request.body.survey_id;
    let time = request.body.time;

    let newResult = new ResultModel();

    newResult.survey_id = survey_id;
    newResult.time = time;

    newResult.save(function(err) {
        if(err) console.log(err);
    });

    response.json({ status: 200, message: "OK" });
});

app.use('/api', router);

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);