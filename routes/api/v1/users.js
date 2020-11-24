const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

//usermodel
const User = require('../../../models/users')

//@route POST api/users
//@desc registers a user with a firstname, lastname, email, and password
//@access public
router.post('/', [
    check('firstName', 'Please enter the first 16 characters of your first name')
        .not().isEmpty()
        .isLength({ max: 16 }),
    check('lastName', 'Please enter the first 16 characters of your last name')
        .not().isEmpty()
        .isLength({ max: 16 }),
    check('email', 'Please enter a valid email')
        .isEmail(),
    check('password', 'Please enter a password with 6-50 characters long')
        .isLength({ min: 6, max: 50 })
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }


        const {firstName, lastName, email, password} = req.body
        
        try {
            //check if user exists
            let user = await User.findOne({ email });
            if (user) {
                //must put return because cannot set headers after sent to client, which is being done at res.send(...)
                console.log(email, 'already exists')
                return res.status(400).json({ errors: [{msg: 'User already exists'}] });
            }

            user = new User({
                firstName,
                lastName,
                email,
                password
            })

            //encrypt password using bcrypt
            //salt does the hashing, 10 is the amount of rounds, more rounds is more secure but more slow
            const salt = await bcrypt.genSalt(10);

            //creates hash and puts it to password
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            //return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }


            //json webtoken with user.id
            //used in headers to access protected routes, used for auth
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token })
                }
            );

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Serve Error')
        }

});

module.exports = router;