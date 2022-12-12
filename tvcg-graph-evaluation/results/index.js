import { parse } from 'csv-parse';
import { createReadStream, createWriteStream } from 'fs';
import * as assert from 'node:assert/strict';
import { parseArgs } from "node:util";
import { argv } from 'process';

const {
    values: { filename, type },
} = parseArgs({
    options: {
        filename: {
            type: "string",
            short: "f",
        },
        type: {
            type: "string",
            short: "t",
        },
    },
    args: argv.slice(2),
    strict: true,
});

const techniqueMap = new Map();

techniqueMap.set('', 'MJP');
techniqueMap.set('', 'MANC');
techniqueMap.set('', 'NLJP');
techniqueMap.set('', 'NLANC');

const answerMap = new Map();

answerMap.set('Strongly Disagree', '1');
answerMap.set('Disagree', '2');
answerMap.set('Somewhat Disagree', '3');
answerMap.set('Neither Disagree nor Agree', '4');
answerMap.set('Somewhat Agree', '5');
answerMap.set('Agree', '6');
answerMap.set('Strongly Agree', '7');
answerMap.set('Not Applicable', '0');

main();

function parseCombined(record) {
    console.log(record);
    const [question, answer, count] = record;
    const newRecord = [question, answer, count];
    return newRecord;
};

function parseIndividual(record) {
    const [question, answer, count] = record;
    const newRecord = [question, answer, count];
    return newRecord;
}

function main() {
    console.log(`Parsing CSV file...${filename} with ${type} flag`);

    const input = createReadStream(`./csvs/${filename}`);
    const output = createWriteStream(`./csvs/${filename.split('.')[0]}-${type}-parsed.csv`, { flags: 'w', encoding: 'utf-8' });

    const parser = parse({ delimiter: ',' });
    let data = [];

    let parsed = [];

    input
        .pipe(parser)
        .on('data', function (row) {
            data.push(row);
        })
        .on('end', function () {
            if (type === 'combined') {
                parsed = parseCombined(data);
            } else {
                parsed = parseIndividual(data);
            }

            output.write(parsed);
        })
        .pipe(output)
        .on('finish', function () {
            console.log('Done! 💪 Check the output file.');
        });
}


