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

const answerMap = new Map();

answerMap.set('Strongly Disagree', '1');
answerMap.set('Disagree', '2');
answerMap.set('Somewhat Disagree', '3');
answerMap.set('Neither Disagree nor Agree', '4');
answerMap.set('Somewhat Agree', '5');
answerMap.set('Agree', '6');
answerMap.set('Strongly Agree', '7');
answerMap.set('Not Applicable', '0');

const questionCat = new Map();

questionCat.set('The visualization exposes individual data cases and their attributes', 'Insight');
questionCat.set('The visualization facilitates perceiving relationships in the data like patterns & distributions of the variables', 'Insight');
questionCat.set('The visualization promotes exploring relationships between individual data cases as well as different groupings of data cases', 'Insight');
questionCat.set('The visualization helps generate data-driven questions', 'Insight');
questionCat.set('The visualization helps identify unusual or unexpected, yet valid, data characteristics or values', 'Insight');
questionCat.set('The visualization provides useful interactive capabilities to help investigate the data in multiple ways', 'Insight');
questionCat.set('The visualization shows multiple perspectives about the data', 'Insight');
questionCat.set('The visualization uses an effective representation of the data that shows related and partially related data cases', 'Insight');

questionCat.set('The visualization uses meaningful and accurate visual encodings to represent the data', 'Confidence');
questionCat.set('The visualization avoids using misleading representations', 'Confidence');
questionCat.set('If there were data issues like unexpected, duplicate, missing, or invalid data, the visualization would highlight those issues', 'Confidence');

questionCat.set('The visualization provides a comprehensive and accessible overview of the data', 'Essence');
questionCat.set('The visualization presents the data by providing a meaningful visual schema', 'Essence');
questionCat.set('The visualization facilitates generalizations and extrapolations of patterns and conclusions', 'Essence');

questionCat.set('The visualization provides a meaningful spatial organization of the data', 'Time');
questionCat.set('The visualization shows key characteristics of the data at a glance', 'Time');
questionCat.set('The visualization supports smooth transitions between different levels of detail in viewing the data', 'Time');
questionCat.set('The visualization avoids complex commands and textual queries by providing direct interaction with the data representation', 'Time');


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
                    category: questionCat.get(header.split('[')[0].trim())
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
                    category: questionCat.get(header.split('[')[0].trim())
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
                    category: questionCat.get(header.split('[')[0].trim())
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
                    category: questionCat.get(header.split('[')[0].trim())
                })
            }
        }
    });
    return results;
};

function parseIndividual(records) {
    let technique = '';
    let results = [];

    records[0].forEach((header, index) => {
        if(records[1][1].includes('Matrix with Juxtaposition')) {
            technique = 'MJP';
            console.log(records.length)
            for (let i = 1; i <= records.length - 1; i++) {
                    if(index <= 1) return;
                    const answerRow = records[i];
                    const answer = answerMap.get(answerRow[index]);
                    results.push({
                        technique: technique,
                        question: header,
                        answerNum: answer,
                        answer: answerRow[index],
                        category: questionCat.get(header.trim())
                    });
                }
        }
        if(records[1][1].includes('Matrix with Animation and Controls')) {
            technique = 'MANC';
            for (let i = 1; i <= records.length - 1; i++) {
        
                const answerRow = records[i];
                    const answer = answerMap.get(answerRow[index]);
                    results.push({
                        technique: technique,
                        question: header,
                        answerNum: answer,
                        answer: answerRow[index],
                        category: questionCat.get(header.trim())
                    });
                }
        }
        if(records[1][1].includes('Node-Link with Juxtaposition')) {
            technique = 'NLJP';
            for (let i = 1; i <= records.length - 1; i++) {
        
                const answerRow = records[i];
                    const answer = answerMap.get(answerRow[index]);
                    results.push({
                        technique: technique,
                        question: header,
                        answerNum: answer,
                        answer: answerRow[index],
                        category: questionCat.get(header.trim())
                    });
                }
        }
        if(records[1][1].includes('Node-Link with Animation and Controls')) {
            technique = 'NLANC';
            for (let i = 1; i <= records.length - 1; i++) {
        
                const answerRow = records[i];
                    const answer = answerMap.get(answerRow[index]);
                    results.push({
                        technique: technique,
                        question: header,
                        answerNum: answer,
                        answer: answerRow[index],
                        category: questionCat.get(header.trim())
                    });
                }
        }
    });
    return results;
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
                    throw err;
                }

                // write CSV to a file
                fs.writeFileSync(`./csvs/${filename.split('.')[0]}-${type}-parsed.csv`, csv);
            });
        })
}