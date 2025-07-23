const {
  Qualification,
} = require('../../models');

module.exports.educationlist = async (req, res) => {
  try {
    console.log('educationlist');
    const educationlist = await Qualification.find({ status: true });
    if (!educationlist) throw req.ykError('Qualification data not get!');
    return res.send({ status: true, message: 'Qualification data get successfully!', data: { educationlist } });
  } catch (err) {
    return req.errFunc(err);
  }
};


