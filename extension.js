const vscode = require('vscode');
const path = require('path');
const workbenchConfig = vscode.workspace.getConfiguration('amstrad-basic-helper');

var renumIncrement = workbenchConfig.get('renumIncrement');

let orange = vscode.window.createOutputChannel("Amstrad Basic Helper");

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
		let goto = line.lineString.indexOf(keyword);
		if (goto > -1) {
			var match = new RegExp(keyword + '\\ ?\\d+', 'g');
			let gonum = line.lineString.match(match);
			if (gonum != null && gonum.length > 0) {
				for (var x = 0; x < gonum.length; x++) {
					var m = gonum[x].match(/\d+/);
					for (var y = 0; y < m.length; y++) {
						let lineNumberToReplace = m[y];
						let newLineNumber = GetNewLineNum(lines, lineNumberToReplace);
						if (newLineNumber === -1) { 
							orange.appendLine("WARNING - Line: " + lineNumberToReplace + " not found in original line: " + line.lineString + "");
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

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let renumber = vscode.commands.registerCommand('amstrad-basic-helper.renum', function () {
		if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return; // No open text editor
			}

			var linelist = [];

			let edit = new vscode.WorkspaceEdit();
			var ls;

			//build array of old and new line numbers
			for (ls = 0; ls < editor.document.lineCount; ls++) {
				let line = editor.document.lineAt(ls);
				var lineNumber = 1;
				try {
					lineNumber = parseInt(line.text.match(/^\d+/)[0]);
				}
				catch (ex) {

				}

				let lineString = line.text.substring(lineNumber.length);
				var l = new BasicLine(lineNumber, lineString);
				linelist.push(l);
			}

			var newLineNumber = renumIncrement;
			linelist.forEach(line => {
				line.newLineNumber = newLineNumber;
				newLineNumber += renumIncrement;
			});
			
			Renumber(linelist, "GOTO");
			Renumber(linelist, "GOSUB");
			Renumber(linelist, "RESTORE");
			Renumber(linelist, "THEN");
			Renumber(linelist, "ELSE");

			for (ls = 0; ls < linelist.length; ls++) {
				let line = editor.document.lineAt(ls);
				//if (line.text.trimRight().length > 0) {
				//console.log("LINE: " + linelist[ls].newLineString);
				edit.replace(editor.document.uri, line.range, linelist[ls].newLineString);
				//}
			}

			vscode.workspace.applyEdit(edit);
			vscode.window.showInformationMessage('Renum complete!');
		}
	});

	context.subscriptions.push(renumber);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
