import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Badge, Button, Table, Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { withAlert } from '../../../components/alert';

class Dashboard extends Component {
  state = {
    projects: null,
    products: null,
    purchases: null,
    removeProjectModalOpen: false,
    removeProductModalOpen: false,
    selectedId: 0,
    productSelectId: 0,

    waitingPublishRequest: [],
  };

  componentDidMount() {
    Meteor.call('getMyProjects', (error, result) => {
      this.setState({ projects: result });
    });

    Meteor.call('getMyProducts', (error, result) => {
      this.setState({ products: result });
    });

    Meteor.call('getMyPurchases', (error, result) => {
      this.setState({ purchases: result });
    });
  }

  getVisibiltyString = (e) => {
    switch (e) {
      case 0:
        return ['secondary', 'Brouillon'];
      case 1:
        return ['info', 'En attente de validation'];
      case 2:
        return ['success', 'En ligne'];
      case 3:
        return ['info', 'Fini'];
      case -1:
        return ['danger', 'Clos'];
      default: break;
    }
  }

  getProjectType = (e) => {
    switch (e) {
      case 0:
        return 'Collecte totale';
      case 1:
        return 'Si 30% et plus';
      case 2:
        return 'Collecte solidaire';
      default: return null;
    }
  }

  getVisibiltyStringProduct = (e) => {
    switch (e) {
      case -2:
        return ['warning', 'Pas disponible'];
      case -1:
        return ['secondary', 'Brouillon'];
      case 0:
        return ['info', 'En attente de validation'];
      case 1:
        return ['success', 'En ligne'];
      default: return null;
    }
  }

  getStateString = (e) => {
    switch (e) {
      case 0:
        return ['primary', 'En attente'];
      case 1:
        return ['success', 'Effectué'];
      case -1:
        return ['warning', 'Le projet n\'a pas atteint ses objectifs'];
      case -2:
        return ['danger', 'Erreur lors du prélèvement'];
      default: return null;
    }
  }

  publishProject = (id) => {
    const { alert } = this.props;

    const { waitingPublishRequest } = this.state;
    waitingPublishRequest[id] = true;
    this.setState({ waitingPublishRequest });

    Meteor.call('waitingProject', id, (error) => {
      if (error) {
        waitingPublishRequest[id] = false;
        this.setState({ waitingPublishRequest });
        return alert.show(error.reason, { type: 'error' });
      }

      alert.show('Modification de l\'état du project.', { type: 'success' });
      waitingPublishRequest[id] = false;
      this.setState({ waitingPublishRequest });

      Meteor.call('getMyProjects', (err, result) => {
        this.setState({ projects: result });
      });
    });
  }

  publishProduct = (id) => {
    const { alert } = this.props;

    const { waitingPublishRequest } = this.state;
    waitingPublishRequest[id] = true;
    this.setState({ waitingPublishRequest });

    Meteor.call('waitingProduct', id, (error) => {
      if (error) {
        waitingPublishRequest[id] = false;
        this.setState({ waitingPublishRequest });
        return alert.show(error.reason, { type: 'error' });
      }

      alert.show('Modification de l\'état du project.', { type: 'success' });
      waitingPublishRequest[id] = false;
      this.setState({ waitingPublishRequest });

      Meteor.call('getMyProducts', (err, result) => {
        this.setState({ products: result });
      });
    });
  }

  toggleRemoveProject = (id = 0, removeAction = false) => {
    const {
      projects, removeProjectModalOpen, selectedId,
    } = this.state;
    const { alert } = this.props;

    if (removeAction) {
      Meteor.call('removeProject', selectedId, (error) => {
        if (error) { return alert.show('Le compte n\'existe pas ou votre nom de compte / mot de passe est invalide.', { type: 'error' }); }

        alert.show('Le projet est maintenant supprimé.', { type: 'success' });
        this.setState({ projects: projects.filter(e => e._id !== selectedId) });
      });
    }

    this.setState({
      removeProjectModalOpen: !removeProjectModalOpen,
      selectedId: id,
    });
  }

  toggleRemoveProduct = (id = 0, removeAction = false) => {
    const {
      products, removeProductModalOpen, productSelectId,
    } = this.state;
    const { alert } = this.props;

    if (removeAction) {
      Meteor.call('removeProduct', productSelectId, (error) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        alert.show('Le produit est maintenant supprimé.', { type: 'success' });
        this.setState({ products: products.filter(e => e._id !== productSelectId) });
      });
    }

