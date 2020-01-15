const vscode = require('vscode');
const path = require('path');
const renum = require('./renum/renum.js');
const CodeGeneratorJs = require('./cpcBasic/CodeGeneratorJs.js');
const BasicLexer = require("./cpcBasic/BasicLexer.js");
const BasicParser = require("./cpcBasic/BasicParser.js");

const workbenchConfig = vscode.workspace.getConfiguration('amstrad-basic-helper');
var renumIncrement = workbenchConfig.get('renumIncrement');

function updateDiagnostics(document, collection) {
    if (document && path.extname(document.fileName).toUpperCase() == '.BAS') {
        if (!this.oCodeGeneratorJs) {
            this.oCodeGeneratorJs = new CodeGeneratorJs({
                lexer: new BasicLexer(),
                parser: new BasicParser(),
                tron: false
            });
        } else {
            this.oCodeGeneratorJs.reset();
        }

        var text = document.getText();

        var outputVariables = {};

        var output = this.oCodeGeneratorJs.generate(text, outputVariables);
        if (output.error) {
            var outputError = output.error;
            var iStartPos = outputError.pos
            var iEndPos = iStartPos + ((outputError.value !== undefined) ? String(outputError.value).length : 0);

            collection.set(document.uri, [{
                code: '',
                message: `${outputError.message}: '${outputError.value}'`,
                range: new vscode.Range(
                    document.positionAt(iStartPos),
                    document.positionAt(iEndPos)
                ),
                severity: vscode.DiagnosticSeverity.Error,
                source: ''
            }]);
        } else {
            collection.delete(document.uri);
        }
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    const collection = vscode.languages.createDiagnosticCollection('Amstrad Basic');
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(editor => {
        if (editor) {
            updateDiagnostics(editor.document, collection);
        }
    }));

    let renumberMe = vscode.commands.registerCommand('amstrad-basic-helper.renum', function () {
        if (path.extname(vscode.window.activeTextEditor.document.fileName).toUpperCase() == '.BAS') {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Please open an Amstrad Basic document first!');
                return; // No open text editor
            }

            if (collection.has(editor.document.uri)) {
                vscode.window.showErrorMessage('The current Amstrad Basic file has errors and cannot be renumbered!');
                return;
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

                let lineString = line.text.substring(lineNumber.toString().length + 1);
                var l = new renum.BasicLine(lineNumber, lineString);
                linelist.push(l);
            }

            var newLineNumber = renumIncrement;
            linelist.forEach(line => {
                line.newLineNumber = newLineNumber;
                newLineNumber += renumIncrement;
            });

            renum.Renumber(linelist);

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

    context.subscriptions.push(renumberMe);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
