const promisify = require('util');
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const methodOverride = require("method-override");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const moment = require("moment");
const flash = require("connect-flash");
const session = require("cookie-session");
const expSanitizer = require("express-sanitizer");
const path = require("path");
const http = require("http");
const fileupload = require("express-fileupload");
const tunnel = require('tunnel-ssh');
const { v4: uuidv4 } = require('uuid');
const axios = require("axios");
const AWS = require('aws-sdk');
const { Server } = require("socket.io");


// cron api 
const missedFollowupSchedular = require("./schedular/missedFollowupSchedular");
missedFollowupSchedular()
// require("./schedular/dataBaseBackup");
//upload('
NODE_TLS_REJECT_UNAUTHORIZED = "0";
const {
	port,
	env,
	mongodbUri,
	ykError,
	cookieSecret,
	msg91AuthKey,
	blackListIps
} = require("./config");

const app = express();
const server = http.createServer(app);

// Socket.io connection

const io = new Server(server, {
	cors: {
	  origin: "*", // sab frontends allow
	  methods: ["GET", "POST"],
	  credentials: true
	},
	transports: ['websocket', 'polling'],
	pingTimeout: 60000,
	pingInterval: 25000,
	upgradeTimeout: 30000
  });
  
  const userSockets = {}; // { userId: [socketId1, socketId2] }

  // Helper function to count total connected sockets
  const getTotalSockets = () => {
	let total = 0;
	for (let userId in userSockets) {
	  total += userSockets[userId].length;
	}
	return total;
  };

  io.on("connection", (socket) => {
	let userId = socket.handshake.query.userId; // frontend se aaya hua

	if(!userId){
		userId = 'guestUser'
	}
  
	if (!userSockets[userId]) userSockets[userId] = [];
	userSockets[userId].push(socket.id);
  
	const totalSockets = getTotalSockets();
	console.log(`✅ Socket.io connected:`);
	console.log(`   - User ID: ${userId}`);
	console.log(`   - Socket ID: ${socket.id}`);
	console.log(`   - Total Sockets: ${totalSockets}`);
	console.log(`   - Total Users: ${Object.keys(userSockets).length}`);
  
	socket.on("disconnect", () => {
	  userSockets[userId] = userSockets[userId].filter(id => id !== socket.id);
	  if (userSockets[userId].length === 0) delete userSockets[userId];
	  
	  const totalSockets = getTotalSockets();
	  console.log(`❌ Socket.io disconnected:`);
	  console.log(`   - User ID: ${userId}`);
	  console.log(`   - Socket ID: ${socket.id}`);
	  console.log(`   - Total Sockets: ${totalSockets}`);
	  console.log(`   - Total Users: ${Object.keys(userSockets).length}`);
	});
  });
  


const sess = {
	maxAge: 1000 * 60 * 60 * 24 * 30,
	keys: [cookieSecret]
};
const viewsPath = path.resolve(__dirname, "views");
// mongoose.set("useNewUrlParser", true);
// mongoose.set("useFindAndModify", false);
// mongoose.set("useCreateIndex", true);
// mongoose.set("useUnifiedTopology", true);
async function connectDB() {
	try {
		await mongoose.connect(mongodbUri, {
			socketTimeoutMS: 300000, // Set timeout if required
		});
		console.log("Connected to MongoDB");
		server.listen(port, () => {
			console.log(`Server running on port ${port}`);
			process.send = process.send || ((f) => f);
			process.send("ready");
		});
	} catch (err) {
		console.error("Error connecting to MongoDB:", err.message);
		process.exit(1); // Exit on connection error
	}
}

connectDB();

mongoose.Promise = global.Promise;

process.on("SIGINT", () => {
	server.close((err) => {
		if (err) process.exit(1);
		mongoose.connection.close(() => process.exit(0));
	});
});

// Middleware to block a specific IP address
const blockIPMiddleware = (req, res, next) => {
	const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress || req.ipAddress;
	let blacklist = blackListIps?.split(',')
	if (blacklist?.includes(ipAddress)) {
		console.log('blacklist=== ', blacklist, ipAddress)
		// IP address is blocked, 
		return res.status(200).send('');
	}

	// IP address is not blocked, proceed to the next middleware or route handler
	next();
};



// Configure AWS SDK
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: 'ap-south-1',
// });

// // Function to check connection
// const checkS3Connection = async () => {
//   try {
//     // List the buckets in your AWS account
//     const buckets = await s3.listBuckets().promise();
//     console.log("S3 Buckets:", buckets.Buckets);

//     // Optional: List objects in your specific bucket
//     const params = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//     };
//     const objects = await s3.listObjectsV2(params).promise();
//     console.log("Objects in Bucket:", objects.Contents);

//     console.log("S3 Connection Successful!");
//   } catch (error) {
//     console.error("Error connecting to S3:", error.message);
//   }
// };

// // Run the function
// checkS3Connection();




app.set("view engine", "ejs");
app.use(blockIPMiddleware);
app.use(express.static(path.resolve(__dirname, "public")));
app.use(session(sess));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "15mb" }));
app.use(expSanitizer());
app.use(methodOverride());
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(flash());
// app.use(fileupload());
app.use((req, res, next) => {
	if (req.path.includes('/whatsapp/send-file') || req.path.includes('/whatsapp/send-audio')) {
		return next();
	}
	fileupload()(req, res, next);
});
app.use((req, res, next) => {
	res.locals.currentUser = req.session.user;
	res.locals.companyUser = req.session.company;
	res.locals.collegeUser = req.session.college;
	res.locals.candidateUser = req.session.candidate;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.info = req.flash("info");
	res.locals.formData = req.session.formData;
	res.locals.moment = moment;
	req.vPath = viewsPath;
	req.errFunc = (error) => {
		let err = error;
		if (typeof error !== "object") err = req.ykError(error);
		let { message } = err;
		if (err.name === "CastError" && err.value === req.params.id)
			message = "Invalid unique ID";
		return res.status(200).send({ status: false, message });
	};
	req.requireFields = (data, obj) => {
		const mFields = Object.keys(obj).filter((x) => !data[x]);
		if (mFields.length === 0) return null;
		return `${obj[mFields[0]]} is required!`;
	};
	req.ykError = ykError;
	req.msg91Options = {
		method: "POST",
		hostname: "api.msg91.com",
		port: null,
		path: "/api/v2/sendsms",
		headers: {
			authkey: msg91AuthKey,
			"content-type": "application/json",
		},
	};
	next();
});

if (env !== "production") app.use(morgan("dev"));
const routes = require("./controllers/routes");
const helperRoutes = require("./helpers");

app.use("/", routes);
app.use("/admin/helper", helperRoutes);
app.use("/panel/helper", helperRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, "/angular-app/")));
// app.use(/^((?!(api|public|helper|app-assets)).)*/, (req, res) => {
//   res.sendFile(path.join(__dirname, '/angular-app/index.html'));
// });

// app.use("/app", (req, res) => {
// 	res.sendFile(path.join(__dirname, "/angular-app/index.html"));
// });

app.get("*", (req, res) =>
	res.status(200).send({ status: false, message: "Page not found!" })
);


global.io = io;
global.userSockets = userSockets;