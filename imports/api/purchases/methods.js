import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Roles } from 'meteor/alanning:roles';
import { Email } from 'meteor/email';
import stripePackage from 'stripe';
import Rewards from '../rewards/reward';
import Projects from '../projects/project';
import Products from '../products/product';
import Purchases from './purchase';

const stripe = stripePackage(Meteor.settings.private.stripe);
const stripeFees = {
  EUR: { Percent: 2.9, Fixed: 0.25 },
};

function calcStripeFee(amount, currency) {
  const _fee = stripeFees[currency];
  const amountf = parseFloat(amount, 10);
  const total = (amountf + parseFloat(_fee.Fixed)) / (1 - parseFloat(_fee.Percent) / 100);
  const fee = total - amountf;

  return fee.toFixed(2);
}

// Administration
Meteor.methods({
  // Query
  AdministrationGetUserPurchases(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Purchases.find({ userId: id }, { sort: { createdAt: -1 } }).fetch();
  },
});

// User
Meteor.methods({
  // Query
  getMyPurchases() {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const purchases = Purchases.find({ userId: Meteor.userId() }, {
      sort: { createdAt: -1 },
      fields: {
        projectId: 1, parentId: 1, createdAt: 1, amount: 1, state: 1, isProduct: 1,
      },
    }).fetch();

    return purchases.map((purchase) => {
      let parentName;
      if (purchase.isProduct) {
        parentName = Products.findOne(purchase.parentId, { fields: { name: 1 } }).name;
      } else {
        parentName = (purchase.parentId === '42' ? 'Sans contrepartie' : Rewards.findOne(purchase.parentId, { fields: { name: 1 } }).name);
      }

      const project = Projects.findOne(purchase.projectId, { fields: { name: 1, url: 1 } });

      return {
        _id: purchase._id,
        amount: purchase.amount,
        createdAt: purchase.createdAt,
        state: purchase.state,
        parentName,
        projectName: project.name,
        projectUrl: project.url,
      };
    });
  },
  async getInvoice(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    // Get purchase
    const purchase = Purchases.findOne({ _id: new Mongo.ObjectID(id), userId: Meteor.userId() });
    if (purchase === undefined) { throw new Meteor.Error(500, 'La facture est introuvable.'); }

    // Get offer
    let rewardName;
    if (purchase.isProduct) {
      rewardName = Products.findOne(purchase.parentId, { fields: { name: 1 } }).name;
    } else {
      rewardName = (purchase.parentId === '42' ? 'Sans contrepartie' : Rewards.findOne(purchase.parentId, { fields: { name: 1 } }).name);
    }

    // Get user data
    const userData = Meteor.users.findOne({ _id: purchase.userId }, { fields: { 'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1 } });

    // Get project owner data
    const tempProject = Projects.findOne(purchase.projectId, { fields: { creatorId: 1 } });
    const creatorData = Meteor.users.findOne({ _id: tempProject.creatorId }, {
      fields: {
        'profile.stripeCustomAccountId': 1,
        'profile.companyName': 1,
        'profile.name': 1,
        'profile.familyName': 1,
        'profile.website': 1,
        emails: 1,
      },
    });
    const stripeData = await stripe.accounts.retrieve(creatorData.profile.stripeCustomAccountId);

    // Return
    const {
      _id, amount, address, city, state, zip, country, comment, createdAt,
    } = purchase;
    return {
      _id: _id._str,
      rewardName,
      userData,
      creatorData: {
        ...creatorData,
        line1: stripeData.legal_entity.address.line1,
        city: stripeData.legal_entity.address.city,
        postal_code: stripeData.legal_entity.address.postal_code,
        state: stripeData.legal_entity.address.state,
      },
      amount,
      address,
      city,
      state,
      zip,
      country,
      comment,
      createdAt,
    };
  },

  // Mutation
  async createPurchase({
    parentId, projectId, isProduct, stripeTokenId, amount, address, addressTwo, city, state, zip, country, comment, anonymous,
  }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Vous devez être connecté pour continuer.'); }

    // Check if project is online
    const projectData = Projects.findOne(projectId, { fields: { visibility: 1, creatorId: 1 } });
    if (projectData.visibility !== 2) { throw new Meteor.Error(500, 'Le projet n\'est pas en ligne, impossible de faire une donation.'); }

    if (parseInt(amount, 10) < 5) { throw new Meteor.Error(500, 'Une donation doit être de 5€ minimum.'); }

    // Search or create customer
    let customerId = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomerKey': 1 } }).profile.stripeCustomerKey;
    if (customerId == null) {
      const userData = Meteor.users.findOne(Meteor.userId());
      const customer = await stripe.customers.create(
        {
          email: userData.emails[0].address,
          shipping: {
            name: `${userData.profile.name} ${userData.profile.familyName}`,
            address: {
              line1: address,
              line2: addressTwo,
              city,
              country,
              postal_code: zip,
              state,
            },
          },
        },
      );
      Meteor.users.update(Meteor.userId(), { $set: { 'profile.stripeCustomerKey': customer.id } });
      customerId = customer.id;
    }

    // Check is reward or product
    let rewardData;
    let productOwner = null;
    let sellerAmount = 0;
    let clientPercentage = 95;
    if (isProduct) {
      const productData = Products.findOne(parentId, {
        fields: {
          name: 1, stock: 1, price: 1, donation: 1, transportCosts: 1, creatorId: 1,
        },
      });

      if (productData == null || productData.stock <= 0) { throw new Meteor.Error(500, 'Désolé, mais le produit n\'est plus en réserve ! Merci de choisir une autre contrepartie.'); }
      if (productData.price + productData.transportCosts !== amount) { throw new Meteor.Error(500, 'Désolé, mais votre donation n\'est pas assez élevée pour avoir droit au produit.'); }
      productOwner = Meteor.users.findOne(productData.creatorId, { fields: { 'profile.stripeCustomAccountId': 1, emails: 1 } });
      sellerAmount = (productData.price - productData.donation) + productData.transportCosts;
      clientPercentage = 85;

      rewardData = {
        name: productData.name,
      };

      // Update stock
      Products.update(parentId, { $inc: { stock: -1 } });
    } else if (parentId !== '42') {
      rewardData = Rewards.findOne(parentId, {
        fields: {
          name: 1, price: 1, productId: 1, parentId: 1,
        },
      });
      if (parseInt(amount, 10) < rewardData.price) { throw new Meteor.Error(500, 'Votre donation n\'est pas assez élevée pour avoir droit à cette contre-partie.'); }
    } else {
      if (projectId == null) { throw new Meteor.Error(500, 'Projet introuvble.'); }

      rewardData = {
        name: 'Sans contrepartie',
      };
    }

    // Create new source
    const source = await stripe.customers.createSource(customerId, {
      source: stripeTokenId,
    });

    const stripeAmount = parseInt(amount, 10) * 100;
    const fee = calcStripeFee(amount, 'EUR') * 100;
    const seller = parseInt(sellerAmount, 10) * 100;
    const amoutOfTheTransfer = parseInt((clientPercentage / 100 * stripeAmount) - (fee + seller), 10);

    const purchaseId = new Mongo.ObjectID();

    const charge = await stripe.charges.create({
      amount: stripeAmount,
      description: rewardData.name,
      currency: 'eur',
      transfer_group: purchaseId._str,
      customer: source.customer,
    });

    stripe.transfers.create({
      amount: amoutOfTheTransfer,
      currency: 'eur',
      transfer_group: purchaseId._str,
      source_transaction: charge.id,
      destination: Meteor.users.findOne(projectData.creatorId, { fields: { 'profile.stripeCustomAccountId': 1 } }).profile.stripeCustomAccountId,
    });

    if (productOwner !== null && productOwner.profile.stripeCustomAccountId !== null) {
      stripe.transfers.create({
        amount: seller,
        currency: 'eur',
        transfer_group: purchaseId._str,
        source_transaction: charge.id,
        destination: productOwner.profile.stripeCustomAccountId,
      });

      // Send email
      const currentUserData = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.name': 1, 'profile.familyName': 1 } });
      Email.send({
        to: productOwner.emails[0].address,
        from: 'contact@onvataider.com',
        subject: `Vous avez vendu '${rewardData.name}' - Onvataider`,
        text: `
Bravo ! Vous avez vendu 1 exemplaire de '${rewardData.name}' sur Onvataider.com pour un montant de ${rewardData.price}€.
        
Nom: ${currentUserData.profile.name}
Nom de famille: ${currentUserData.profile.familyName}
Date: ${Date()}
Adresse: ${address}
Adresse 2: ${addressTwo}
Ville: ${city}
Pays: ${country}
Région: ${state}
Code postal: ${zip}
        `,
      });
    }

    // Save purchase in database
    Purchases.insert({
      _id: purchaseId,
      parentId,
      isProduct,
      projectId,
      userId: Meteor.userId(),
      anonymous,
      stripeChargeId: charge.id,
      amount,
      comment,
      state: (charge.paid ? 1 : -2),
      address: {
        line1: address,
        line2: addressTwo,
        city,
        country,
        postal_code: zip,
        state,
      },
      createdAt: Date.now(),
    });

    // Update project & user
    if (parentId !== '42') { Rewards.update(parentId, { $inc: { numberSales: 1 } }); }

    Projects.update(
      projectId,
      {
        $inc: {
          currentMoney: parseInt(amount - sellerAmount, 10),
          numberDonations: 1,
        },
      },
    );

    return true;
  },
});
