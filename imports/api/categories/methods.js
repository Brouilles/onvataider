import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import Categories from './category';

const urlify = a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-').replace(/^-+|-+$/g, '');

Meteor.methods({
  // Query
  getCategories() {
    return Categories.find({}).fetch();
  },
  getCategoryById(id) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    return Categories.findOne(id);
  },

  // Mutation
  createCategory({ name }) {
    if (!Meteor.userId()) { throw new Meteor.Error(500, 'Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Meteor.Error(500, 'Unauthortized'); }

    const url = urlify(name);
    const _id = Categories.insert({ name, url });

    return { _id, url };
  },
  updateCategory({ id, name }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Categories.update(id, { $set: { name, url: urlify(name) } });
    return true;
  },
  removeCategory(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Categories.remove(id);
    return true;
  },
});
