const express = require('express');
const router = express.Router();
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const passport = require('passport');
const validateProfileInput = require('../../validation/profile');

// @route   GET api/profile/test
// @desc    Tests profile route
// @access  Public
router.get('/test', (req, res) => {
	res.json({
		message: 'Profile Works'
	});
});

// @route   GET api/profile
// @desc    Get current user's profile
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => {
	const errors = {};
	Profile.findOne({ user: req.user.id })
		.populate('user', [ 'name', 'avatar' ])
		.then((profile) => {
			if (!profile) {
				errors.noprofile = 'There is no profile for this user';
				return res.status(404).json(errors);
			}
			return res.json(profile);
		})
		.catch((err) => console.log(err));
});

// @route   POST api/profile
// @desc    Create or edit user profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
	const { errors, isValid } = validateProfileInput(req.body);

	// Check Validation
	if (!isValid) {
		// Return any errors with 400 errors
		return res.status(400).json(errors);
	}

	// Get fields
	const profileFields = {};
	profileFields.user = req.user.id;
	if (req.body.handle) profileFields.handle = req.body.handle;
	if (req.body.company) profileFields.company = req.body.company;
	if (req.body.website) profileFields.website = req.body.website;
	if (req.body.status) profileFields.status = req.body.status;

	if (req.body.bio) profileFields.bio = req.body.bio;
	if (req.body.githubUsername) profileFields.githubUsername = req.body.githubUsername;
	if (req.body.experience) profileFields.experience = req.body.experience;

	if (typeof req.body.skills !== 'undefined') {
		// split comma separate value into an array
		profileFields.skills = req.body.skills.split(',');
	}

	// Social
	profileFields.social = {};
	if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
	if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
	if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
	if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
	if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

	Profile.findOne({ user: req.user.id })
		.then((profile) => {
			// Update
			if (profile) {
				Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
					.then((profile) => res.json(profile))
					.catch((err) => console.log(err));
			} else {
				// Create
				// Check if handle exists
				Profile.findOne({ handle: profileFields.handle })
					.then((profile) => {
						if (profile) {
							errors.handle = 'That handle already exists';
							return res.status(400).json(errors);
						}
						// Save Profile
						new Profile(profileFields)
							.save()
							.then((profile) => res.json(profile))
							.catch((err) => console.log(err));
					})
					.catch((err) => console.log(err));
			}
		})
		.catch((err) => console.log(err));
});

module.exports = router;
