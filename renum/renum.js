class BasicLine {
	// object to represent a line of basic code,
	// with original and new line numbers

	constructor(lineNumber, lineString) {
		this._lineNumber = lineNumber;
		this._lineString = lineString;
	}
	set newLineNumber(newLineNumber) {
		this._newLineNumber = newLineNumber;
	}
	set lineString(newLineString) {
		this._lineString = newLineString;
	}
	get lineString() {
		return this._lineString;
	}
	get newLineString() {
		//return the line with new line number
		//if the line doesn't start with a line number, insert the new number
		try {
			parseInt(this.lineString.match(/^\d+/)[0]);
		}
		catch (ex) {
			return this.newLineNumber + ' ' + this.lineString;
		}

		return this.lineString.replace(this.lineNumber, this.newLineNumber);
	}

	get lineNumber() {
		return this._lineNumber;
	}
	get newLineNumber() {
		return this._newLineNumber;
	}
}

function Renumber(lines, keyword) {
	lines.forEach(line => {
		let goto = line.lineString.toUpperCase().indexOf(keyword.toUpperCase());
		if (goto > -1) {
			var match = new RegExp(keyword + '\\ *\\d+', 'gi');
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