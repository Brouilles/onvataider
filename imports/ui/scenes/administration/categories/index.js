import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Container, Table, Button,
} from 'reactstrap';
import { withAlert } from '../../../components/alert';

class Categories extends Component {
    state = {
      elements: null,
      edit: null,
      data: {
        _id: null,
        name: null,
      },
    }

    componentDidMount() {
      Meteor.call('getCategories', (error, result) => {
        this.setState({ elements: result });
      });
    }

    toggle = (e) => {
      this.setState({
        edit: e,
      });

      if (e !== null && e !== 0) {
        Meteor.call('getCategoryById', e, (error, result) => {
          this.setState({
            data: {
              _id: result._id,
              name: result.name,
            },
          });
        });
      } else {
        this.setState({
          data: {
            _id: null,
            name: null,
          },
        });
      }
    }

    formUpdateOrCreateCategory = (e) => {
      e.preventDefault();
      const { data, elements } = this.state;
      const { alert } = this.props;

      if (data._id === null) {
        Meteor.call('createCategory', { name: this.inputName.value }, (error, result) => {
          if (error) { return alert.show(error.reason, { type: 'error' }); }

          this.setState({
            elements: [...elements, {
              _id: result._id,
              name: this.inputName.value,
              url: result.url,
            }],
          });
          alert.show('Création de la catégorie réussie !', { type: 'success' });
        });
      } else {
        Meteor.call('updateCategory', { id: data._id, name: this.inputName.value }, (error) => {
          if (error) { return alert.show(error.reason, { type: 'error' }); }

          alert.show('Modification de la catégorie réussie !', { type: 'success' });
        });
      }
    }

    render() {
      document.title = 'Gestion des catégories - Administration';
      const { data, edit, elements } = this.state;

      const TableRow = ({ row }) => (
        <tr>
          <td>{row.name}</td>
          <td className="text-right">
            <Button onClick={() => this.toggle(row._id)} color="primary" size="sm">Modifier</Button>
            { ' ' }
            <Button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
                  Meteor.call('removeCategory', row._id);
                  this.setState({ elements: elements.filter(e => e._id !== row._id) });
                }
              }}
              color="danger"
              size="sm"
            >Supprimer
            </Button>
          </td>
        </tr>
      );

      return (
        <Container id="main-content">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
            <h1 className="h2">Gestion des catégories</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              { edit === null ? (
                <Button onClick={() => this.toggle(0)} color="success" outline>Nouveau</Button>
              ) : (
                <div className="btn-group mr-2">
                  <Button onClick={() => this.toggle(null)} color="secondary" outline>Annuler</Button>
                  <Button color="success" form="form" type="submit" outline>{edit !== 0 ? 'Modifier' : 'Ajouter'}</Button>
                </div>
              )}
            </div>
          </div>

          { data._id === null && edit !== 0 ? (
            <Table striped>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {elements !== null && elements.map(row => <TableRow key={row._id} row={row} />)}
              </tbody>
            </Table>
          ) : (
            <form id="form" onSubmit={this.formUpdateOrCreateCategory}>
              <div className="form-group">
                <input ref={(input) => { this.inputName = input; }} defaultValue={data.name} className="form-control" placeholder="Nom de la catégorie" required type="text" />
              </div>
            </form>
          )}
        </Container>
      );
    }
}

export default withAlert(Categories);
