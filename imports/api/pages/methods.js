import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import Pages from './page';

Meteor.methods({
  // Query
  pageCount() {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    return Pages.find({}).count();
  },
  getPages() {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    return Pages.find({}, { fields: { content: 0 } }).fetch();
  },
  getPageById(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    return Pages.findOne(id);
  },
  getPageByName(url) {
    if (Meteor.userId() && Roles.userIsInRole(Meteor.userId(), 'administrator') === true) { return Pages.findOne({ url }); }
    return Pages.findOne({ $and: [{ url }, { visibility: { $gte: 1 } }] });
  },

  // Mutation
  createPage({
    name, url, visibility, content,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    const id = Pages.insert({
      name, url, visibility: parseInt(visibility, 10), content,
    });

    return id;
  },
  updatePage({
    id, name, url, visibility, content,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Pages.update(id, {
      $set: {
        name,
        url,
        visibility: parseInt(visibility, 10),
        content,
      },
    });
    return true;
  },
  removePage(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    Pages.remove(id);
    return true;
  },
});
