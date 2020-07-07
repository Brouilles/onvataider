import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Roles } from 'meteor/alanning:roles';

import { writeImageOnDisk, removeImageOnDisk, renameImageOnDisk } from '../images';
import ProductCategories from '../productCategories/category';
import Products from './product';
import Projects from '../projects/project';

const urlify = a => a.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '-').replace(/^-+|-+$/g, '');

// Administration
Meteor.methods({
  // Query
  AdministrationGetProducts(visibility) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    return Products.find({ visibility }).fetch();
  },
  AdministrationGetMyProducts({ id }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    return Products.find({ creatorId: id }).fetch();
  },

  // Mutation
  AdministrationProductValidate({ id, isValidate, msg }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { throw new Error('Unauthortized'); }

    const creatorId = Products.findOne(id, { fields: { creatorId: 1 } });
    const userData = Meteor.users.findOne(creatorId.creatorId, { fields: { emails: 1 } });

    if (isValidate === true) {
      Products.update(id, { $set: { visibility: 1 } });
      Email.send({
        to: userData.emails[0].address,
        from: 'contact@onvataider.com',
        subject: 'Votre produit est en ligne - Onvataider',
        text: `
Bravo ! Votre produit est en ligne sur onvataider.com !

${msg}

Cordialement l'équipe de onvataider.com`,
      });
    } else {
      Products.update(id, { $set: { visibility: -1 } });
      Email.send({
        to: userData.emails[0].address,
        from: 'contact@onvataider.com',
        subject: 'Votre produit est refusé - Onvataider',
        text: `
Votre produit n'est pas en ligne sur onvataider.com. Voilà la raison :

${msg}

Cordialement l'équipe de onvataider.com`,
      });
    }
  },
});

