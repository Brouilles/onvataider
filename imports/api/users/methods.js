import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import stripePackage from 'stripe';

const stripe = stripePackage(Meteor.settings.private.stripe);
const Json2csvParser = require('json2csv').Parser;

// Administration
Meteor.methods({
  // Query
  getUser(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Meteor.users.findOne(id, { fields: { profile: 1, emails: 1 } });
  },
  async getUserStripe(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    const userData = Meteor.users.findOne(id, { fields: { 'profile.stripeCustomAccountId': 1 } });
    if (userData === null || userData.profile.stripeCustomAccountId === null) { throw new Error('Unauthortized'); }

    const data = await stripe.accounts.retrieve(userData.profile.stripeCustomAccountId);
    return [
      data.legal_entity.first_name,
      data.legal_entity.last_name,
    ];
  },
  getUsers(filter) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    if (filter.length > 0) {
      const regex = new RegExp(filter, 'i');
      return Meteor.users.find(
        {
          $or: [
            { 'profile.name': regex },
            { 'profile.familyName': regex },
            { 'emails.0.address': regex }],
        },
        {
          limit: 18,
          fields: {
            _id: 1, 'profile.name': 1, 'profile.familyName': 1, emails: 1,
          },
        },
      ).fetch();
    }

    return null;
  },

  // Mutation
  removeUserAccount(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    if (Meteor.userId() === id) { throw new Meteor.Error(500, 'Impossible de supprimer votre propre compte.'); }
    return Meteor.users.remove(id);
  },
});

// User
Meteor.methods({
  // Query
  getUserData() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    return Meteor.users.findOne(Meteor.userId(), { fields: { profile: 1, emails: 1 } });
  },
  getUserProfile(id) {
    return Meteor.users.findOne(id, {
      fields: {
        'profile.name': 1, 'profile.familyName': 1, 'profile.companyName': 1, 'profile.biography': 1, 'profile.website': 1, 'profile.facebook': 1, 'profile.twitter': 1, 'profile.instagram': 1,
      },
    });
  },
  async getUserStripeData() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const userData = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomAccountId': 1 } });
    if (userData === null || userData.profile.stripeCustomAccountId === null) { throw new Error('Unauthortized'); }

    const data = await stripe.accounts.retrieve(userData.profile.stripeCustomAccountId);

    return [
      data.legal_entity.first_name,
      data.legal_entity.last_name,
      data.legal_entity.dob.day,
      data.legal_entity.dob.month,
      data.legal_entity.dob.year,
    ];
  },
  sendVerificationLink() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    return Accounts.sendVerificationEmail(Meteor.userId());
  },
  getAllDataAboutMe() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const data = Meteor.users.findOne(Meteor.userId(), { fields: { profile: 1, emails: 1 } });
    const jsonStruct = {
      name: data.profile.name,
      'Nom de famille': data.profile.familyName,
      email: data.emails[0].address,
      'vérification email': data.emails[0].verified,
      'site internet': data.profile.website,
      Adresse: data.profile.billing.address,
      'Adresse 2': data.profile.billing.address_two,
      Ville: data.profile.billing.city,
      Région: data.profile.billing.state,
      'Code postal': data.profile.billing.zip,
      Pays: data.profile.billing.country,
      'Nombre de projets': data.profile.statistics.projectsCreated,
      'Nombre de donations': data.profile.statistics.supportedProjects,
      bic: data.profile.bic,
      iban: data.profile.iban,
    };

    const json2csvParser = new Json2csvParser({ includeEmptyRows: true });
    const csv = json2csvParser.parse(jsonStruct);

    return `data:text/csv;charset=utf-8,${encodeURI(csv)}`;
  },

  // Mutation
  async createStripeAccount({ token, btoken }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    // Check if not already exist
    const { stripeCustomAccountId } = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomAccountId': 1 } }).profile;
    if (stripeCustomAccountId != null) { throw new Meteor.Error(500, 'Vous avez déjà rempli correctement le formulaire !'); }

    // Call Stripe API, create account
    const result = await stripe.accounts.create({
      country: 'FR',
      type: 'custom',
      account_token: token,
      payout_schedule: {
        interval: 'monthly',
        monthly_anchor: 1,
      },
    });

    // Create bank account
    const bankResult = await stripe.accounts.createExternalAccount(result.id, { external_account: btoken, default_for_currency: true });

    // Update user account
    Meteor.users.update(Meteor.userId(), {
      $set: {
        'profile.stripeCustomAccountId': result.id,
        'profile.stripeBankId': bankResult.id,
      },
    });

    return true;
  },
  updateAccount({
    name, familyName, email, website, facebook, instagram, biography, companyName,
  }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    const userData = Meteor.users.findOne({ _id: Meteor.userId() }, { fields: { emails: 1, 'profile.stripeCustomerKey': 1 } });

    // Common data
    Meteor.users.update(Meteor.userId(),
      {
        $set: {
          'profile.name': name,
          'profile.familyName': familyName,
          'profile.website': website,
          'profile.facebook': facebook,
          'profile.instagram': instagram,
          'profile.biography': biography,
          'profile.companyName': companyName,
        },
      });

    // Check if e-mail change
    if (userData.emails[0].address !== email) {
      Meteor.users.update({ _id: Meteor.userId(), 'emails.address': userData.emails[0].address },
        { $set: { 'emails.$.address': email, 'emails.$.verified': false } });

      if (userData.profile.stripeCustomerKey != null) { stripe.customers.update(userData.profile.stripeCustomerKey, { email }); }
    }

    return true;
  },
  updateBilling({
    address, addressTwo, city, state, zip, country,
  }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    Meteor.users.update(Meteor.userId(),
      {
        $set: {
          'profile.billing.address': address,
          'profile.billing.address_two': addressTwo,
          'profile.billing.city': city,
          'profile.billing.state': state,
          'profile.billing.zip': zip,
          'profile.billing.country': country,
        },
      });

    return true;
  },
  async updateStripeData({ token, btoken }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const userData = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomAccountId': 1, 'profile.stripeBankId': 1 } });
    if (userData === null || userData.profile.stripeCustomAccountId === null) { throw new Meteor.Error(500, 'Unauthortized'); }

    // Update Stripe account
    stripe.accounts.update(userData.profile.stripeCustomAccountId, { account_token: token });

    // Update Stripe bank
    if (btoken != null) {
      // New bank
      const newBankResult = await stripe.accounts.createExternalAccount(userData.profile.stripeCustomAccountId, { external_account: btoken, default_for_currency: true });

      // Remove old
      stripe.accounts.deleteExternalAccount(
        userData.profile.stripeCustomAccountId,
        userData.profile.stripeBankId,
        (err) => {
          if (err) console.log(err);
        },
      );

      // Update user account
      Meteor.users.update(Meteor.userId(), {
        $set: {
          'profile.stripeBankId': newBankResult.id,
        },
      });
    }

    return true;
  },
  removeMe() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === true) { throw new Meteor.Error(500, 'Vous ne pouvez pas supprimer le compte d\'un administrateur'); }

    return Meteor.users.remove(Meteor.userId());
  },
});