    this.setState({
      removeProductModalOpen: !removeProductModalOpen,
      productSelectId: id,
    });
  }

  render() {
    const {
      projects, products, purchases, removeProjectModalOpen, removeProductModalOpen,
      waitingPublishRequest,
    } = this.state;
    document.title = 'Tableau de bord - Onvataider.com';

    return (
      <Container id="main-content">
        <h3 style={{ marginTop: '16px' }}>Mes contributions</h3>
        {purchases != null && purchases.length > 0
          ? (
            <Table responsive>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase._id}>
                    <td>{purchase.parentName} - <Link to={`/projet/${purchase.projectUrl}`}>{purchase.projectName}</Link>  <Badge color={this.getStateString(purchase.state)[0]}>{this.getStateString(purchase.state)[1]}</Badge></td>
                    <td>{purchase.amount}€</td>
                    <td>{new Date(purchase.createdAt).toLocaleDateString('fr-FR', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    </td>
                    <td className="text-right"><Link to={`/facture/${purchase._id._str}`} className="btn btn-primary btn-sm">Facture</Link></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <p className="text-center">Vous n'avez fait aucune donation à un projet pour le moment.</p>}

        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
          <h3>Mes projets</h3>
          <div className="btn-toolbar mb-2 mb-md-0">
            <Link to="/nouveau-projet" className="btn btn-outline-success btn-sm"><FontAwesomeIcon icon={faPlusCircle} /> Nouveau projet</Link>
          </div>
        </div>

        {projects && projects.length > 0
          ? (
            <Table responsive>
              <tbody>
                {projects.map(project => (
                  <tr key={project._id}>
                    <td>{project.name} <Badge color={this.getVisibiltyString(project.visibility)[0]}>{this.getVisibiltyString(project.visibility)[1]}</Badge></td>
                    <td>{this.getProjectType(project.type)}</td>
                    <td className="text-right">
                      <Link to={`/projet/${project.url}`} className="btn btn-primary btn-sm">Voir</Link>
                      { ' ' }
                      <Link to={`/edition-projet/${project._id}`} className="btn btn-primary btn-sm">Modifier</Link>
                      { ' ' }
                      {
                        project.visibility === 0
                          ? <Button size="sm" onClick={() => this.publishProject(project._id)} color="success">{waitingPublishRequest[project._id] === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Mettre en ligne'}</Button>
                          : (project.visibility === 1
                                && <Button size="sm" onClick={() => this.publishProject(project._id)} color="warning">{waitingPublishRequest[project._id] === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Annuler la mise en ligne'}</Button>)
                      }
                      { ' ' }
                      {(project.visibility === 0 && <Button onClick={() => this.toggleRemoveProject(project._id, false)} color="danger" size="sm"><FontAwesomeIcon icon={faTrashAlt} /></Button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
          : <p className="text-center">Vous n'avez pas de projet.</p>}

        <div style={{ marginTop: '16px' }} className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
          <h3>Mes articles</h3>
          <div className="btn-toolbar mb-2 mb-md-0">
            <Link to="/magasin" className="btn btn-outline-primary btn-sm">Mon magasin</Link>
            <Link style={{ marginLeft: '10px' }} to="/mon-produit" className="btn btn-outline-success btn-sm"><FontAwesomeIcon icon={faPlusCircle} /> Nouvel article</Link>
          </div>
        </div>

        {products && products.length > 0
          ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Stock</th>
                  <th>Page du produit</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{product.name} <Badge color={this.getVisibiltyStringProduct(product.visibility)[0]}>{this.getVisibiltyStringProduct(product.visibility)[1]}</Badge></td>
                    <td>{product.stock}</td>
                    <td><Link to={`/produit/${product.url}`}>/produit/{product.url}</Link></td>
                    <td className="text-right">
                      <Link to={`/mon-produit/${product._id}`} className="btn btn-primary btn-sm">Modifier</Link>
                      { ' ' }
                      {
                        product.visibility === -1
                          ? <Button size="sm" onClick={() => this.publishProduct(product._id)} color="success">{waitingPublishRequest[product._id] === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Mettre en ligne'}</Button>
                          : (product.visibility === 0
                                && <Button size="sm" onClick={() => this.publishProduct(product._id)} color="warning">{waitingPublishRequest[product._id] === true ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" /> : 'Annuler la mise en ligne'}</Button>)
                      }
                      { ' ' }
                      {(product.visibility === -1 && <Button onClick={() => this.toggleRemoveProduct(product._id, false)} color="danger" size="sm"><FontAwesomeIcon icon={faTrashAlt} /></Button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
          : <p className="text-center">Vous n'avez pas d'article.</p>}


        <Modal isOpen={removeProjectModalOpen}>
          <ModalHeader toggle={() => this.toggleRemoveProject(null)}>Suppression d'un projet</ModalHeader>
          <ModalBody>
            Voulez-vous vraiment supprimer cet élément ? Le projet sera complètement supprimé et vous ne pourrez pas le récupérer.
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggleRemoveProject(null)}>Annuler</Button>{' '}
            <Button color="danger" onClick={() => this.toggleRemoveProject(null, true)}>Supprimer</Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={removeProductModalOpen}>
          <ModalHeader toggle={() => this.toggleRemoveProduct(null)}>Suppression d'un article</ModalHeader>
          <ModalBody>
            Voulez-vous vraiment supprimer cet élément ? Le projet sera complètement supprimé et vous ne pourrez pas le récupérer.
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => this.toggleRemoveProduct(null)}>Annuler</Button>{' '}
            <Button color="danger" onClick={() => this.toggleRemoveProduct(null, true)}>Supprimer</Button>
          </ModalFooter>
        </Modal>
      </Container>
    );
  }
}

export default withAlert(Dashboard);
