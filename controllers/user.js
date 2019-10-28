const User = require('../models/users');
const {
    normalizeErrors
} = require('../helpers/mongoose');
const jwt = require('jsonwebtoken');
const config = require('../common/env.config');
const {
    Validator
} = require('node-input-validator');
const apiLibray = require('../common/api.library');

exports.register = async function(req, res) {

    const {
        name,
        phoneNumber,
        email,
        password,
        confirmPassword
    } = req.body;
    const inputValidator = new Validator(req.body, 
      {
        name:'required|maxLength:150|minLength:3|regex:[A-Z0-9]',
        phoneNumber:'phoneNumber|maxLength:13|minLength:10',
        email: 'required|email',
        password: 'required|same:confirmPassword',
        confirmPassword: 'required',
      }
    );

    inputValidator.check().then((matched) => {
      // res.status(200).send(matched);

        if (!matched) {
          let inputErrors=inputValidator.errors;
          let clientResponse=apiLibray.responseFailure(false,422,'Validation failed...',inputErrors);
          return res.json(
              clientResponse
          );
        }
    });

    User.findOne({
        email
    }, function(err, existingUser) {
        if (err) {
 
            let errors=normalizeErrors(err.errors);
            let clientResponse=apiLibray.responseFailure(false,422,'Validation failed...',errors);
            return res.json(
                clientResponse
            );
        }

        if (existingUser) {

            let clientResponse=apiLibray.responseFailure(false,422,'Validation failed...','Provided email is already exists...');
            return res.json(
                clientResponse
            );
        }

        const user = new User({
            name,
            email,
            password
        });

        user.save(function(err) {
            if (err) {
              let errors=normalizeErrors(err.errors);
              let clientResponse=apiLibray.responseFailure(false,422,'Validation failed...',errors);
              return res.json(
                clientResponse
              );
            }

            let clientResponse=apiLibray.responseSuccess(true,200,'Success','User has been registered successfully....');
            return res.json(
                clientResponse
            );
        })
    })
}
exports.getUser = function(req, res) {
    const requestedUserId = req.params.id;
    const user = res.locals.user;

    if (requestedUserId === user.id) {
        User.findById(requestedUserId, function(err, foundUser) {
            if (err) {
                return res.status(422).send({
                    errors: normalizeErrors(err.errors)
                });
            }

            return res.json(foundUser);
        })

    } else {
        User.findById(requestedUserId)
            .select('-revenue -stripeCustomerId -password')
            .exec(function(err, foundUser) {
                if (err) {
                    return res.status(422).send({
                        errors: normalizeErrors(err.errors)
                    });
                }

                return res.json(foundUser);
            })
    }
}

exports.auth = function(req, res) {
    const {
        email,
        password
    } = req.body;

    if (!password || !email) {
        return res.status(422).send({
            errors: [{
                title: 'Data missing!',
                detail: 'Provide email and password!'
            }]
        });
    }

    User.findOne({
        email
    }, function(err, user) {
        if (err) {
            return res.status(422).send({
                errors: normalizeErrors(err.errors)
            });
        }

        if (!user) {
            return res.status(422).send({
                errors: [{
                    title: 'Invalid User!',
                    detail: 'User does not exist'
                }]
            });
        }

        if (user.hasSamePassword(password)) {
            const token = jwt.sign({
                userId: user.id,
                name: user.name
            }, config.jwtSecret, {
                expiresIn: '1h'
            });

            return res.json(token);
        } else {
            return res.status(422).send({
                errors: [{
                    title: 'Wrong Data!',
                    detail: 'Wrong email or password'
                }]
            });
        }
    });
}

exports.authMiddleware = function(req, res, next) {
    const token = req.headers.authorization;

    if (token) {
        const user = parseToken(token);

        User.findById(user.userId, function(err, user) {
            if (err) {
                return res.status(422).send({
                    errors: normalizeErrors(err.errors)
                });
            }

            if (user) {
                res.locals.user = user;
                next();
            } else {
                return notAuthorized(res);
            }
        })
    } else {
        return notAuthorized(res);
    }
}

function parseToken(token) {
    return jwt.verify(token.split(' ')[1], config.jwtSecret);
}

function notAuthorized(res) {
    return res.status(401).send({
        errors: [{
            title: 'Not authorized!',
            detail: 'You need to login to get access!'
        }]
    });
}