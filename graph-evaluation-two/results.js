const mongoose = require('mongoose');
const { Schema } = mongoose;

const resultSchema = new Schema({
    survey_id: String, 
    question_id: String,
    zooms: Number,
    drags: Number,
    interactions: [{
        interaction_type: String,
        time: Number
    }]
});

module.exports = ResultModel = mongoose.model('ResultModel', resultSchema );
