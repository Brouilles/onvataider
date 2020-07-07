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

class Projects extends Component {
    state = {
      activeTab: '1',
      modal: null,
      modalId: 0,
      validateProjectWaiting: false,

      projectsDraft: null,
      projectsWaiting: null,
      projectsOpen: null,
      projectsClose: null,
    }

    componentDidMount() {
      this.loadProjects('1');
    }

    loadProjects = (visibility) => {
      const { alert } = this.props;

      Meteor.call('AdministrationGetProjects', visibility, (error, result) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        switch (visibility) {
          case '2':
            this.setState({ projectsOpen: result });
            break;
          case '1':
            this.setState({ projectsWaiting: result });
            break;
          case '3':
            this.setState({ projectsClose: result });
            break;
          case '0':
            this.setState({ projectsDraft: result });
            break;
          default: break;
        }
      });
    }

    toggle = (tab) => {
      this.setState({
        activeTab: tab,
      });

      this.loadProjects(tab);
    }

    getTypeString= (e) => {
      switch (e) {
        case 0:
          return 'Projet';
        case 2:
          return 'Collecte solidaire';
        default: break;
      }
    }

    modalToggle = (id = 0) => {
      const { modal } = this.state;

      this.setState({
        modal: !modal,
        modalId: id,
      });
    }

    validateProject = (isValidate) => {
      const { modalId } = this.state;
      const { alert } = this.props;

      this.setState({ validateProjectWaiting: true });

      Meteor.call('AdministrationWaitingAction', {
        id: modalId,
        isValidate,
        msg: this.validatePublishMsg.value,
      }, (error) => {
        if (error) { return alert.show(error.reason, { type: 'error' }); }

        this.setState({ modal: false, validateProjectWaiting: false });
        alert.show('Modification de la visibilité du projet réussi !', { type: 'success' });
        this.loadProjects('1');
      });
    }

    render() {
      document.title = 'Gestion des projets - Administration';
      const {
        activeTab, projectsWaiting, projectsOpen, projectsDraft, projectsClose, modal,
        validateProjectWaiting,
      } = this.state;

      const TableRow = ({ row }) => (
        <tr>
          <td>{row.name}</td>
          <td>{this.getTypeString(row.type)}</td>
          <td className="text-right">
            <Link to={`/projet/${row.url}`} className="btn btn-primary btn-sm">Voir</Link> <Link to={`/edition-projet/${row._id}`} className="btn btn-primary btn-sm">Modifier</Link> {(row.visibility === 1 || row.visibility === 2 || row.visibility === 3 ? <Button onClick={() => this.modalToggle(row._id)} color="success" size="sm">Visibilité</Button> : null)}
            { ' ' }
            { row.visibility === 0
            && (
            <Button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
                  Meteor.call('removeProject', row._id);
                }
              }}
              color="danger"
              size="sm"
            >Supprimer
            </Button>
            )
          }
          </td>
        </tr>
      );

      return (
        <Container id="main-content">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
              <h1 className="h2">Projets</h1>
            </div>

            <Nav tabs>
              <NavItem>
                <NavLink
                  className={(activeTab === '1' ? 'active' : null)}
                  onClick={() => { this.toggle('1'); }}
                >
                    En attente de validation <Badge>{projectsWaiting && projectsWaiting.length}</Badge>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '2' ? 'active' : null)}
                  onClick={() => { this.toggle('2'); }}
                >
                    En ligne
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '3' ? 'active' : null)}
                  onClick={() => { this.toggle('3'); }}
                >
                    Fini
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={(activeTab === '0' ? 'active' : null)}
                  onClick={() => { this.toggle('0'); }}
                >
                    Brouillon
                </NavLink>
              </NavItem>
            </Nav>
          </div>

          <TabContent activeTab={activeTab}>
            <TabPane tabId="1">
              {(projectsWaiting && projectsWaiting.length > 0 ? (
                <Table striped>
                  <tbody>
                    {projectsWaiting.map(row => <TableRow key={row._id} row={row} />)}
                  </tbody>
                </Table>
              ) : null)}
            </TabPane>
            <TabPane tabId="2">
              {(projectsOpen && projectsOpen.length > 0 ? (
                <Table striped>
                  <tbody>
                    {projectsOpen.map(row => <TableRow key={row._id} row={row} />)}
                  </tbody>
                </Table>
              ) : null)}
            </TabPane>
            <TabPane tabId="3">
              {(projectsClose && projectsClose.length > 0 ? (
                <Table striped>
                  <tbody>
                    {projectsClose.map(row => <TableRow key={row._id} row={row} />)}
                  </tbody>
                </Table>
              ) : null)}
            </TabPane>
            <TabPane tabId="0">
              {(projectsDraft && projectsDraft.length > 0 ? (
                <Table striped>
                  <tbody>
                    {projectsDraft.map(row => <TableRow key={row._id} row={row} />)}
                  </tbody>
                </Table>
              ) : null)}
            </TabPane>
          </TabContent>

          <Modal isOpen={modal}>
            <ModalHeader toggle={() => this.modalToggle(0)}>Modification de la visibilité du projet</ModalHeader>
            <ModalBody>
              <h4 className="text-center">Validation du projet ?</h4>
              <div className="form-group">
                <textarea ref={(input) => { this.validatePublishMsg = input; }} className="form-control" rows="3" />
                <small className="form-text text-muted">Un commentaire ? Le message sera inclus dans l'email que va recevoir le créateur du projet.</small>
              </div>

              <div className="text-center">
                { validateProjectWaiting === true
                  ? <FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />
                  : (
                    <React.Fragment>
                      <Button onClick={() => this.validateProject(true)} color="success">Valider</Button>
                      { ' ' }
                      <Button onClick={() => this.validateProject(false)} color="danger">Refuser</Button>
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

export default withAlert(Projects);
