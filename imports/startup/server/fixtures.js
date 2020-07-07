import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';

import Pages from '../../api/pages/page';
import Categories from '../../api/categories/category';

Meteor.startup(() => {
  WebApp.addHtmlAttributeHook(() => ({
    lang: 'fr',
  }));

  // Default set up
  if (Meteor.users.find().count() === 0) {
    const superAdminID = Accounts.createUser({
      email: 'contact@onvataider.com',
      password: '3XeIDeYka8',
      profile: {
        name: 'Pierre',
        familyName: 'Eoto',
      },
    });
    Meteor.users.update(superAdminID, { $set: { 'emails.0.verified': true } });
    Roles.addUsersToRoles(superAdminID, 'administrator');

    // Pages
    Pages.insert({
      name: 'Notre Ethique', url: 'notre-ethique', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Qui sommes-nous ?', url: 'qui-sommes-nous', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Onvataider-Asso', url: 'onvataider-asso', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Les principes d\'onvataider.com', url: 'presenter-un-projet', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Mode d\'emploi du créateur', url: 'mode-emploi-du-createur-de-projet', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Mode d\'emploi des contributeurs', url: 'mode-emploi-du-contributeur', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Conditions Générales d\'Utilisation', url: 'conditions-generales-dutilisation', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'FAQ', url: 'faq', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Déposer un projet', url: 'deposerunprojet', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Créer une collecte solidaire', url: 'creerunecollectesolidaire', visibility: 1, content: '',
    });
    Pages.insert({
      name: 'Devenir vendeur', url: 'devenirvendeur', visibility: 1, content: '',
    });

    // Create categories
    const urlify = a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-').replace(/^-+|-+$/g, '');

    Categories.insert({ name: 'Actions Collectives', url: urlify('Actions Collectives') });
    Categories.insert({ name: 'Handicaps', url: urlify('Handicaps') });
  }
});
