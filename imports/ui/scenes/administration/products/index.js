import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Table, Button, Badge, Nav, NavItem, NavLink,
  TabContent, TabPane, Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { withAlert } from '../../../components/alert';

class Products extends Component {
    state = {
      activeTab: '0',
      modal: null,
      modalId: 0,
      validateWaiting: false,

      productsDraft: null,
      productsWaiting: null,
      productsOnline: null,
      productsInvisible: null,
    }

    componentDidMount() {
      this.loadProducts('0');
    }

    loadProducts = (visibility) => {
      const { alert } = this.props;

      Meteor.call('AdministrationGetProducts', parseInt(visibility, 10), (error, result) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        switch (visibility) {
          case '-1':
            this.setState({ productsDraft: result });
            break;
          case '0':
            this.setState({ productsWaiting: result });
            break;
          case '1':
            this.setState({ productsOnline: result });
            break;
          case '-2':
            this.setState({ productsInvisible: result });
            break;
          default: break;
        }
      });
    }

    toggle = (tab) => {
      this.setState({
        activeTab: tab,
      });

      this.loadProducts(tab);
    }

    modalToggle = (id = 0) => {
      const { modal } = this.state;

      this.setState({
        modal: !modal,
        modalId: id,
      });
    }

    validateProduct = (isValidate) => {
      const { modalId } = this.state;
      const { alert } = this.props;

      this.setState({ validateWaiting: isValidate });

      Meteor.call('AdministrationProductValidate', {
        id: modalId,
        isValidate,
        msg: this.validatePublishMsg.value,
      }, (error) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        this.setState({ modal: false, validateWaiting: false });
        alert.show('Modification de la visibilité du produit réussi !', { type: 'success' });
        this.loadProducts('0');
      });
    }

    render() {
      document.title = 'Gestion des produits - Administration';
      const {
        activeTab, productsWaiting, productsOnline, productsDraft,
        productsInvisible, modal, validateWaiting,
      } = this.state;

      const TableRow = ({ row }) => (
        <tr>
          <td>{row.name}</td>
          <td>{row.stock} en réserve</td>
          <td className="text-right">
            <Link to={`/mon-produit/${row._id}`} className="btn btn-primary btn-sm">Modifier</Link>
            { ' ' }
            {(row.visibility === 0 && <Button onClick={() => this.modalToggle(row._id, row.visibility, false)} color="success" size="sm">Visibilité</Button>)}
            { ' ' }
            {(row.visibility === -1 && (
            <Button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
                  Meteor.call('removeProduct', row._id);
                }
              }}
              color="danger"
              size="sm"
            >
                Supprimer
            </Button>
            ))}
          </td>
        </tr>
      );

      return (
        <Container id="main-content">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
              <h1 className="h2">Produits</h1>
            </div>

            <Nav tabs>
              <NavItem>
                <NavLink
                  className={(activeTab === '0' ? 'active' : null)}
                  onClick={() => { this.toggle('0'); }}
                >
                    En attente de validation <Badge>{productsWaiting ? productsWaiting.length : 0}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '1' ? 'active' : null)}
                  onClick={() => { this.toggle('1'); }}
                >
                    En ligne
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '-1' ? 'active' : null)}
                  onClick={() => { this.toggle('-1'); }}
                >
                    Brouillon
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '-2' ? 'active' : null)}
                  onClick={() => { this.toggle('-2'); }}
                >
                    Plus disponible
                </NavLink>
              </NavItem>
            </Nav>
          </div>

          <TabContent activeTab={activeTab}>
            <TabPane tabId="0">
              {(productsWaiting && productsWaiting.length > 0
                  && (
                  <Table striped>
                    <tbody>
                      {productsWaiting.map(row => <TableRow key={row._id} row={row} />)}
                    </tbody>
                  </Table>
                  )
                )}
            </TabPane>
            <TabPane tabId="1">
              {(productsOnline && productsOnline.length > 0
                  && (
                  <Table striped>
                    <tbody>
                      {productsOnline.map(row => <TableRow key={row._id} row={row} />)}
                    </tbody>
                  </Table>
                  )
                )}
            </TabPane>
            <TabPane tabId="-1">
              {(productsDraft && productsDraft.length > 0
                  && (
                  <Table striped>
                    <tbody>
                      {productsDraft.map(row => <TableRow key={row._id} row={row} />)}
                    </tbody>
                  </Table>
                  )
                )}
            </TabPane>
            <TabPane tabId="-2">
              {(productsInvisible && productsInvisible.length > 0
                  && (
                  <Table striped>
                    <tbody>
                      {productsInvisible.map(row => <TableRow key={row._id} row={row} />)}
                    </tbody>
                  </Table>
                  )
                )}
            </TabPane>
          </TabContent>

          <Modal isOpen={modal}>
            <ModalHeader toggle={() => this.modalToggle(0)}>Modification de la visibilité du produit</ModalHeader>
            <ModalBody>
              <h4 className="text-center">Validation du produit ?</h4>
              <div className="form-group">
                <textarea ref={(input) => { this.validatePublishMsg = input; }} className="form-control" rows="3" />
                <small className="form-text text-muted">Un commentaire ? Le message sera inclus dans l'email que va recevoir le créateur du produit.</small>
              </div>

              <div className="text-center">
                { validateWaiting === true
                  ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />
                  : (
                    <React.Fragment>
                      <Button onClick={() => this.validateProduct(true)} color="success">Valider</Button>
                      { ' ' }
                      <Button onClick={() => this.validateProduct(false)} color="danger">Refuser</Button>
                    </React.Fragment>
                  )}
              </div>

            </ModalBody>
            <ModalFooter>
              <Button color="primary" onClick={() => this.modalToggle(0)}>Annuler</Button>
            </ModalFooter>
          </Modal>
        </Container>
      );
    }
}

export default withAlert(Products);
