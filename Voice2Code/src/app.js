'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const { GoogleSheetsCMS } = require('jovo-cms-googlesheets');

const fs = require('fs');
const log = require('fancy-log');
const chalk = require('chalk');
const chalkAnimation = require('chalk-animation');
const gradient = require('gradient-string');
const simpleTimestamp = require('simple-timestamp');
const path = require('path'); // folder operations
const opn = require('opn'); // open the browser
var email = require('emailjs/email'); // send an email
const chokidar = require('chokidar')
var dir = require('node-dir');

var attachmentsPath = path.resolve('../../Sketch2Code.Web/Content/email-attachments');
var destinationPath = '../../Sketch2Code.Web/Content/generated/';
var updatedFolder =null
var updatedfileName =null

const app = new App();

app.use(
    new Alexa(),
    new GoogleAssistant(),
    new JovoDebugger(),
    new FileDb(),
    new GoogleSheetsCMS()

);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    LAUNCH() {
        this.ask(this.t('welcome.speech'));

//        return this.toIntent('CheckEmails');
    },

    WelcomeIntent() {
        this.ask(this.t('waiting'));
    },
    CheckEmails() {
        checkForEmails()
        let speech = this.speechBuilder()
            .addText(this.t('checking.emails'))
            .addAudio('https://s3.ap-south-1.amazonaws.com/voice2code/checkemails.mp3')
            .addBreak('300ms')
            .addText(this.t('completed.emails'));

        this.ask(speech, this.t('waiting'));

    },
    ConvertImageToCode() {
        //this.ask(this.t('voice2code.success'));
        //this.ask('ConvertImageToCode', 'ConvertImageToCode.');
        getLastUpdatedFolder({ directory: attachmentsPath }, (
            lastUpdatedFolder = null) => {
            updatedFolder = lastUpdatedFolder
            console.log("#### lastUpdatedFolder = " +
                lastUpdatedFolder);
            invokeSketch2Code(lastUpdatedFolder);
        });

        let speech = this.speechBuilder()
            .addText(this.t('process.voice2code'))
            .addAudio('https://s3.ap-south-1.amazonaws.com/voice2code/mainaction.mp3')
            .addBreak('300ms')
            .addText(this.t('voice2code.success'));
        this.ask(speech, this.t('waiting'));

    },

   
});


var downloadEmailAttachments = require('download-email-attachments');

async function checkForEmails() {
    emptyFolder(attachmentsPath, false)
    downloadEmailAttachments({
        account: '"shivasdemo@gmail.com":Samaveda-1@imap.gmail.com:993',
        directory: '../../Sketch2Code.Web/Content/email-attachments',
        filenameTemplate: '{filename}',
        timeout: 2000,
        searchFilter: [
            ["UNSEEN"]
        ], // the search filter being used after an IDLE notification has been retrieved
        markSeen: true, // all fetched email willbe marked as seen and not fetched next time
        log: {
            warn: console.warn,
            debug: console.info,
            error: console
                .error,
            info: console.info
        },
        since: '2019-02-08',
        attachmentHandler: function (attachmentData, cbfun, errorCB) {
            cbfun()
        }
    });
    //sleep(6000)



}

function isAnImage(data) {
    if (data.contentType.includes("image/gif") || data.contentType.includes(
        "image/jpeg") || data.contentType.includes("image/png") || data
            .contentType.includes("image/jpg")) {
        return true
    }
    return false
}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

function emptyFolder(dirPath, removeSelf) {
    if (removeSelf === undefined)
        removeSelf = true;
    try { var files = fs.readdirSync(dirPath); }
    catch (e) { return; }
    if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
            var filePath = dirPath + '/' + files[i];
            if (fs.statSync(filePath).isFile())
                fs.unlinkSync(filePath);
            else
                emptyFolder(filePath);
        }
    if (removeSelf)
        fs.rmdirSync(dirPath);
};

async function sendEmail() {

    var server = email.server.connect({
        user: "shivasdemo@gmail.com", // enter your gmail id
        password: "Samaveda-1", // gmail password
        host: "smtp.gmail.com",
        ssl: true
    });

    // send the message and get a callback with an error or details of the message that was sent
    server.send({
        text: "Hi , Please find attached html file and image from Voice2Code",
        from: "Voice2Code <Voice2Code@gmail.com>",
        to: "shivasdemo@gmail.com", // receipient's email id 
        //cc:      "else <else@your-email.com>",
        subject: "[ Voice-2-ToCode: HTML Created...Cool!]",
        attachment: [
            {
                data: "Hi , <br/> <br/> Please find attached generated HTML file and its  image from Voice2Code!  <br/> <br/> Thanks <br/> Voice2Code",
                alternative: true
            },
            {
                path: attachmentsPath +'/' + updatedFolder + "/" + updatedfileName,
                type: "image/png",
                name: "ScreenShot.png"
            },
            {
                path: destinationPath + "result.html",
                type: "text/html",
                name: "index.html"
            },

        ]
    }, function (err, message) { console.log(err || message); });
}




function getLastUpdatedFolder({ directory }, callback) {
    console.log(" getLastUpdatedFolder Start==>")
    fs.readdir(directory, (_, dirlist) => {
        const latest = dirlist.map(_path => ({
            stat: fs.lstatSync(path.join(
                directory, _path)),
            dir: _path
        }))
            .filter(_path => _path.stat.isDirectory())
            //.filter(_path => extension ? _path.dir.endsWith(`.${extension}`) : 1)
            .sort((a, b) => b.stat.mtime - a.stat.mtime)
            .map(_path => _path.dir);
        callback(latest[0]);
    });
    console.log(" getLastUpdatedFolder End<==")
}

// KEY CODE INVOCATIONS  

function invokeSketch2Code(lastUpdatedFolder) {
    console.log(" invokeSketch2Code Start==>");
    //joining path of directory 
    const directoryPath = attachmentsPath + "/" + lastUpdatedFolder;
    //passsing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        //listing all files using forEach
        files.forEach(function (file) {
            updatedfileName = file;
            // Do whatever you want to do with the file
            if (file.includes("jpg") || file.includes("png") || file
                .includes("jpeg") || file.includes("gif")) {
                console.log("#### FileName = " + file);
                file = file.replace(".", "_");
                // empty the folder since the new html and image will be downloaded here
                emptyFolder(destinationPath, false)
                opn("http://localhost:34188/app/step2fromsample/" +
                    lastUpdatedFolder + "-" + file);

                // Watch for the folder and send email 
                chokidar.watch(path.resolve(destinationPath), { ignored: /(^|[\/\\])\../ }).on(
                    'add', (event, path) => {
                        console.log(event);
                        sendEmail();
                    });

            }
        });
    });
    console.log(" invokeSketch2Code End<==");
}

module.exports.app = app;
