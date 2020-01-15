class BasicLine {
    constructor(lineNumber, lineString) {
        this._lineNumber = lineNumber;
        this._lineString = lineString;
    }    
    
    get lineNumber() { return this._lineNumber; }

    get lineString() { return this._lineString; }
    set lineString(newLineString) { this._lineString = newLineString; }

    set newLineNumber(newLineNumber) { this._newLineNumber = newLineNumber; }
    get newLineNumber() { return this._newLineNumber; }

    get newLineString() { return this.newLineNumber + ' ' + this.lineString; }
}

function Renumber(lines) {
    lines.forEach(line => {
        // https://regex101.com/r/Izi7x3/8
        // another algo for ON xx GOTO ON xx GOSUB (should run first)
        var match = /on\ +[^:]+\ +(?:goto|gosub)(?:\ +([\d,\ ]+))/gi;
        let gonum = line.lineString.match(match);
        if (gonum != null && gonum.length > 0) {
            for (var x = 0; x < gonum.length; x++) {
                var matches = [...gonum[x].matchAll(/\d+/g)];
                for (const m of matches.reverse()) {
                    let lineNumberToReplace = m[0];
                    let lineNumberIndex = m.index;
                    let lineNumberLength = lineNumberToReplace.length;
                    let newLineNumber = GetNewLineNum(lines, lineNumberToReplace);
                    if (newLineNumber === -1) {
                        // This shouldn't not happen anymore as we do not call renumber if the document is invalid
                        continue;
                    }                    
                    line.lineString = line.lineString.substring(0, lineNumberIndex) + newLineNumber + line.lineString.substring(lineNumberIndex + lineNumberLength);
                }
            }
        }
        else {
            // https://regex101.com/r/Sb7Vgf/1
            var match = /(?:goto|gosub|restore|then|else)\ +\d+/gi;
            let gonum = line.lineString.match(match);
            if (gonum != null && gonum.length > 0) {
                for (var x = 0; x < gonum.length; x++) {
                    var m = gonum[x].match(/\d+/);
                    for (var y = 0; y < m.length; y++) {
                        let lineNumberToReplace = m[y];
                        let newLineNumber = GetNewLineNum(lines, lineNumberToReplace);
                        if (newLineNumber === -1) {
                            // This shouldn't not happen anymore as we do not call renumber if the document is invalid
                            continue;
                        }
                        let newgonum = gonum[x].replace(lineNumberToReplace, newLineNumber);
                        line.lineString = line.lineString.replace(gonum[x], newgonum);
                    }

                }
            }
        }
    });
    return lines;
}

function GetNewLineNum(lines, originalLineNumber) {
    var newLineNumber = -1;
    lines.forEach(line => {
        if (line.lineNumber == originalLineNumber) {
            newLineNumber = line.newLineNumber;
        }
    });
    return newLineNumber;
}

exports.BasicLine = BasicLine;
exports.Renumber = Renumber;