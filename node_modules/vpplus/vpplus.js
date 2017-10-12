var args = require("minimist")(process.argv ? process.argv.slice(2) : "");
var packageURL = "package.json";
var jsonfile = require("jsonfile");

var colors = require("colors"),
	  action = args ? args._[0] : "";

var packageJSON = jsonfile.readFile(packageURL, function(err, package) {
	var version = decodeVersion(package.version);

	console.log("VPPLUS".blue, ": app name -".green, package.name);

	switch(action){
		case "increase-build":
			version.build++;
		break;
		case "increase-minor":
			version.minor++;
		break;
		case "increase-major":
			version.major++;
		break;
	}

	package.version = encodeVersion(version);

	jsonfile.writeFile(packageURL, package, {spaces: 4}, function(err){
	  	if (err){
	  		console.log(err);
	  	}

	  	console.log("VPPLUS".blue, ": new version -".green, package.version);

	});
});

function decodeVersion(version){
	var split0 = version.split(".");
	var split1 = split0[2].split("-");

	return {
		major : split0[0],
		minor : split0[1],
		build : split1[0],
		type  : split1[1]
	}
}

function encodeVersion(data){
	return data.major + "." + data.minor + "." + data.build + "-" + data.type;
}
