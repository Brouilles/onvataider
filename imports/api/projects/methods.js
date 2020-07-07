/* eslint no-underscore-dangle: 0 */
/* eslint no-mixed-operators: 0 */
import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Roles } from 'meteor/alanning:roles';

import Categories from '../categories/category';
import Rewards from '../rewards/reward';
import Purchases from '../purchases/purchase';
import Products from '../products/product';
import Projects from './project';
import { writeImageOnDisk, removeImageOnDisk, renameImageOnDisk } from '../images';

const Json2csvParser = require('json2csv').Parser;

const urlify = a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-').replace(/^-+|-+$/g, '');

// Administration
Meteor.methods({
  // Query
  AdministrationGetProjects(visibility) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Projects.find({ visibility: parseInt(visibility, 10) }, { fields: { name: 1, url: 1, visibility: 1 } }).fetch();
  },
  AdministrationUserProjects({ id }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Projects.find({ creatorId: id }).fetch();
  },

  // Mutation
  AdministrationWaitingAction({ id, isValidate, msg }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    const projectData = Projects.findOne(id, { fields: { creatorId: 1 } });
    const userData = Meteor.users.findOne(projectData.creatorId, { fields: { emails: 1 } });

    if (isValidate === true) {
      Projects.update(id, {
        $set: {
          visibility: 2,
          startDate: Date.now(),
        },
      });
      Meteor.users.update(projectData.creatorId, { $inc: { 'profile.statistics.projectsCreated': 1 } });
      Email.send({
        to: userData.emails[0].address,
        from: 'contact@onvataider.com',
        subject: 'Votre projet est en ligne - Onvataider',
        text: `
Votre projet est en ligne sur onvataider.com !

${msg}

Cordialement l'équipe de onvataider.com`,
      });
    } else {
      Projects.update(id, {
        $set: {
          visibility: 0,
        },
      });
      Email.send({
        to: userData.emails[0].address,
        from: 'contact@onvataider.com',
        subject: 'Votre projet est refusé - Onvataider',
        text: `
Votre projet n'est pas en ligne sur onvataider.com. Voilà la raison :

${msg}

Cordialement l'équipe de onvataider.com`,
      });
    }

    return true;
  },
});

