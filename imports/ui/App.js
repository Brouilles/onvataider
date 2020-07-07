/* eslint no-unused-expressions: 0 */
import React from 'react';
import {
  BrowserRouter as Router, Route, Switch, Redirect,
} from 'react-router-dom';
import { Accounts } from 'meteor/accounts-base';

import { Provider as AlertProvider } from './components/alert';
import UserProvider from './userContext';
import PrivateRoute from './components/privateRoute';
import ScrollToTop from './components/scrollToTop';
import Header from './components/header';
import Footer from './components/footer';

import Home from './scenes/home';
import Dashboard from './scenes/account/dashboard';
import Purchase from './scenes/purchase';
import Invoice from './scenes/account/dashboard/invoice';

import ProjectsAndCollections from './scenes/projects/all';
import Collections from './scenes/collections';
import Projects from './scenes/projects';
import Project from './scenes/project';
import CreateProject from './scenes/project/create';
import UpdateProject from './scenes/project/update';
import RedirectProject from './scenes/project/redirect';

import MyShop from './scenes/shop/redirect';
import Shop from './scenes/shop';
import Products from './scenes/products';
import Product from './scenes/product';
import ProductForm from './scenes/product/form';

import Page from './scenes/page';
import Login from './scenes/account/login';
import Register from './scenes/account/register';
import Settings from './scenes/account/settings';
import ResetPassword from './scenes/account/reset';
import Contact from './scenes/contact';
import NoMatch from './scenes/noMatch';

import AdministrationAccounts from './scenes/administration/accounts';
import AdministrationProjects from './scenes/administration/projects';
import AdministrationProducts from './scenes/administration/products';
import AdministrationPages from './scenes/administration/pages';
import AdministrationProductCategories from './scenes/administration/productCategories';
import AdministrationCategories from './scenes/administration/categories';

const App = () => (
  <AlertProvider>
    <Router>
      <React.Fragment>
        <UserProvider>
          <Header />
          <ScrollToTop>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/projets-collectes/:category?" component={ProjectsAndCollections} />
              <Route path="/projets/:category?" component={Projects} />
              <Route exact path="/collectes/:category?" component={Collections} />
              <PrivateRoute exact path="/tableau-de-bord" component={Dashboard} />
              <PrivateRoute exact path="/facture/:id" component={Invoice} />
              <PrivateRoute path="/achat/:name/:amount/:elementId/:projectId/:isProduct?" component={Purchase} />

              <Route exact path="/projet/:projectUrl" component={Project} />
              <Route exact path="/projet/redirect/:projectId" component={RedirectProject} />
              <PrivateRoute exact path="/nouveau-projet" component={CreateProject} />
              <PrivateRoute exact path="/edition-projet/:projectId" component={UpdateProject} />

              <Route exact path="/magasin" component={MyShop} />
              <Route exact path="/magasin/:userId" component={Shop} />

              <Route exact path="/produits/:category?" component={Products} />
              <Route exact path="/produit/:productId?" component={Product} />
              <Route exact path="/mon-produit/:productId?" component={ProductForm} />

              <Route exact path="/connexion" component={Login} />
              <Route exact path="/inscription" component={Register} />
              <PrivateRoute exact path="/compte" component={Settings} />
              <Route path="/reset-password/:token" component={ResetPassword} />
              <Route exact path="/contact" component={Contact} />

              <PrivateRoute exact path="/administration/comptes" component={AdministrationAccounts} />
              <PrivateRoute exact path="/administration/projets" component={AdministrationProjects} />
              <PrivateRoute exact path="/administration/produits" component={AdministrationProducts} />
              <PrivateRoute exact path="/administration/pages" component={AdministrationPages} />
              <PrivateRoute exact path="/administration/categories-produits" component={AdministrationProductCategories} />
              <PrivateRoute exact path="/administration/categories" component={AdministrationCategories} />

              <Route path="/verify-email/:token" render={({ match }) => { Accounts.verifyEmail(match.params.token); return (<Redirect to="/compte" />); }} />
              <Route exact path="/introuvable" component={NoMatch} />
              <Route path="/:name" component={Page} />
              <Route component={NoMatch} />
            </Switch>
          </ScrollToTop>
        </UserProvider>
        <Footer />
      </React.Fragment>
    </Router>
  </AlertProvider>
);

export default App;
