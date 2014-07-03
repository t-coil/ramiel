var client = require("socket.io-client"),
	fs = require("fs"),
	sys = require("sys"),
	exec = require("child_process").exec;


var connection = client.connect("http://192.168.1.39:9000");

var ildProject;
var fileName;
var oldfileName;

var runCommands = function(fileName){


	if(fileName.slice(-5) === ".jpeg") {
		var withoutFileType = fileName.slice(0, -5);
		console.log("jpeg");
	} else {
		var withoutFileType = fileName.slice(0, -4);
	}

	var bmp = withoutFileType + ".bmp",
		svg = withoutFileType + ".svg",
		bmpIld = withoutFileType + ".bmp.ild";

	//Check if there's already a projection running.
	if(typeof ildProject !== 'undefined') {
		// Kill last projection
		ildProject.kill();
		console.log("killed");
		// Delete last projection's file.
		exec("rm "+ oldfileName + ".bmp " + oldfileName + ".bmp.ild " + oldfileName + ".svg", function() {
			console.log("old file deleted");
		});
	};

	oldfileName = withoutFileType;

	console.log(withoutFileType);

	var convertExec = "convert " + fileName + " -contrast -contrast -colorspace Gray -negate -edge 1 -negate "+ bmp;
	console.log(convertExec);

	exec(convertExec, function() {
		console.log("Finished conversion...");
		var vectorExec = "potrace " + bmp + " -o" + svg;
		
		exec(vectorExec, function() {
			console.log("Finished vectorize...");
			var bmpExec = "convert " + svg + " " + bmp;

			exec(bmpExec, function() {
				console.log("Finished bmp convert...");
				var ildExec = "wine 'C:/Program Files (x86)/AutoHotkey/AutoHotkey.exe' convert2bmp.ahk";

				exec(ildExec, function() {
					console.log("Finished ild convert. Running...");
					var playExec = "playilda "+ bmpIld;
					ildProject = exec(playExec);
				});
			});
		});
	});
}

connection.on('fileUploaded', function(data) {
	console.log('Image Found');
	fs.writeFile(data.filename, data.buffer, function(err) {
		if(err) throw err;
		
		fileName = data.filename;
		runCommands(fileName);
	});
});