const express = require('express');
require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const frontRoutes = require('./front');
const conversionTrakingRoutes = require('./conversionTrackingAPI');
const viewsRoutes = require('./views');
const apiRoutes = require('./api');
const chatRoutes = require('./chat');
const adminRoutes = require('./admin');
const collegeRoutes = require('./college');
const aiRoutes = require('./ai/jobRecommendations');
const botTrainingRoutes = require('./ai/botTraining');
const jobScraperRoutes = require('./ai/jobScraper');
const chatHistoryRoutes = require('./ai/chatHistory');
const { sendMail } = require("../../helpers");
// const companyRoutes = require('./company');
const candidateRoutes = require('./candidate');
const corporateRoutes = require('./corporate');
const { baseUrl } = require("../../config");
const router = express.Router();
const fetch = require("cross-fetch");
const { authChat } = require("../../helpers");
const { updateSpreadSheetRequestCallValues,updateSpreadSheetCarrerValues,updateSpreadSheetLabLeadsValues } = require("./services/googleservice");
const moment = require("moment");
const {uploadSinglefile} = require('./functions/images')
const AppliedCourses = require('../models/appliedCourses');

router.use('/', frontRoutes);
router.use('/', conversionTrakingRoutes);
router.use('/candidate', candidateRoutes);
router.use('/api', apiRoutes);
router.use('/api/ai', aiRoutes); // AI-powered job recommendations
router.use('/api/ai', botTrainingRoutes); // AI bot training data management
router.use('/api/ai', jobScraperRoutes); // LinkedIn job scraping with Anthropic & Google Sheets
router.use('/api/chat', chatHistoryRoutes); // Chat history management
router.use('/candidateForm', viewsRoutes);
router.use('/admin', adminRoutes);
router.use('/college', collegeRoutes);
router.use('/chatapi', authChat, chatRoutes);
// router.use('/panel/company', companyRoutes);
router.use('/company', corporateRoutes);
router.get('/policy', async (req, res) => {
  try {
    return res.render(`${req.vPath}/front/policy`);
  } catch (err) {
    req.session.formData = req.body;
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('back');
  }
});
router.post('/contact', async (req, res) => {
  try {

    console.log('api hitting')
    const { name, mobile, email, message } = req.body;
    if (!name || !mobile || !email || !message) {
      req.flash("success", "Please fill all fields");
      return res.redirect("/contact");
    }
    let response_key = req.body["g-recaptcha-response"];
    if (Array.isArray(response_key)) {
      response_key = response_key[0];
    }

    console.log('response_key',response_key)
    // Put secret key here, which we get from google console
    const secret_key = "6Lej1gsqAAAAADDB6EA8QfiRcJdgESc4UBMqOXeq";

    const url =
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
    fetch(url, {
      method: "post",
    })
      .then((response) => response.json())
      .then((google_response) => {
        console.log('====================> ', google_response)
        if (google_response.success == true && google_response.score >= 0.5) {
          let subject = " New message Received";
          let msg = `<html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
            <div>
            <table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                      <tbody> 
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellspacing="0" style="width: 600px; ">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                                  <table border="0" cellspacing="0" cellpadding="0 ="
                                                      style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                      <tbody>
                                                          <tr>
                                                              <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                                  valign="top">
                                                                  <a>
                                                                      <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                          style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                                  <br/>
                                                                  <p
                                                                      style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                      You have received a new message with the following details:- </p>
                                                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                              User Name:- ${name} (${mobile}) </span></li>
                                                                      <br/>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                              : ${email}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Message : ${message}
                                                                          </span></li>
                                                                      <br/>
                                                                      
                                                                  </ul>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
          </div>
          </body>
          </html>
          
                `;

          sendMail(subject, msg, 'info@focalyt.com');


          req.flash("success", "Message sent successfully!");
          return res.redirect("/contact");
        } else {
          req.flash("success", "Captcha  failed");
          return res.redirect("/contact");
        }
      })
      .catch((error) => {
        // Some error while verify captcha
        return res.json({ error });
      });
  } catch (err) {
    console.log("error is ", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});


router.post('/labs', async (req, res) => {
  try {

    const { name, designation, organisation, state, mobile, email, message } = req.body;
    console.log("Form Data:", req.body);
    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };
    const sheetData = [
      moment(new Date()).utcOffset('+05:30').format('DD/MM/YYYY'),
      moment(new Date()).utcOffset('+05:30').format('hh:mm A'),

      capitalizeWords(organisation), // Apply the capitalizeWords function
      capitalizeWords(name),
      capitalizeWords(designation),
      mobile,
      email,
      state,
      message


    ];
    console.log(sheetData)
    await updateSpreadSheetLabLeadsValues(sheetData);
    if (!name || !designation || !organisation || !state || !mobile || !email || !message) {
      req.flash("success", "Please fill all fields");
      return res.redirect("/labs");
    }



    let subject = " Future Technology Labs: New Demo Request";
    let msg = `<html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
            <div>
            <table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                      <tbody> 
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellspacing="0" style="width: 600px; ">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                                  <table border="0" cellspacing="0" cellpadding="0 ="
                                                      style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                      <tbody>
                                                          <tr>
                                                              <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                                  valign="top">
                                                                  <a>
                                                                      <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                          style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                                  <br/>
                                                                  <p
                                                                      style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                      You have received a new message with the following details:- </p>
                                                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                  <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Organisation
                                                                              : ${organisation}</span>
                                                                      </li>    
                                                                  <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                              User Name:- ${name} (${mobile}) </span></li>
                                                                      <br/>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Designation
                                                                              : ${designation}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                              : ${email}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">State
                                                                              : ${state}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Message : ${message}
                                                                          </span></li>
                                                                      <br/>
                                                                      
                                                                  </ul>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
          </div>
          </body>
          </html>
          
                `;
    sendMail(subject, msg, 'b2gfieldsales@focalyt.com');

    req.flash("success", "Message sent successfully!");
    // return res.redirect("/futureTechnologyLabs");
    res.send(`
              <script>
                alert('Message sent successfully!');
                window.location.href = '/labs';
              </script>
            `);



  } catch (err) {
    console.log("error is ", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});
router.post('/courses', async (req, res) => {
  try {

    const { name, state, mobile, email, message } = req.body;
    console.log("Form Data:", req.body);
    // Capitalize every word's first letter

    if (!name || !state || !mobile || !email || !message) {
      req.flash("success", "Please fill all fields");
      return res.redirect("/courses");
    }
    const response_key = req.body["g-recaptcha-response"];
    console.log(response_key)
    // Put secret key here, which we get from google console
    const secret_key = "6Lej1gsqAAAAADDB6EA8QfiRcJdgESc4UBMqOXeq";

    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };
    const sheetData = [
      moment(new Date()).utcOffset('+05:30').format('DD/MM/YYYY'),
      moment(new Date()).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(name),

      mobile,
      email,
      state,
      message


    ];
    await updateSpreadSheetRequestCallValues(sheetData);



    const url =
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret_key}&response=${response_key}`;
    fetch(url, {
      method: "post",
    })
      .then((response) => response.json())
      .then((google_response) => {
        console.log('====================> ', google_response)
        if (google_response.success == true && google_response.score >= 0.5) {
          let subject = "Call Back Request for Course Lead";
          let msg = `<html lang="en">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
            <div>
            <table border="0" cellpadding="0" cellspacing="0" style="height: 100%; width: 100%;">
                      <tbody> 
                          <tr>
                              <td align="center" valign="top">
                                  <table border="0" cellspacing="0" style="width: 600px; ">
                                      <tbody>
                                          <tr>
                                              <td align="center" valign="top" style="font-family:'Manrope',sans-serif!important">
                                                  <table border="0" cellspacing="0" cellpadding="0 ="
                                                      style="background-color: #F4F3F3; border-radius: 4px; overflow: hidden; text-align: center; width: 620px;">
                                                      <tbody>
                                                          <tr>
                                                              <td style="background-color:#FC2B5A;color:#ffffff!important"
                                                                  valign="top">
                                                                  <a>
                                                                      <img src="${baseUrl}/images/logo/logo.png" alt="pic"
                                                                          style="position: relative; background-color: #FC2B5A; display: block; margin: 40px auto 0; width: 170px!important;background-repeat: no-repeat;padding-bottom: 50px; ">
                                                                  </a>
                                                              </td>
                                                          </tr>
                                                          <tr>
                                                              <td align="left" style="font-family:'Manrope',sans-serif!important">
                                                                  <br/>
                                                                  <p
                                                                      style="text-align:left;line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important;margin:10px 50px 21px">
                                                                      You have received a new message with the following details:- </p>
                                                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                                                   
                                                                  <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;font-size:18px!important;font-family:'Manrope',sans-serif!important">
                                                                              User Name:- ${name} (${mobile}) </span></li>
                                                                      <br/>
                                                                     
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Email
                                                                              : ${email}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">State
                                                                              : ${state}</span>
                                                                      </li>
                                                                      <li style="padding-top:0px;margin-left:0px !important"><span
                                                                              style="line-height:32px;color:#4d4d4d;font-size:18px!important;font-family:'Manrope',sans-serif!important">Message : ${message}
                                                                          </span></li>
                                                                      <br/>
                                                                      
                                                                  </ul>
                                                              </td>
                                                          </tr>
                                                          
                                                      </tbody>
                                                  </table>
                                              </td>
                                          </tr>
                                      </tbody>
                                  </table>
                              </td>
                          </tr>
                      </tbody>
                  </table>
          </div>
          </body>
          </html>
          
                `;
          sendMail(subject, msg, 'info@focalyt.com');

          req.flash("success", "Message sent successfully!");
          // return res.redirect("/futureTechnologyLabs");
          res.send(`
              <script>
                alert('Message sent successfully!');
                window.location.href = '/courses';
              </script>
            `);
        } else {
          req.flash("success", "Captcha  failed");
          return res.redirect("/courses");
        }
      })
      .catch((error) => {
        // Some error while verify captcha
        return res.json({ error });
      });
  } catch (err) {
    console.log("error is ", err);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.post('/callback', async (req, res) => {
  try {
    const { name, courseName, sectorName, projectName, typeOfProject, state, mobile, email, message } = req.body;
    console.log("Form Data:", req.body);

    if (!name || !sectorName || !projectName || !typeOfProject || !state || !mobile || !email || !message) {
      req.flash("error", "Please fill all fields");
      return res.redirect("/courses");
    }

    function capitalizeWords(str) {
      if (!str) return '';

      // ✅ If str is an array, pick the first element
      if (Array.isArray(str)) {
        str = str[0] || '';
      }

      // ✅ Ensure it's a string before proceeding
      if (typeof str !== 'string') return '';

      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }


    const sheetData = [
      moment(new Date()).utcOffset('+05:30').format('DD/MM/YYYY'),
      moment(new Date()).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(name),
      mobile,
      email,
      capitalizeWords(courseName),
      capitalizeWords(sectorName),
      capitalizeWords(projectName),
      typeOfProject,
      state,
      message
    ];

    await updateSpreadSheetRequestCallValues(sheetData);

    let subject = "Call Back Request for Course Lead";
    let msg = `
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div>
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                <td align="center">
                  <table border="0" cellspacing="0" style="width: 600px;">
                    <tbody>
                      <tr>
                        <td align="center" style="font-family:'Manrope',sans-serif!important">
                          <table border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F3F3; border-radius: 4px; width: 620px;">
                            <tbody>
                              <tr>
                                <td style="background-color:#FC2B5A;color:#ffffff!important" valign="top">
                                  <a>
                                    <img src="${baseUrl}/images/logo/logo.png" alt="pic" style="display: block; margin: 40px auto 0; width: 170px;">
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:'Manrope',sans-serif!important">
                                  <p style="text-align:left;line-height:32px;font-size:18px!important;margin:10px 50px 21px">
                                    You have received a new callback request for course courseName with the following details:
                                  </p>
                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                    <li><span style="line-height:32px;font-size:18px!important;">User Name: ${name} (${mobile})</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Type of Project: ${typeOfProject}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Project Name: ${projectName}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Sector Name: ${sectorName}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Email: ${email}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">State: ${state}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Message: ${message}</span></li>
                                  </ul>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
    `;

    sendMail(subject, msg, 'info@focalyt.com');

    req.flash("success", "Message sent successfully!");
    res.send(`
      <script>
        alert('Message sent successfully!');
        window.location.href = '/courses';
      </script>
    `);

  } catch (err) {
    console.error("Error:", err);
    req.flash("error", "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});
router.post('/career', async (req, res) => {
  try {
    console.log('api hitting')
    const { name, number, location, email, position, experience,  info, termsAccepted } = req.body;
    console.log("Form Data:", req.body);


    if (!name || !number || !location || !email || !position || !experience ||  !info || !termsAccepted) {
      req.flash("error", "Please fill all fields");
    }
    const cvFile = req.files?.cv;
    if (!cvFile) return res.status(400).send("CV file missing");

    const cvUrl = await uploadSinglefile(cvFile); // 👈 Here is the S3 upload

    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    const sheetData = [
      moment(new Date()).utcOffset('+05:30').format('DD/MM/YYYY'),
      moment(new Date()).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(name),
      number,
      email,
      experience,
      position,
      cvUrl,
      info,
      termsAccepted
    ];

    await updateSpreadSheetCarrerValues(sheetData);

    let subject = "Call Back Request for Course Lead";
    let msg = `
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div>
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tbody>
              <tr>
                <td align="center">
                  <table border="0" cellspacing="0" style="width: 600px;">
                    <tbody>
                      <tr>
                        <td align="center" style="font-family:'Manrope',sans-serif!important">
                          <table border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F3F3; border-radius: 4px; width: 620px;">
                            <tbody>
                              <tr>
                                <td style="background-color:#FC2B5A;color:#ffffff!important" valign="top">
                                  <a>
                                    <img src="${baseUrl}/images/logo/logo.png" alt="pic" style="display: block; margin: 40px auto 0; width: 170px;">
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td align="left" style="font-family:'Manrope',sans-serif!important">
                                  <p style="text-align:left;line-height:32px;font-size:18px!important;margin:10px 50px 21px">
                                    You have received a new message with the following details:
                                  </p>
                                  <ul style="list-style-type:none;padding-left:0px;margin:20px 50px">
                                    <li><span style="line-height:32px;font-size:18px!important;">User Name: ${name} (${number})</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Email: ${email}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Position: ${position}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Experience: ${experience}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">CV: ${cvUrl}</span></li>
                                    <li><span style="line-height:32px;font-size:18px!important;">Additional Information: ${info}</span></li>
                                  </ul>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
    `;

    await sendMail(subject, msg, "hrm@focalyt.com", [
      {
        filename: cvFile.name,  // e.g. "Resume.pdf"
        path: cvUrl      // e.g. "https://s3-bucket-url/resume.pdf"
      }
    ]);
    

    req.flash("success", "Message sent successfully!");
    res.send(`
      <script>
        alert('Message sent successfully!');
        window.location.href = '/';
      </script>
    `);

  } catch (err) {
    console.error("Error:", err);
    req.flash("error", "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.get("/appliedDetail", async (req, res) => {
	try {
		const { appliedId } = req.query;
    console.log("req.query", req.query)
		const appliedCourse = await AppliedCourses.findById(appliedId).populate("registeredBy");
		console.log("appliedCourse", appliedCourse)
		res.status(200).json({ status: true, data: appliedCourse });
	} catch (err) {}
});









module.exports = router;
