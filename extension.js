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

class RunPanel {
    constructor(panel, extensionPath) {
        this._disposables = [];
        this._panel = panel;
        this._extensionPath = extensionPath;

        this._update();

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        }, null, this._disposables);
    }

    static createOrShow(extensionPath) {
        const column = vscode.ViewColumn.Beside;
        // If we already have a panel, show it.
        if (RunPanel.currentPanel) {
            RunPanel.currentPanel._panel.reveal(column, true);
            return;
        }
        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(RunPanel.viewType, "Amstrad Basic Run",
            {
                preserveFocus: true,
                viewColumn: column
            },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.file(path.join(extensionPath, 'cpcBasic'))]
            });
        RunPanel.currentPanel = new RunPanel(panel, extensionPath);
    }

    run(programName, program, reset) {
        reset = (reset === true) ? true : false;
        if (reset) {
            this._panel.title = programName;
        }
        // This is a bit crappy, but this way we check if the running program is the one being updated
        if (this._panel.title === programName) {
            this._panel.webview.postMessage({ name: programName, sourceCode: program, reset: reset });
        }
    }

    dispose() {
        RunPanel.currentPanel = undefined;
        // Clean up our resources
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    _getHtmlForWebview(webview) {
        var scripts = ["BasicLexer.js", "BasicParser.js", "Canvas.js", "CodeGeneratorJs.js", "CommonEventHandler.js", "Controller.js", "CpcVm.js", "Keyboard.js", "Model.js", "Random.js", "Sound.js", "Utils.js",
            "View.js", "cpcCharset.js", "cpcconfig.js", "cpcbasic.js"];

        var scriptBlock = "";

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        scripts.forEach(script => {
            // Local path to main script run in the webview
            var scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'cpcBasic', script));
            // And the uri we use to load this script in the webview
            var uri = webview.asWebviewUri(scriptPathOnDisk);
            scriptBlock += `<script nonce="${nonce}" src="${uri}"></script>`;
        });

        var html = `<!DOCTYPE html>
        <html>
        <head>
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval'; style-src ${webview.cspSource};"/>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="cpcbasic.css" />
        <title id="title">CPC Basic v0.6</title>
        </head>
        
        <body>
            <fieldset class="flexBox clearLeft" id="cpcAreaBox">
                <legend>
                    <span id="cpcLegend" class="legendButton" title="Show/Hide CPC">CPC BASIC By Marco Vieth</span>
                    <button id="parseRunButton" title="Compile and run script">Run</button>
                    <button id="stopButton" title="Stop/escape/break running script" disabled>Break</button>
                    <button id="continueButton" title="Continue script" disabled>Continue</button>
                    <button id="resetButton" title="Reset CPC">Reset</button>
                    <button id="soundButton" title="Sound on/off">Sound is off</button>
                    <input  id="syncButton" type="checkbox" title="When set, program is reset and run at each keystroke">Auto-sync</input>
                </legend>
                <div id="cpcArea" class="area">
                    <canvas id="cpcCanvas" width="640" height="400"></canvas>
                </div>
            </fieldset>
            <fieldset class="flexBox">
                <legend>
                    <span id="resultLegend" class="legendButton" title="Show/Hide BASIC Console">Console</span>
                </legend>
                <div id="resultArea" class="area" hidden>
                    <textarea id="resultText" placeholder="" rows="12" cols="40" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
                </div>
            </fieldset>
            <fieldset class="flexBox">
                <legend>
                    <span id="variableLegend" class="legendButton" title="Show/Hide Variables">Variables</span>
                </legend>
                    <div id="variableArea" class="area" hidden>
                    <div class="field">
                        <select id="varSelect" title="Select variable">
                        </select>
                    </div>
                    <div class="clearLeft">
                        <textarea id="varText" placeholder="value" rows="12" cols="40" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
                    </div>
                </div>
            </fieldset>
            <fieldset class="flexBox clearLeft" id="consoleBox" hidden>
                <legend id="consoleLegend" class="legendButton" title="Show/Hide Console log">Console log</legend>
                <div id="consoleArea" class="area">
                    <textarea id="consoleText" rows="12" cols="40"></textarea>
                </div>
            </fieldset>
            <input type="hidden" id="inputText"></input>
            <input type="hidden" id="outputText"></input>
            ${scriptBlock}
            <script nonce="${nonce}">
            // Handle message inside the webview
            window.addEventListener('message', event => {
                const program = event.data;
                document.getElementById("inputText").value = program.sourceCode;
                document.getElementById("outputText").value = "";
                if (program.reset || document.getElementById('syncButton').checked) {                                        
                    console.log('RUN"' + program.name + '"');
                    cpcBasic.controller.fnReset();
                    setTimeout(() => {
                        cpcBasic.controller.fnParseRun();    
                    }, cpcBasic.controller.oVm.vmGetTimeUntilFrame() + 100); // wait until next frame + 5 full frames (50 Hz => 20 ms)
                } else {
                    console.log('LOAD"' + program.name + '"');
                }
            });
            // On load
            cpcBasic.fnOnLoad();
            cpcBasic.controller.fnReset();
            cpcBasic.controller.fnRun();
            </script>
        </body>
        </html>`;
        return html;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
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

            if (RunPanel.currentPanel) {
                var programName = path.parse(editor.document.fileName).base;
                var program = editor.document.getText();
                RunPanel.currentPanel.run(programName, program, false);
            }
        }
    }));

    let renumberMe = vscode.commands.registerCommand('amstrad-basic-helper.renum', function () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Please open an Amstrad Basic document first!');
            return; // No open text editor
        }

        if (path.extname(editor.document.fileName).toUpperCase() == '.BAS') {
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
                edit.replace(editor.document.uri, line.range, linelist[ls].newLineString);
            }

            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Renum complete!');
        }
    });

    context.subscriptions.push(vscode.commands.registerCommand('amstrad-basic-helper.run', () => {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('Please open an Amstrad Basic document first!');
            return; // No open text editor
        }

        if (path.extname(editor.document.fileName).toUpperCase() == '.BAS') {
            if (collection.has(editor.document.uri)) {
                vscode.window.showErrorMessage('The current Amstrad Basic file has errors and cannot be run!');
                return;
            }

            var programName = path.parse(editor.document.fileName).base;
            var program = editor.document.getText();
            RunPanel.createOrShow(context.extensionPath);
            RunPanel.currentPanel.run(programName, program, true);
        }
    }));

    context.subscriptions.push(renumberMe);
}
exports.activate = activate;

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
