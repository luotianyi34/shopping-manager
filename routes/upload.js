const express = require('express');
const multer = require('multer');
const fs = require('fs')
const router = express.Router();
const result = require("../util/json")
router.post("/", multer({dest: "./tmp"}).single('file'), function (req, res, next) {
    console.log(req.file);
    fs.readFile(req.file.path, function (e, d) {
        let ot = req.file.originalname.split(".");
        let fileType = ot[ot.length - 1];
        let fileName = req.file.filename + "." + fileType;
        fs.writeFile(`./public/upload/${fileName}`, d, function (e) {
            if (e) {
                throw e;
            } else {
                res.json(result.ok(fileName));
            }
        });
    });

});

module.exports = router;
