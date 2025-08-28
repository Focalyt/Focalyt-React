const express = require("express");
const axios = require("axios");
const jwt = require('jsonwebtoken');

const ObjectId = require("mongodb").ObjectID;
const { verify } = require('jsonwebtoken')
const {
  City,
  AppliedCourses,
  StatusLogs,
  State,
  SubIndustry,
  SubQualification,
  Candidate,
  UserActivityLog,
  User,
  College,
  University,
  Qualification,
  Industry,
  Skill
} = require("../controllers/models");

const { msgApikey, authKey, msg91SmsUrl, jwtSecret, chat_service_api } = require("../config");
const qualification = require("../controllers/models/qualification");
const { default: mongoose } = require("mongoose");

const msg91Options = {
  method: "POST",
  hostname: "api.msg91.com",
  port: null,
  path: "/api/v2/sendsms",
  headers: {
    authkey: msgApikey,
    "content-type": "application/json",
  },
};

const router = express.Router({ mergeParams: true });


module.exports = router;


module.exports.statusLogHelper = async (_id, updatedData = {}) => {
  try {

    const appliedCourse = await AppliedCourses.findById(_id).populate('_course');
    const data = {
      _appliedId: appliedCourse._id,
      _collegeId: appliedCourse._course.college,
      _courseId: appliedCourse._course._id,
      vertical: appliedCourse._course.vertical,
      project: appliedCourse._course.project,
      counsellor: appliedCourse.counsellor,
    }
    Object.keys(updatedData).forEach(key => {
      data[key] = updatedData[key];
    });
    if(appliedCourse.batch){
      data._batchId = appliedCourse.batch._id;
    }
    if(appliedCourse._center){
      data._centerId = appliedCourse._center._id;
    }

    console.log(data, "data");

   
    const newStatusLogs = new StatusLogs(data);
    const savedStatusLogs = await newStatusLogs.save();
    return savedStatusLogs;


  } catch (error) {
    console.error("❌ Error in fetching team members:", error);
    return allUserIds;
  }
}

