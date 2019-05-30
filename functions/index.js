const functions = require('firebase-functions');
var express = require('express');
//var bodyParser = require('body-parser');
var firebase = require('firebase/app');
var admin = require('firebase-admin');
var cfg = require("../../config.js")
var serviceAccount = require("../../firmareklam-565d1-firebase-adminsdk-6dmk9-2300f59de0.json");
var firebaseConfig = cfg.firebaseConfig;
require('firebase/firestore');
require('firebase/database');

const app = express();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://firmareklam-565d1.firebaseio.com"
});
var dbRef = admin.database().ref("Reklam");
var userRef = admin.database().ref("User");

var newReklam = (l_name, l_lat, l_long, l_type, l_date) => {
    var newRef;
    dbRef.limitToLast(1).on('value', function(snapshot) {
        var id = 1;
        if(snapshot.exists()) {
            for(var obj in snapshot.toJSON()) {
    			id = snapshot.toJSON()[obj].firmaID;
    			break;
            }
            id= id+1;
        }
        console.log("not exists")
        console.log("id: " + id);
        dbRef.off();
        newRef = dbRef.push({
            firmaID: id,
            firmaAdi: l_name,
            firmaLokasyon: l_lat+","+l_long,
            kampanyaIcerik: l_type,
            kampanyaSure: l_date
        });
    });
}

var newUser = (l_name, l_password) => {
	var newRef = userRef.push({
		username: l_name,
		password: l_password
	});
};

app.get('/api/list', (req, res) => {
	var result = [];
	dbRef.on("value", function(snapshot) {
		result.push(snapshot.toJSON());
		console.log(result);
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(result));
	});
});

app.get('/api/list/:type', (req, res) => {
	var result = [];
	console.log(req.params.type);
	dbRef.orderByChild("kampanyaIcerik").equalTo(req.params.type).on("value", function(snapshot) {
		result.push(snapshot.toJSON());
		console.log(result);
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(result));
	});
});

app.get('/getInfo/:username/:password', (req, res) => {
	console.log(req.params.username)
	res.setHeader('Content-Type', 'application/json')
	var message = []
	userRef.orderByChild('username').equalTo(req.params.username).on('value', function(snapshot) {
		if(!snapshot.exists()) {
			message.push({message:'error:user not exists'})
			res.end(JSON.stringify(message))
			return;
		}
		password = "";
		for(var obj in snapshot.toJSON()) {
			password = snapshot.toJSON()[obj].password;
			break;
		}
		if(req.params.password === password) {
			var result = [];
			dbRef.on("value", function(snapshot) {
				result.push(snapshot.toJSON());
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(result));
			});
			return;
		}
		else {
			message.push({message:'error:wrong username-password'})
			res.end(JSON.stringify(message))
		}
	});

});

app.get('/getInfo/:username/:password/:type', (req, res) => {
	console.log(req.params.username)
	res.setHeader('Content-Type', 'application/json')
	var message = []
	userRef.orderByChild('username').equalTo(req.params.username).on('value', function(snapshot) {
		if(!snapshot.exists()) {
			message.push({message:'error:user not exists'})
			res.end(JSON.stringify(message))
			return;
		}
		password = "";
		for(var obj in snapshot.toJSON()) {
			password = snapshot.toJSON()[obj].password;
			break;
		}
		if(req.params.password === password) {
			var result = [];
			dbRef.orderByChild("kampanyaIcerik").equalTo(req.params.type).on("value", function(snapshot) {
				result.push(snapshot.toJSON());
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(result));
			});
			return;
		}
		else {
			message.push({message:'error:wrong username-password'})
			res.end(JSON.stringify(message))
		}
	});

});

app.post('/postreklam', (req, res) => {
    newReklam(req.body.fName, req.body.fLat, req.body.fLong, req.body.fType, req.body.fDate);
	res.redirect('/');
});

app.post('/postuser/:username/:password', (req, res) => {
		newUser(req.params.username, req.params.password);
        res.end();
});

app.post('/changepassword/:username/:password', (req, res) => {
    userRef.orderByChild('username').equalTo(req.params.username).on('value', function(snapshot) {
		if(!snapshot.exists()) {
            console.log("not exists");
            res.end();
			return;
		}
        var obj_key;
        for(var obj in snapshot.toJSON()) {
            obj_key = obj;
			break;
		}
		    userRef.off();
            userRef.child(obj_key).set({
                username: req.params.username,
                password: req.params.password
            })
            res.end();
			return;
	});
});

exports.app = functions.https.onRequest(app);
