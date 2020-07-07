import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import Categories from './category';

const urlify = a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-').replace(/^-+|-+$/g, '');

Meteor.methods({
  // Query
  getProductCategories() {
    return Categories.find({}).fetch();
  },
  getProductCategoryById(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Categories.findOne(id);
  },

  // Mutation
  createProductCategory({ name }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    const url = urlify(name);
    const _id = Categories.insert({ name, url });

    return { _id, url };
  },
  updateProductCategory({ id, name }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Categories.update(id, { $set: { name, url: urlify(name) } });
    return true;
  },
  removeProductCategory(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Categories.remove(id);
    return true;
  },
});
