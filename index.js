var client = require("socket.io-client"),
	fs = require("fs"),
	sys = require("sys"),
	mmm = require("mmmagic"),
	Magic = mmm.Magic,
	exec = require("child_process").exec;


var connection = client.connect("http://ramiel.herokuapp.com");

var ildProject = null;
var timeouts = [];
var fileName;
var oldfileName;

//clean up all old images

exec("rm *.bmp *.bmp.ild *.svg *.png *.jpg *.jpeg", function() {
	console.log("old file deleted");
});

var runCommands = function(fileName){

	var bmp = fileName + ".bmp",
		svg = fileName + ".svg",
		ild = fileName + ".ild";

	//Check if there's already a projection running.
	if(ildProject !== null) {
		// Kill last projection
		ildProject.kill('SIGKILL');
		//this works but delaying until playilda is ready
		exec("killall playilda");
		ildProject = null;
		console.log("killed last projection");
		// Delete last projection's file.
		try{
			fs.unlinkSync(oldfileName+".bmp");
			fs.unlinkSync(oldfileName+".svg");
			fs.unlinkSync(oldfileName+".ild");
		}catch(e){
			console.log(e);
		}
	};

	oldfileName = fileName;

	var convertExec = "convert " + fileName + " -contrast -contrast -colorspace Gray -negate -edge 1 -negate "+ bmp;
	console.log("Finished conversion:" + convertExec);

	exec(convertExec, function(err, data) {
		console.log("Finished conversion: "+ convertExec);
		var vectorExec = "potrace " + bmp + " -s -o " + svg;
		
		exec(vectorExec, function(err, data) {
			console.log("Finished potracing: "+ vectorExec);

			var svgExec = "python svg2ild.py " + svg + " " + ild;

			exec(svgExec, function(err, data) {
				if(err) {
					setTimeout(imageReq, 0);
					console.log("error", err);
				} else {
					console.log("Finished svg convert: "+ svgExec);
					var playExec = "playilda "+ ild + " 40000";
					ildProject = exec(playExec);
				}
				
				timeouts.push(setTimeout(imageReq, 50000));
			});
		});
	});
}


var imageReq = function() {
 clearAllTimeouts();
 connection.emit('imageReq', {}, function(data){
 	console.log('Image Found: '+data.fileName);
 		if(data.fileName){
		 	fs.writeFile(data.fileName, data.buffer, function(err) {
				if(err) throw err;

				fileName = data.fileName;

				var magic = new Magic(mmm.MAGIC_MIME_TYPE);

				var fileType = magic.detectFile(fileName, function(err, result) {
					if (err) throw err;

					console.log(result);

					if (result === "image/gif") {
						setTimeout(imageReq, 10);
						console.log("IT'S A GIF, HIT THE DECK")
					} else {
						runCommands(fileName);
					}
				});
			});
		 }else{
		 	setTimeout(imageReq, 10000);
		 }
 	});
};

clearAllTimeouts = function(){
	timeouts.forEach(clearTimeout);
}

imageReq();