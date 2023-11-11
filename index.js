const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");

var app = express();
app.use(bodyParser.json());

dotenv.config();

var createAlias;
var deleteAlias;
var updateAlias;
var fetchAlias;

if (!process.env.PORT) {
	throw new Error("Enter a valid port");
}

if (process.env.PERSISTENT === "1") {
	const API = process.env.API;
	const API_KEY = process.env.API_KEY;

	if (API == null || API_KEY == null) {
		throw new Error(
			"API AND API_KEY env vars are required and should not be falsy"
		);
	}

	throw new Error("PERSISTENT is not implemented... yet..."); // TODO: implement data persistence

	createAlias = (alias, value, token) => {};
	deleteAlias = (alias, token) => {};
	updateAlias = (alias, new_value, token) => {};
	fetchAlias = (alias) => {};
} else {
	console.warn("Not using firebase");
	var DATAMAP = new Map();

	createAlias = (alias, value, token) => {
		if (DATAMAP.has(alias)) {
			throw new Error(
				`An alias already exists with the following name: ${alias}`
			);
		}
		DATAMAP.set(alias, { alias: alias, value: value, token: token });
	};
	deleteAlias = (alias, token) => {
		if (!DATAMAP.has(alias)) {
			throw new Error(`Alias '${alias}' does not exist.`);
		}
		if (!(DATAMAP.get(alias).token === token)) {
			throw new Error(`Incorrect token for alias: '${alias}'`);
		}
		DATAMAP.delete(alias);
	};
	updateAlias = (alias, new_value, token) => {
		if (!DATAMAP.has(alias)) {
			throw new Error(`Alias '${alias}' does not exist.`);
		}
		if (!(DATAMAP.get(alias).token === token)) {
			throw new Error(`Incorrect token for alias: '${alias}'`);
		}
		DATAMAP.set(alias, { alias: alias, value: new_value, token: token });
	};
	fetchAlias = (alias) => {
		if (!DATAMAP.has(alias)) {
			throw new Error(`Alias '${alias}' does not exist.`);
		}
		let unsafe = JSON.parse(JSON.stringify(DATAMAP.get(alias)));
		delete unsafe.token;
		return unsafe;
	};
}

app.post("/api/create", function (req, res) {
	if (
		req.body.alias == undefined ||
		req.body.value == undefined ||
		req.body.token == undefined
	) {
		res.status(400);
	} else {
		try {
			createAlias(req.body.alias, req.body.value, req.body.token);
			res.status(200);
			res.json({
				status: "success",
				data: {
					alias: req.body.alias,
					value: req.body.value,
					token: req.body.token,
				},
			});
		} catch (err) {
			res.status(409);
			res.json({
				status: "error",
				message: err.message,
			});
		}
	}
	res.send();
});

app.delete("/api/delete", function (req, res) {
	if (req.body.alias == undefined || req.body.token == undefined) {
		res.status(400);
	} else {
		try {
			deleteAlias(req.body.alias, req.body.token);
			res.json({
				status: "success",
				data: {
					alias: req.body.alias,
				},
			});
		} catch (err) {
			res.status(400);
			res.json({
				status: "error",
				message: err.message,
			});
		}
	}
	res.send();
});

app.put("/api/update", function (req, res) {
	if (
		req.body.alias == undefined ||
		req.body.new_value == undefined ||
		req.body.token == undefined
	) {
		res.status(400);
	} else {
		try {
			updateAlias(req.body.alias, req.body.new_value, req.body.token);
			res.json({
				status: "error",
				data: {
					alias: req.body.alias,
					new_value: req.body.new_value,
				},
			});
		} catch (err) {
			res.status(400);
			res.json({
				status: "error",
				message: err.message,
			});
		}
	}
	res.send();
});

app.get("/api/fetch", function (req, res) {
	if (req.query.alias == undefined) {
		res.status(400);
		res.json({
			status: "error",
			message: "Please provide an alias to fetch",
		});
	} else {
		let result;
		try {
			result = fetchAlias(req.query.alias);
			res.status(200);
			res.json({
				status: "success",
				data: {
					alias: req.query.alias,
					value: result,
				},
			});
		} catch (err) {
			res.status(400);
			res.json({
				status: "error",
				message: err.message,
			});
			return;
		}
	}
	res.send();
});

app.listen(process.env.PORT);
