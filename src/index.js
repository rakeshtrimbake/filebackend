const express = require("express");
var app = express();
const mysql = require("mysql");
var multer = require("multer");
var cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
app.use(cors());
app.use(express.json());
const connect = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "fileupload",
});

connect.connect(function(err) {
  if (err) throw err;
  console.log("Database Connected!");
});


const PORT = process.env.PORT || 4000;
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage }).single("file");

app.post("/upload", async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    const path = "./src/" + req.file.originalname;
    const stat = fs.statSync(path);
    const size = stat["size"];
    var shasum = crypto.createHash("sha1");
    var read = fs.ReadStream(path);
    read.on("data", function (d) {
      shasum.update(d);
    });
    read.on("end", function () {
      var sha1 = shasum.digest("hex");
      fs.unlinkSync("./src/" + req.file.originalname);
      var data = "INSERT INTO filedata(fileSize,sha1_format)values(?,?)";
      let values = [size, sha1];
      connect.query(data, values, function (err, result) {
        try {
          res.send({
            id: result.insertId,
            fileSize: size,
            sha1_format: sha1,
          });
        } catch (error) {
          res.status(500).send(error);
        }
        
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ` + PORT);
});
