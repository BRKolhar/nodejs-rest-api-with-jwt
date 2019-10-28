const userModel = require('../models/users');
const apiLibray = require('../common/api.library');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
module.exports = {
    welcome: function(req, res, next) {

        let clientResponse = apiLibray.responseSuccess(true, 200, 'This is user endpoint...');
        res.json(
            clientResponse
        );

    },
    createUser: function(req, res, next) {

        const name=req.body.name;
        console.log("name"+req.body);
        console.log("name"+name);
        userModel.create(req.body)
            .then(function(newUser) {
                console.log('New User Created!', newUser);
                res.json(newUser);
            })
            .catch(function(err) {
                if (err.name == 'ValidationError') {
                    console.error('Error Validating!', err);
                    res.status(422).json(err);
                } else {
                    console.error(err);
                    res.status(500).json(err);
                }
            })
    },
    authenticate: function(req, res, next) {
        userModel.findOne({
            email: req.body.email
        }, function(err, userInfo) {
            if (err) {
                next(err);
            } else {
                if (bcrypt.compareSync(req.body.password, userInfo.password)) {
                    const token = jwt.sign({
                        id: userInfo._id
                    }, req.app.get('secretKey'), {
                        expiresIn: '1h'
                    });
                    res.json({
                        status: "success",
                        message: "user found!!!",
                        data: {
                            user: userInfo,
                            token: token
                        }
                    });
                } else {
                    res.json({
                        status: "error",
                        message: "Invalid email/password!!!",
                        data: null
                    });
                }
            }
        });
    },
}