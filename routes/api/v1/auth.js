const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')
const auth = require('../../../middleware/auth');
const User = require('../../../models/User')


//@route POST api/users
//@desc registers a user with a firstname, lastname, email, and password
//@access public
router.post('/register', [
    check('firstName', 'Please enter the first 1-16 characters of your first name')
        .not().isEmpty()
        .isLength({ max: 16 }),
    check('lastName', 'Please enter the first 1-16 characters of your last name')
        .not().isEmpty()
        .isLength({ max: 16 }),
    check('email', 'Please enter a valid email')
        .isEmail()
        .isLength({ max: 320}),
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


        //json webtoken which contains the autogenerated _id from mongodb
        //used in headers to access protected routes, used for auth
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token })

            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Serve User Error')
    }

});

//@route POST api/auth
//@desc logging in, authenticate user and get token
//@access 
router.post('/login', [
    check('email', 'Please enter a valid email')
        .isEmail(),
    check('password', 'Password is required')
        .not().isEmpty()
],
async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log({ errors: errors.array() })
        return res.status(400).json({ errors: errors.array() });
    }


    const {email, password} = req.body
    
    try {
        //check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            //must put return because cannot set headers after sent to client, which is being done at res.send(...)
            console.log(email, 'does not exist')
            return res.status(400).json({ errors: [{msg: 'Invalid email or password'}] });
        }

        //compares plaintext to encrypted
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('Invalid Password')
            return res.status(400).json({ errors: [{msg: 'Invalid email or password'}] });
        }

        //return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }


        //expiresin is how long the user stays logged in
        //json webtoken which contains the autogenerated _id from mongodb
        //used in headers to access protected routes, used for auth
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token })
            }
        );

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Serve User Error')
    }

});

//@route Put api/auth/disable
//@desc disables account
//@access 
router.put('/disable', auth, async (req, res)=>{
    try {
        //select('-password') removes user.password from user object
        const user = await User.findById(req.user.id).select('-password');

        user.isDisabled = true

        await user.save();
        res.json({ msg: 'Account Disabled' })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route Put api/auth/enable
//@desc enables account
//@access 
router.put('/enable', auth, async (req, res)=>{
    try {
        //select('-password') removes user.password from user object
        const user = await User.findById(req.user.id).select('-password');

        user.isDisabled = false
        await user.save();

        res.json({ msg: 'Account enabled' })
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route get api/auth/isuser
//@desc checks to see if the token being used belongs to a user
//@access 
router.get('/isuser', auth, async (req, res)=>{
    try {
        //select('-password') removes user.password from user object
        const user = await User.findById(req.user.id).select('-password');

        //console.log(user)
        if (!user) {
            return res.json({ msg: 'Account not found' })
        }

        return res.json({ msg: 'Account found' })
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server Error');
    }
});



//change name method here?

module.exports = router;