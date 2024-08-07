var express = require("express");
const { generateResponse, grabWordFromCambridge } = require("../utils/utils");
var router = express.Router();
const qrcode = require("qrcode");

const Parser = require("@postlight/parser");
const { default: axios } = require("axios");

router.get("/index", async function (req, res, next) {
  qrcode.toDataURL(
    "https://stylishreader.com",
    { version: 7 },
    function (err, url) {
      res.render("index", { title: url });
    }
  );
});

router.post("/grab", async function (req, res, next) {
  let word = req.body.word;
  let t = await grabWordFromCambridge(word);
  res.send(generateResponse(t));
});

router.get("/test", async function (req, res, next) {
  let url = `https://www.chinadaily.com.cn/a/202402/21/WS65d5e80aa31082fc043b85d4.html`;

  const customExtractor = {
    domain: "www.chinadaily.com.cn",
    title: {
      selectors: [],
    },
    author: {
      selectors: [".info_l"],
    },
    content: {
      selectors: ["#Content"],
    },
  };
  Parser.addExtractor(customExtractor);
  let r = await Parser.parse(url);
  res.send(generateResponse(r));
});

module.exports = router;