// User
Meteor.methods({
  // Query
  projectCount({ filter, categoryUrl, type }) {
    if (filter != null && filter.length > 0) {
      const regex = new RegExp(filter, 'i');

      if (categoryUrl) {
        const categoryId = Categories.findOne({ url: categoryUrl }, { fields: { _id: 1 } })._id;
        return Projects.find({
          name: regex, categoryId, type, visibility: { $gte: 2 },
        }).count();
      }
      return Projects.find({ name: regex, type, visibility: { $gte: 2 } }).count();
    }

    if (categoryUrl) {
      const categoryId = Categories.findOne({ url: categoryUrl }, { fields: { _id: 1 } })._id;
      return Projects.find({ categoryId, type, visibility: { $gte: 2 } }).count();
    }
    return Projects.find({ visibility: { $gte: 2 }, type }).count();
  },
  getProjects({
    limit, skip, type, filter, categoryUrl,
  }) {
    let projects = null;
    const fields = {
      name: 1,
      imgHeader: 1,
      url: 1,
      imgThumbnail: 1,
      description: 1,
      numberDonations: 1,
      type: 1,
      currentMoney: 1,
      goal: 1,
      startDate: 1,
      endDate: 1,
      creatorId: 1,
      hideMoney: 1,
    };

    if (filter != null && filter.length > 0) {
      const regex = new RegExp(filter, 'i');

      if (categoryUrl) {
        const categoryId = Categories.findOne({ url: categoryUrl }, { fields: { _id: 1 } })._id;
        projects = Projects.find({
          name: regex, categoryId, type, visibility: { $gte: 2 },
        }, { limit, sort: { startDate: -1 }, fields }).fetch();
      } else {
        projects = Projects.find({ name: regex, type, visibility: { $gte: 2 } }, { limit, sort: { startDate: -1 }, fields }).fetch();
      }
    } else if (categoryUrl) {
      const categoryId = Categories.findOne({ url: categoryUrl }, { fields: { _id: 1 } })._id;
      projects = Projects.find({ categoryId, type, visibility: { $gte: 2 } }, {
        skip, limit, sort: { startDate: -1 }, fields,
      }).fetch();
    } else {
      projects = Projects.find({ visibility: { $gte: 2 }, type }, {
        skip, limit, sort: { startDate: -1 }, fields,
      }).fetch();
    }

    return projects.map((project) => {
      let user = Meteor.users.findOne({ _id: project.creatorId }, { fields: { 'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1 } });
      if (user == null) { user = { profile: { companyName: 'Inconnue' } }; }

      if (project.hideMoney === true) {
        project.currentMoney = 0;
        project.goal = 0;
      }

      return {
        ...project,
        creator: user,
      };
    });
  },
  getMyProjects() {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    return Projects.find({ creatorId: Meteor.userId() }, { sort: { type: -1 }, fields: { name: 1, url: 1, visibility: 1 } }).fetch();
  },
  getProjectById(id) {
    const projectData = Projects.findOne(id);

    if (projectData != null && projectData.visibility >= 2
      || Meteor.userId() === projectData.creatorId
      || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      // Get rewards
      const rewards = Rewards.find({ parentId: id }, { sort: { price: 1 }, fields: { parentId: 0 } }).fetch();

      return {
        ...projectData,
        rewards,
      };
    }

    return null;
  },
  getSolidarityProjects() {
    const projects = Projects.find({ visibility: { $gte: 2 } }, { fields: { _id: 1, name: 1 } }).fetch();
    return projects.map(project => ({
      value: project._id,
      label: project.name,
    }));
  },
  getProjectUrlById(id) {
    const { url } = Projects.findOne({ _id: id }, { fields: { url: 1 } });
    return url;
  },
  getProjectByUrl(url) {
    const projectData = Projects.findOne({ url });
    if (projectData != null && Meteor.userId() === projectData.creatorId
      || Roles.userIsInRole(Meteor.userId(), 'administrator') === true
      || projectData.visibility >= 2) {
      // Get User Data
      const creator = Meteor.users.findOne(projectData.creatorId, {
        fields: {
          'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1, 'profile.website': 1, 'profile.statistics': 1,
        },
      });

      if (projectData.hideMoney === true) {
        projectData.currentMoney = 0;
        projectData.goal = 0;
      }

      // Get rewards
      const rewards = Rewards.find({ parentId: projectData._id }, { sort: { price: 1 }, fields: { parentId: 0 } }).fetch();

      // Get supports
      let supports = null;
      if (projectData.hideMoney == null || projectData.hideMoney === false) {
        supports = Purchases.find({ projectId: projectData._id }, {
          sort: { createdAt: -1 },
          fields: {
            comment: 1, amount: 1, userId: 1, anonymous: 1,
          },
        }).fetch();
      }

      // Get products (if solidary)
      const products = Products.find({ visibility: { $gte: 1 }, selectedProjects: { $elemMatch: { value: projectData._id } } }).fetch();

      return {
        ...projectData,
        creator: creator.profile,
        products: products || null,
        supports: supports !== null && supports.map((support) => {
          if (support.anonymous === undefined || support.anonymous === false) {
            const user = Meteor.users.findOne({ _id: support.userId }, { fields: { 'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1 } });

            return {
              _id: support._id,
              comment: support.comment,
              amount: support.amount,
              creator: user,
            };
          }

          return {
            _id: support._id,
            comment: support.comment,
            amount: support.amount,
            creator: undefined,
          };
        }),
        rewards,
      };
    }

    return null;
  },
  getAllProjectDonators(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const projectData = Projects.findOne(id, { fields: { creatorId: 1 } });
    if (Meteor.userId() === projectData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      const purchasesData = Purchases.find({ projectId: id }).fetch();
      const fields = ['Nom', 'Nom de famille', 'Email', 'Montant (€)', 'Contrepartie', 'Commentaire', 'Date', 'Adresse', 'Adresse 2', 'Ville', 'Pays', 'Région', 'Code postal'];
      const finalData = [];

      if (purchasesData.length === 0) { throw new Meteor.Error(500, 'Il n\'y a aucune donation, téléchargement impossible.'); }

      purchasesData.forEach((element) => {
        const tempUser = Meteor.users.findOne(element.userId, { fields: { 'profile.name': 1, 'profile.familyName': 1, emails: 1 } });

        let tempReward;
        if (element.isProduct) {
          tempReward = Products.findOne(element.parentId, { fields: { name: 1 } }).name;
        } else {
          tempReward = (element.parentId === '42' ? 'Sans contrepartie' : Rewards.findOne(element.parentId, { fields: { name: 1 } }).name);
        }

        finalData.push({
          Nom: tempUser && tempUser.profile.name || 'Compte supprimer',
          'Nom de famille': tempUser && tempUser.profile.familyName || 'Compte supprimer',
          Email: tempUser && tempUser.emails[0].address || 'Compte supprimer',
          'Montant (€)': element.amount,
          Contrepartie: tempReward,
          Commentaire: element.comment,
          Date: element.createdAt,
          Adresse: element.address.line1,
          'Adresse 2': element.address.line2,
          Ville: element.address.city,
          Pays: element.address.country,
          Région: element.address.state,
          'Code postal': element.address.postal_code,
        });
      });

      const json2csvParser = new Json2csvParser({ fields });
      const csv = json2csvParser.parse(finalData);
	  
	  // Temporary
		const fs = require('fs');
		fs.writeFile("/var/www/onvataider.com/list.csv", `data:text/csv;charset=utf-8,${csv}`, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		
		    console.log("The file was saved!");
		}); 

      return `data:text/csv;charset=utf-8,${encodeURI(csv)}`;
    }
    throw new Meteor.Error(500, 'Unauthortized');
  },

  // Mutation
  createProject({
    name, type, categoryId, imgHeader, imgThumbnail, videoId, goal, description, longDescription, updateDescription, endDate, hideMoney,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Projects.find({ creatorId: Meteor.userId(), visibility: { $lt: 2 } }).count() > 10) { throw new Meteor.Error(500, 'Vous ne pouvez faire que 10 brouillons de projet maximum en même temps.'); }
    if (name.length > 58) { throw new Meteor.Error(500, 'Le nom de la cagnotte est supérieure à 58 caractères.'); }
    if (Projects.find({ name }).count() > 0) { throw new Meteor.Error(500, 'Le nom du projet est déjà utilisé. Merci d\'en renseigner un autre.'); }
    if (goal < 1) { throw new Meteor.Error(500, 'Vous ne pouvez pas avoir un objectif inférieur à 1€.'); }
    if (description.length > 140) { throw new Meteor.Error(500, 'Votre description est supérieure à 140 caractères.'); }

    // Write images on disk
    const urlifyName = urlify(name);

    writeImageOnDisk(`${urlifyName}-imgHeader`, imgHeader);
    writeImageOnDisk(`${urlifyName}-imgThumbnail`, imgThumbnail);

    // Insert in mongodb
    const projectId = Projects.insert(
      {
        name,
        url: urlifyName,
        creatorId: Meteor.userId(),
        categoryId,
        type: parseInt(type, 10),
        imgHeader: `/uploads/${urlifyName}-imgHeader.jpeg`,
        imgThumbnail: `/uploads/${urlifyName}-imgThumbnail.jpeg`,
        videoId,
        visibility: 0,
        goal,
        description,
        longDescription,
        updateDescription,
        endDate,
        hideMoney,
        numberDonations: 0,
        currentMoney: 0,
      },
    );

    return projectId;
  },
  updateProject({
    id, name, type, categoryId, imgHeader, imgThumbnail, videoId, goal, description, longDescription, updateDescription, endDate, hideMoney,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    if (name.length > 58) { throw new Meteor.Error(500, 'Le nom de la cagnotte est supérieure à 58 caractères.'); }
    if (goal < 1) { throw new Meteor.Error(500, 'Vous ne pouvez pas avoir un objectif inférieur à 1€.'); }
    if (description.length > 140) { throw new Meteor.Error(500, 'Votre description est supérieure à 140 caractères.'); }

    const projectData = Projects.findOne(id, {
      fields: {
        name: 1, url: 1, creatorId: 1, imgHeader: 1, imgThumbnail: 1, visibility: 1, type: 1,
      },
    });
    if (projectData.visibility === 1) { throw new Meteor.Error(500, 'Votre projet est en cours de validation par un administrateur, vous ne pouvez pas faire de modification.'); } else if (projectData.visibility === 2) {
      if (projectData.name !== name) { throw new Meteor.Error(500, 'Vous ne pouvez pas faire de changement de nom maintenant que le projet est en ligne.'); }
      if (projectData.type !== parseInt(type, 10)) { throw new Meteor.Error(500, 'Vous ne pouvez pas faire de changement sur le type de projet maintenant que celui-ci est en ligne.'); }

      if (parseInt(projectData.goal, 10) < parseInt(goal, 10)) { throw new Meteor.Error(500, 'L\'objectif ne peut pas être modifié vers le bas maintenant que le projet est en ligne (mais il peut être rehaussé.'); }
    } else if (projectData.visibility === 3 && Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Impossible de faire des modifications sur un projet clos.'); }

    if (Meteor.userId() === projectData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      if (name !== projectData.name && Projects.find({ name }).count() > 0) { throw new Meteor.Error(500, 'Le nom du projet est déjà utilisé. Merci d\'en renseigner un autre.'); }

      if (goal < 1) { throw new Meteor.Error(500, 'Vous ne pouvez pas avoir un objectif inférieur à 1€.'); }

      if (description.length > 140) { throw new Meteor.Error(500, 'Votre description est supérieure à 140 caractères.'); }

      if (projectData.type !== 2 && type === 2) { Rewards.remove({ parentId: id }); }

      // Update images on disk
      const urlifyName = urlify(name);

      if (projectData.name !== name) {
        renameImageOnDisk(`${projectData.url}-imgHeader`, `${urlifyName}-imgHeader`);
        renameImageOnDisk(`${projectData.url}-imgThumbnail`, `${urlifyName}-imgThumbnail`);

        Projects.update(id, {
          $set: {
            imgHeader: `/uploads/${urlifyName}-imgHeader.jpeg`,
            imgThumbnail: `/uploads/${urlifyName}-imgThumbnail.jpeg`,
          },
        });
      }

      if (imgHeader != null) { writeImageOnDisk(`${urlifyName}-imgHeader`, imgHeader); }
      if (imgThumbnail != null) { writeImageOnDisk(`${urlifyName}-imgThumbnail`, imgThumbnail); }

      // Update in mongodb
      Projects.update(id, {
        $set: {
          name,
          url: urlifyName,
          categoryId,
          type: parseInt(type, 10),
          goal,
          videoId,
          description,
          longDescription,
          updateDescription,
          endDate,
          hideMoney,
        },
      });

      return true;
    }
    throw new Error('Unauthortized');
  },
  removeProject(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const projectData = Projects.findOne(id, { fields: { visibility: 1, url: 1, creatorId: 1 } });

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === true || projectData.creatorId === Meteor.userId()) {
      if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) {
        if (projectData.visibility > 0) { throw new Meteor.Error(500, 'Impossible de supprimer le projet (en cours de validation, en ligne ou fini).'); }
      }

      Rewards.remove({ parentId: id });

      removeImageOnDisk(`${projectData.url}-imgHeader`);
      removeImageOnDisk(`${projectData.url}-imgThumbnail`);

      Projects.remove(id);
      return true;
    }
    throw new Error('Unauthortized');
  },
  waitingProject(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }

    const projectData = Projects.findOne(id, { fields: { creatorId: 1, visibility: 1 } });

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === true || projectData.creatorId === Meteor.userId()) {
      if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { // If user is not an administrator
        const userData = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomAccountId': 1 } });
        if (userData.profile.stripeCustomAccountId == null) { throw new Meteor.Error(500, 'Vous devez remplir les Coordonnées bancaires dans l\'espace \'Mon compte\'. Mise en ligne impossible.'); }
      }

      let newVisibility = projectData.visibility;
      switch (newVisibility) {
        case 0:
          newVisibility = 1;
          break;
        case 1:
          newVisibility = 0;
          break;
        default: newVisibility = 0;
      }

      Projects.update(id, {
        $set: {
          visibility: newVisibility,
        },
      });

      Email.send({
        to: 'contact@onvataider.com',
        from: 'contact@onvataider.com',
        subject: 'Projet en attente de validation - Onvataider',
        text: 'Un projet est en attente de validation dans l\'administration ...',
      });

      return newVisibility;
    }
    throw new Meteor.Error(500, 'Unauthortized');
  },
});
