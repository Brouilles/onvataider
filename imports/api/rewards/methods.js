import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';

import Projects from '../projects/project';
import Rewards from './reward';

Meteor.methods({
  // Mutation
  createReward({
    parentId, name, content, img, price,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const projectData = Projects.findOne(parentId, { fields: { creatorId: 1, visibility: 1, type: 1 } });

    if (projectData.type === 2) { throw new Meteor.Error(500, 'Votre projet est une collecte solidaire, il ne peut pas y avoir de contrepartie.'); }
    if (projectData.visibility === 1) { throw new Meteor.Error(500, 'Votre projet est en cours de validation par un administrateur, vous ne pouvez pas faire de modification.'); }

    if (Meteor.userId() === projectData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      const id = Rewards.insert(
        {
          parentId,
          name,
          content,
          img,
          price: parseInt(price, 10),
          numberSales: 0,
        },
      );
      return id;
    }
    throw new Error('Unauthortized');
  },
  updateReward({
    id, name, content, img, price,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const projectData = Projects.findOne(Rewards.findOne(id, { fields: { parentId: 1 } }).parentId, { fields: { creatorId: 1, visibility: 1 } });
    if (projectData.visibility === 1) { throw new Meteor.Error(500, 'Votre projet est en cours de validation par un administrateur, vous ne pouvez pas faire de modification.'); }

    if (Meteor.userId() === projectData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      Rewards.update(id, {
        $set: {
          name,
          content,
          img,
          price: parseInt(price, 10),
        },
      });
      return true;
    }
    throw new Error('Unauthortized');
  },
  removeReward(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const rewardData = Rewards.findOne(id, { fields: { parentId: 1, numberSales: 1 } });
    const projectData = Projects.findOne(rewardData.parentId, { fields: { creatorId: 1, visibility: 1 } });

    if (projectData.visibility === 1) { throw new Meteor.Error(500, 'Votre projet est en cours de validation par un administrateur, vous ne pouvez pas faire de modification.'); } else if (projectData.visibility === 2 && rewardData.numberSales > 0) { throw new Error('Impossible de supprimer une contrepartie maintenant que le projet est en ligne et qu\'il y a des contributions sur celle-ci.'); } else if (projectData.visibility === 3) { throw new Error('Impossible de faire des modifications sur un projet clos.'); }

    if (Meteor.userId() === projectData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      Rewards.remove(id);
      return true;
    }
    throw new Error('Unauthortized');
  },
});