// User
Meteor.methods({
  // Query
  productsCount(filter) {
    if (filter != null && filter.length > 0) {
      const regex = new RegExp(filter, 'i');
      return Products.find({ name: regex, visibility: { $gte: 1 } }).count();
    }
    return Products.find({ visibility: { $gte: 1 } }).count();
  },
  getProducts({
    limit, skip, filter, categoryUrl,
  }) {
    let products = null;
    if (filter != null && filter.length > 0) {
      const regex = new RegExp(filter, 'i');

      if (categoryUrl) {
        const categoryId = ProductCategories.findOne({ url: categoryUrl }, { fields: { _id: 1 }, sort: { createdAt: -1 } })._id;
        products = Products.find({ categoryId, name: regex, visibility: { $gte: 1 } }, { skip, limit, sort: { createdAt: -1 } }).fetch();
      } else {
        products = Products.find({ name: regex, visibility: { $gte: 1 } }, { limit, sort: { createdAt: -1 } }).fetch();
      }
    } else if (categoryUrl) {
      const categoryId = ProductCategories.findOne({ url: categoryUrl }, { fields: { _id: 1 }, sort: { createdAt: -1 } })._id;
      products = Products.find({ categoryId, visibility: { $gte: 1 } }, { skip, limit, sort: { createdAt: -1 } }).fetch();
    } else {
      products = Products.find({ visibility: { $gte: 1 } }, { skip, limit, sort: { createdAt: -1 } }).fetch();
    }

    return products.map((product) => {
      const user = Meteor.users.findOne({ _id: product.creatorId }, { fields: { 'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1 } });

      return {
        ...product,
        creator: user,
      };
    });
  },
  getMyProducts() {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    return Products.find({ creatorId: Meteor.userId() }).fetch();
  },
  getProductById(id) {
    const productsData = Products.findOne(id);

    if (productsData != null && productsData.visibility >= 1) { return productsData; }
    if (productsData != null && Meteor.userId() === productsData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) { return productsData; }

    return null;
  },
  getProductByUrl(url) {
    const productsData = Products.findOne({ url });

    if (productsData != null && productsData.visibility >= 1
      || Meteor.userId() === productsData.creatorId
      || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      const creator = Meteor.users.findOne(productsData.creatorId, {
        fields: {
          'profile.companyName': 1, 'profile.name': 1, 'profile.familyName': 1,
        },
      });

      return {
        ...productsData,
        creator,
      };
    }

    return null;
  },
  getProductsByUser(userId) {
    return Products.find({ $and: [{ creatorId: userId }, { visibility: { $gte: 1 } }] }).fetch();
  },

  // Mutation
  createProduct({
    name, categoryId, price, donation, transportCosts, img, description, longDescription, stock, deliveryTime, selectedProjects,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (name.length > 58) { throw new Meteor.Error(500, 'Le nom du produit solidaire est supérieure à 58 caractères.'); }
    if (Products.find({ name }).count() > 0) { throw new Meteor.Error(500, 'Le nom est déjà utilisé. Merci d\'en renseigner un autre.'); }
    if (description.length > 140) { throw new Error('Votre description est supérieure à 140 caractères.'); }
    if (price < 5 || donation < 5 || price < donation) { throw new Error('Votre prix total ou le montant reversé à la cagnotte n\'est pas valide.'); }

    const urlifyName = urlify(name);
    writeImageOnDisk(`${urlifyName}-product-img`, img);

    const productId = Products.insert({
      visibility: -1,
      creatorId: Meteor.userId(),
      categoryId,
      selectedProjects,
      name,
      price,
      donation,
      transportCosts,
      description,
      longDescription,
      stock,
      deliveryTime,
      url: urlifyName,
      img: `/uploads/${urlifyName}-product-img.jpeg`,
      creatorAlert: false,
    });

    return productId;
  },
  updateProduct({
    id, name, price, donation, categoryId, transportCosts, img, description, longDescription, stock, deliveryTime, selectedProjects,
  }) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }
    if (name.length > 58) { throw new Meteor.Error(500, 'Le nom du produit solidaire est supérieure à 58 caractères.'); }
    if (description.length > 140) { throw new Error('Votre description est supérieure à 140 caractères.'); }
    if (price < 1 || donation < 1 || price < donation) { throw new Error('Votre prix total ou le montant reversé à la cagnotte n\'est pas suffisant.'); }

    const productData = Products.findOne(id, { fields: { creatorId: 1, name: 1 } });
    if (Meteor.userId() === productData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      if (name !== productData.name && Projects.find({ name }).count() > 0) { throw new Meteor.Error(500, 'Le nom est déjà utilisé. Merci d\'en renseigner un autre.'); }

      // Update image name on disk
      const urlifyName = urlify(name);
      if (productData.name !== name) {
        const urlifyOldName = urlify(productData.name);
        renameImageOnDisk(`${urlifyOldName}-product-img`, `${urlifyName}-product-img`);

        Products.update(id, { $set: { img: `/uploads/${urlifyName}-product-img.jpeg` } });
      }

      // Update image
      if (img != null) { writeImageOnDisk(`${urlifyName}-product-img`, img); }

      Products.update(id, {
        $set: {
          name,
          selectedProjects,
          categoryId,
          price,
          donation,
          transportCosts,
          description,
          longDescription,
          stock,
          deliveryTime,
          url: urlifyName,
          creatorAlert: false,
        },
      });
    } else { throw new Error('Unauthortized'); }

    return true;
  },
  removeProduct(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const productData = Products.findOne(id, { fields: { name: 1, visibility: 1, creatorId: 1 } });

    if (Roles.userIsInRole(Meteor.userId(), 'administrator') === true || productData.creatorId === Meteor.userId()) {
      if (productData.visibility > -1) { throw new Meteor.Error(500, 'Impossible de supprimer l\'article (en cours de validation ou en ligne).'); }

      const urlifyName = urlify(productData.name);
      removeImageOnDisk(`${urlifyName}-product-img`);

      Products.remove(id);
      return true;
    }
    throw new Error('Unauthortized');
  },
  waitingProduct(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const productData = Products.findOne(id, { fields: { creatorId: 1, visibility: 1 } });
    if (Meteor.userId() === productData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      if (Roles.userIsInRole(Meteor.userId(), 'administrator') === false) { // If user is not an administrator
        const userData = Meteor.users.findOne(Meteor.userId(), { fields: { 'profile.stripeCustomAccountId': 1 } });
        if (userData.profile.stripeCustomAccountId == null) { throw new Meteor.Error(500, 'Vous devez remplir le formulaire du créateur dans l\'espace \'Mon compte\'. Mise en ligne impossible.'); }
      }

      let newVisibility = productData.visibility;
      switch (newVisibility) {
        case -1:
          newVisibility = 0;
          break;
        case 0:
          newVisibility = -1;
          break;
        default: newVisibility = -1;
      }

      Products.update(id, {
        $set: {
          visibility: newVisibility,
          createdAt: Date.now(),
        },
      });

      // alert for administrator
      Email.send({
        to: 'contact@onvataider.com',
        from: 'contact@onvataider.com',
        subject: 'Produit en attente de validation - Onvataider',
        text: 'Un produit est en attente de validation dans l\'administration ...',
      });

      return newVisibility;
    }
    throw new Error('Unauthortized');
  },
  invisibilityProduct(id) {
    if (!Meteor.userId()) { throw new Error('Unauthortized'); }

    const productData = Products.findOne(id, { fields: { creatorId: 1, visibility: 1 } });
    if (Meteor.userId() === productData.creatorId || Roles.userIsInRole(Meteor.userId(), 'administrator') === true) {
      let newVisibility = productData.visibility;
      switch (newVisibility) {
        case 1:
          newVisibility = -2;
          break;
        case -2:
          newVisibility = 1;
          break;
        default: newVisibility = -2;
      }

      Products.update(id, {
        $set: {
          visibility: newVisibility,
        },
      });

      return newVisibility;
    }
    throw new Error('Unauthortized');
  },
});
