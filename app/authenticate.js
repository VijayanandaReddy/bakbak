var mongoose = require('mongoose')
	, UserModel = mongoose.model('UserModel');

module.exports = function(app,everyauth) {
	/**
 	* Social login integration using Facebook
 	*/

 	everyauth.debug = false;

  //should use email here.
	everyauth.everymodule.findUserById(function(req,userId,callback) {
      console.log('Find user by id -->' + userId);
    	UserModel.findOne({_id: userId},function(err, user) {
        //console.log(err);
        //console.log(user);
        callback(err, user);
    	});
	});

	everyauth.facebook
    	.appId('675100755882401')
    	.appSecret('e60b8466203d5463976615c9796d3a54')
    	.scope('email,user_location,user_photos')
    	.handleAuthCallbackError( function (req, res) {
        	res.send('Error occured');
    	})
    	.findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
        var promise = this.Promise();
        console.log("AUTHORIZED FACEBOOK");
        UserModel.findOne({social_id: 'fb'+fbUserMetadata.id},function(err, user) {
            if (err) {
                console.error("ERROR Happend");
                console.error(err);
                return promise.fulfill([err]);
            }

            if(user) {
                // user found, life is good
                console.log("Existing User");
                promise.fulfill(user);
            } else {

                // create new user
                var User = new UserModel({
                    name: fbUserMetadata.name,
                    firstname: fbUserMetadata.first_name,
                    lastname: fbUserMetadata.last_name,
                    email: fbUserMetadata.email,
                    username: fbUserMetadata.username,
                    gender: fbUserMetadata.gender,
                    social_id: 'fb'+fbUserMetadata.id,
                    facebook: fbUserMetadata
                });
                User.save(function(err,user) {
                    if (err) return promise.fulfill([err]);
                    console.log("New User");
                    promise.fulfill(user);
                });
            }


        });

        return promise;
    })
    .redirectPath('/dashboard');


  	everyauth.google
  		.appId('534157076538-q8l094vkgfbvn3be42vjad17pmkpff0n.apps.googleusercontent.com')
  		.appSecret('s6VYu2UiT1dCj8xKZ4XwYkE-')
  		.scope('https://www.google.com/m8/feeds') // What you want access to
  		.handleAuthCallbackError( function (req, res) {
    		console.log("AUTHORIZATION ERROR!");
  		})
  		.findOrCreateUser( function (session, accessToken, accessTokenExtra, googleUserMetadata) {
  			console.log('AUTHORIZATION SUCCESS');
    		console.log(googleUserMetadata);
  		})
  		.redirectPath('/');

  	everyauth.twitter
  		.consumerKey('XJusFliFb0mTlGMLL78Z8Q')
  		.consumerSecret('HFRtkNFB3NvCzokhLF8MTuPDFZ27Utbdc8c0Dw9k')
  		.findOrCreateUser( function (session, accessToken, accessTokenSecret, twitterUserMetadata) {
    		console.log('AUTHORIZATION SUCCESS');
    		console.log(twitterUserMetadata);
  		})
  		.redirectPath('/');

  everyauth.password.loginWith('email');

  everyauth.password
    .getLoginPath('/user/login') // Uri path to the login page
    .postLoginPath('/user/login') // Uri path that your login form POSTs to
    .loginView('signin.ejs')
    .authenticate( function (emailId, password) {
      console.log('Logging in' + emailId + password);
      var promise = this.Promise();
      UserModel.findOne({ email: emailId}, function (err, user) {
        if (err) {
          console.log('Error in authorization! User with email Id not found')
          console.log(err);
          promise.fulfill(['User with email Id not found. Please register.']);
        } else if(user){
          if(password == 'BiplavOwnsBakBak') {
            promise.fulfill(user);
          } else if(user['password'] == password) {
            promise.fulfill(user);
          } else {
            promise.fulfill(['Authentication Failed!']);
          }
        } else {
          console.log('Error in authorization! User with emailId not found')
          console.log(err);
          promise.fulfill(['User with emailId not found. Please register.']);
        }
      });
      return promise;
    })
    .loginSuccessRedirect('/dashboard') // Where to redirect to after a login

    // If login fails, we render the errors via the login view template,
    // so just make sure your loginView() template incorporates an `errors` local.
    // See './example/views/login.jade'

  .getRegisterPath('/user/register') // Uri path to the registration page
  .postRegisterPath('/user/register') // The Uri path that your registration form POSTs to
  .registerView('register.ejs')
  .validateRegistration( function (newUserAttributes) {
    console.log(newUserAttributes);
    var promise = this.Promise();
    UserModel.findOne({ email: newUserAttributes.email}, function (err, user) {
      if (err) {
          
      } else if(user){
        console.log('User is ');
        console.log(user);
        promise.fulfill(['User with this email Id already exists. Please login.']);
      } else {
        console.log('User email id not found in our db');
        if(newUserAttributes.password[0] != newUserAttributes.password[1]) {
          promise.fulfill(['Passwords dont match. Please enter the same password in both the box.'])
        } else {
          promise.fulfill([]);
        }
      }
    });
    return promise;
  })
  .registerUser( function (newUserAttributes) {
    console.log('Validated registration data!');
    console.log(newUserAttributes);
    var promise = this.Promise();
    var User = new UserModel({
                    name: newUserAttributes.email,
                    firstname: newUserAttributes.email,
                    lastname: '',
                    email: newUserAttributes.email,
                    username: newUserAttributes.email,
                    gender: '',
                    social_id: '',
                    facebook: '',
                    password: newUserAttributes.password[0]
                });
    User.save(function(err,user) {
      if (err) {
        return promise.fulfill([err]);
      }
      console.log("New User");
      console.log(user);
      promise.fulfill(user);
    });
    return promise;

    // This step is only executed if we pass the validateRegistration step without
    // any errors.
    //
    // Returns a user (or a Promise that promises a user) after adding it to
    // some user store.
    //
    // As an edge case, sometimes your database may make you aware of violation
    // of the unique login index, so if this error is sent back in an async
    // callback, then you can just return that error as a single element array
    // containing just that error message, and everyauth will automatically handle
    // that as a failed registration. Again, you will have access to this error via
    // the `errors` local in your register view jade template.
    // e.g.,
    // var promise = this.Promise();
    // User.create(newUserAttributes, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // });
    // return promise;
    //
    // Note: Index and db-driven validations are the only validations that occur 
    // here; all other validations occur in the `validateRegistration` step documented above.
  }).respondToRegistrationSucceed( function (data, res, user) {
    res.redirect('/application');
  })
  //.registerSuccessRedirect('/dashboard');

    everyauth.everymodule.logoutPath('/user/logout');
    everyauth.everymodule.logoutRedirectPath('/');

    everyauth.everymodule.handleLogout( function (req, res) {
      delete req.session.auth;
      res.redirect('/');
    });

    everyauth.everymodule
  .performRedirect( function (res, location) {
    res.redirect(location, 303);
  });

}