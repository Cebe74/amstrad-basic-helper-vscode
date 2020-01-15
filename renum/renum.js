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

function GetNewLineNum(lines, originalLineNumber) {
    var newLineNumber = -1;
    lines.forEach(line => {
        if (line.lineNumber == originalLineNumber) {
            newLineNumber = line.newLineNumber;
        }
    });
    return newLineNumber;
}

function Renumber(lines) {
    lines.forEach(line => {
        // in theory we should differentiate simple jump instructions from ON xx GOTO or ON xx GOSUB instructions
        // but we rely on the fact that we cannot renumber an invalid document by design
        var matches = [...line.lineString.matchAll(/(?:goto|gosub|restore|then|else)(?:\ +[\d,\ ]+)/gi)];
        for (const match of matches.reverse()) {
            var offset = match.index;            
            var lineNumbers = [...match[0].matchAll(/\d+/g)];
            for (const ln of lineNumbers.reverse()) {
                let lineNumberToReplace = ln[0];
                let lineNumberIndex = ln.index + offset;
                let lineNumberLength = lineNumberToReplace.length;
                let newLineNumber = GetNewLineNum(lines, lineNumberToReplace);
                if (newLineNumber === -1) {
                    // This shouldn't not happen anymore as we do not call renumber if the document is invalid
                    continue;
                }
                line.lineString = line.lineString.substring(0, lineNumberIndex) + newLineNumber + line.lineString.substring(lineNumberIndex + lineNumberLength);
            }
        }
    });
    return lines;
}

exports.BasicLine = BasicLine;
exports.Renumber = Renumber;