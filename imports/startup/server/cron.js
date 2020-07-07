import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Email } from 'meteor/email';

import Projects from '../../api/projects/project';
import Products from '../../api/products/product';
import Purchases from '../../api/purchases/purchase';

SyncedCron.config({
  log: false,
  logger: null,
  collectionName: 'cronHistory',
  utc: false,
  collectionTTL: 172800,
});

SyncedCron.add({
  name: 'CheckStocks',
  schedule(parser) {
    return parser.text('at 0:00 am');
  },
  job() {
    const products = Products.find({ stock: { $lte: 0 }, creatorAlert: false }, { fields: { name: 1, creatorId: 1 } }).fetch();

    products.map((product) => {
      const user = Meteor.users.findOne({ _id: product.creatorId }, { fields: { emails: 1 } });
      Products.update(product._id, { $set: { creatorAlert: true } });

      Email.send({
        to: user.emails[0].address,
        from: 'contact@onvataider.com',
        subject: `Votre produit ${product.name} n'est plus en stock - Onvataider`,
        text: `
Votre produit ${product.name} n'a plus de stock.
Cordialement l'équipe de onvataider.com`,
      });
    });
  },
});

SyncedCron.add({
  name: 'UpdateProjects',
  schedule(parser) {
    return parser.text('at 00:00 am');
  },
  job() {
    function parseDate(str) {
      const mdy = str.split('-');
      return new Date(mdy[2], mdy[0] - 1, mdy[1]);
    }

    function addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }

    function datediff(first, second) {
      return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }

    const openProjects = Projects.find({ visibility: 2 }, {
      fields: {
        _id: 1, name: 1, creatorId: 1, type: 1, goal: 1, currentMoney: 1, startDate: 1, endDate: 1,
      },
    }).fetch();
    const currentDate = new Date();

    openProjects.forEach((project) => {
      const remainingTime = datediff(parseDate(`${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}`), addDays(new Date(project.startDate), project.endDate));

      if (remainingTime <= 0) { // default 0
        Projects.update(project._id, { $set: { visibility: 3 } });

        // Stripe payouts to bank for project owner
        const projectCreator = Meteor.users.findOne(project.creatorId, { fields: { emails: 1 } });

        Email.send({
          to: projectCreator.emails[0].address,
          from: 'contact@onvataider.com',
          subject: `Fin du projet ${project.name} - Onvataider`,
          text: `Bravo ! Le projet ${project.name} est maintenant clos ! Vous pouvez télécharger la liste des donateurs depuis la page de modification d'un projet. Vous allez recevoir très rapidement sur votre compte en banque un virement.`,
        });

        // Stripe payouts for product owners if it's a solidarity project
        if (project.type === 2) {
          const allData = {};

          const productsPurchases = Purchases.find({ projectId: project._id, isProduct: true }).fetch();
          productsPurchases.forEach((purchase) => {
            const product = Products.findOne(purchase.parentId, {
              fields: {
                name: 1, transportCosts: 1, creatorId: 1,
              },
            });
            const tempUser = Meteor.users.findOne(purchase.userId, { fields: { 'profile.name': 1, 'profile.familyName': 1 } });

            if (allData[product._id] === undefined) {
              allData[product._id] = {
                ...product,
                list: [],
              };
            }

            allData[product._id].list.push(`\n\n
Nom: ${tempUser.profile.name}
Nom de famille: ${tempUser.profile.familyName}
Date: ${purchase.createdAt}
Adresse: ${purchase.address.line1}
Adresse 2: ${purchase.address.line2}
Ville: ${purchase.address.city}
Pays: ${purchase.address.country}
Région: ${purchase.address.state}
Code postal: ${purchase.address.postal_code}
            `);
          });

          Object.keys(allData).forEach((arrayOfData) => {
            let emailContent = `Bravo ! Le projet ${project.name} est maintenant clos ! Plusieurs donateurs on choisit le produit ${allData[arrayOfData].name}. Vous allez recevoir très rapidement sur votre compte en banque les frais pour la livraison.`;
            const currentUserData = Meteor.users.findOne(allData[arrayOfData].creatorId, { fields: { emails: 1 } });

            allData[arrayOfData].list.forEach((data) => {
              emailContent += data;
            });

            Email.send({
              to: currentUserData.emails[0].address,
              from: 'contact@onvataider.com',
              subject: 'Fin d\'un projet, liste des achats - Onvataider',
              text: emailContent,
            });
          });
        }
      }
    });

    return true;
  },
});

SyncedCron.start();
