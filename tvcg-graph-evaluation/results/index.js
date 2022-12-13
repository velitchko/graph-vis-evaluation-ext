import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import fs from 'fs';
import * as assert from 'node:assert/strict';
import { parseArgs } from "node:util";
import { argv } from 'process';
import converter from 'json-2-csv'

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

function parseCombined(records) {
    let results = [];
    // csv headers
    records[0].forEach((header, index) => {
        if (header.includes('Matrix with Juxtaposition')) {
            for (let i = 1; i < records.length - 1; i++) {
                const answerRow = records[i];
                const answer = answerMap.get(answerRow[index]);
                results.push({
                    technique: 'MJP',
                    question: header,
                    answerNum: answer,
                    answer: answerRow[index],
                })
            }
        }

        if (header.includes('Matrix with Animation and Controls')) {
            for (let i = 1; i < records.length - 1; i++) {
                const answerRow = records[i];
                const answer = answerMap.get(answerRow[index]);
                results.push({
                    technique: 'MANC',
                    question: header,
                    answerNum: answer,
                    answer: answerRow[index],
                })
            }
        }

        if (header.includes('Node-Link with Juxtaposition')) {
            for (let i = 1; i < records.length - 1; i++) {
                const answerRow = records[i];
                const answer = answerMap.get(answerRow[index]);
                results.push({
                    technique: 'NLJP',
                    question: header,
                    answerNum: answer,
                    answer: answerRow[index],
                })
            }
        }

        if (header.includes('Node-Link with Animation and Controls')) {
            for (let i = 1; i < records.length - 1; i++) {
                const answerRow = records[i];
                const answer = answerMap.get(answerRow[index]);
                results.push({
                    technique: 'NLANC',
                    question: header,
                    answerNum: answer,
                    answer: answerRow[index],
                })
            }
        }
    });
    return results;
};

function parseIndividual(records) {
    records.forEach((record) => {
        console.log(record);
    });
    return newRecord;
}

function main() {
    console.log(`Parsing CSV file...${filename} with ${type} flag`);

    const input = createReadStream(`./csvs/${filename}`);
    // const output = createWriteStream(`./csvs/${filename.split('.')[0]}-${type}-parsed.csv`, { flags: 'w', encoding: 'utf-8' });

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
            converter.json2csv(parsed, (err, csv) => {
                if (err) {
                    throw err
                }
                // print CSV string
                console.log(csv)

                // write CSV to a file
                fs.writeFileSync(`./csvs/${filename.split('.')[0]}-${type}-parsed.csv`, csv);
            });
        })
    // .pipe(output)
    // .on('finish', function () {
    //     console.log('Done! 💪 Check the output file.');
    // });
}


