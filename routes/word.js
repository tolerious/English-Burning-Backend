var express = require("express");
const { generateResponse, grabWordFromCambridge } = require("../utils/utils");
const { wordModel } = require("../schemas/wordSchema");
const { wordGroupModel } = require("../schemas/wordGroupSchema");
var router = express.Router();

router.get("/:id", async function (req, res, next) {
  try {
    let t = await wordModel.getWord(req.params.id).exec();
    res.json(generateResponse(t));
  } catch (error) {
    res.json(generateResponse(error, 400, "fail"));
  }
});

router.post("/grab", async function (req, res, next) {
  let word = req.body.word || "";
  let t = await grabWordFromCambridge(word);
  res.send(generateResponse(t));
});

router.get("/only/one", async function (req, res, next) {
  let u = req.tUser;
  let count = await wordModel.count({ creator: u._id });
  let random = Math.floor(Math.random() * Math.floor(count));
  let wordItem = await wordModel.find({ creator: u._id }, null, {
    limit: 1,
    skip: random,
  });
  res.json(generateResponse(wordItem));
});

router.post("/list", async function (req, res, next) {
  let t = await wordModel
    .getWordList(req.body.pageSize, req.body.pageNo)
    .exec();
  let count = await wordModel.getWordListCount();
  res.json(generateResponse({ total: count, list: t }));
});

router.post("/bygroup", async function (req, res, next) {
  let b = req.body;
  if (!b.groupID) {
    res.json(generateResponse('', 400, 'Json format failed.'))
    return
  }
  let n = await wordModel.find({ groupID: b.groupID });
  res.json(generateResponse(n));
});

// 新建单词
router.post("/", async function (req, res, next) {
  const body = req.body;
  console.log(body);
  const groupID = body.groupID;
  const u = req.tUser;
  Object.assign(body, { creator: u._id });
  let groupItem = await wordGroupModel.find({ _id: groupID });
  if (groupItem.length != 1)
    res.json(generateResponse("", 400, "Word group doesn't exist."));
  // 先去查找下这个group下面有没有已经存在该单词了。
  let w = await wordModel.find({ groupID: groupItem[0]._id }).lean()
  w.forEach(item => {
    if (item.wordDetail[0].name === body.wordDetail[0].name) {
      res.json(generateResponse('', 400, 'Word already Exist'))
      return;
    }
  })
  groupItem[0].wordCount++;
  groupItem[0].save();
  const t = await wordModel.create(body);
  res.json(generateResponse(t));
});

router.put("/:id", async function (req, res, next) {
  try {
    let { body } = req;
    let doc = await wordModel.findByIdAndUpdate(body.id, body).exec();
    doc = await wordModel.findById(body.id);
    res.json(generateResponse(doc));
  } catch (error) {
    res.json(generateResponse(error, 400, "fail"));
  }
});

router.delete("/", async function (req, res, next) {
  try {
    let id = req.body.id;
    let groupID = req.body.groupID;
    let group = await wordGroupModel.find({ _id: groupID });
    if (group.length != 1)
      res.json(generateResponse("", 400, "Word group doesn't exist."));
    group[0].wordCount--;
    if (group[0].wordCount < 0) group[0].wordCount = 0;
    group[0].save();
    let doc = await wordModel.findByIdAndDelete(id).exec();
    res.json(generateResponse(doc));
  } catch (error) {
    res.json(generateResponse("", 400, "fail"));
  }
});
module.exports = router;
