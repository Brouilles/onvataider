// When create a user
Accounts.onCreateUser((options, user) => {
  user.profile = options.profile || {};
  user.profile.companyName = null;
  user.profile.biography = null;
  user.profile.website = null;
  user.profile.facebook = null;
  user.profile.instagram = null;

  user.profile.stripeCustomAccountId = null;
  user.profile.stripeBankId = null;
  user.profile.stripeCustomerKey = null;

  user.profile.statistics = {};
  user.profile.statistics.projectsCreated = 0;

  user.profile.billing = options.profile.billing || {};
  user.profile.billing.address = null;
  user.profile.billing.address_two = null;
  user.profile.billing.city = null;
  user.profile.billing.state = null;
  user.profile.billing.zip = null;
  user.profile.billing.country = null;

  return user;
});


Accounts.validateLoginAttempt((info) => {
  if (info.user === undefined) { return false; }

  // Check if ban
  if (Roles.userIsInRole(info.user._id, 'ban')) { return false; }

  return true;
});
