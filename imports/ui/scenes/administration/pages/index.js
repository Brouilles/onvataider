/* eslint no-underscore-dangle: 0 */
/* eslint no-alert: 0 */
/* eslint no-restricted-globals: 0 */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import {
  Container, Table, Button,
} from 'reactstrap';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import { withAlert } from '../../../components/alert';

class Pages extends Component {
    state = {
      elements: null,
      editPage: null,
      pageData: {
        _id: null,
        name: null,
        content: null,
        url: null,
        visibility: null,
      },
    };

    componentDidMount() {
      Meteor.call('getPages', (error, result) => {
        this.setState({ elements: result });
      });
    }

    getVisibiltyString = (e) => {
      switch (e) {
        case 0:
          return 'Brouillon';
        default:
          return 'En ligne';
      }
    }

    toggle = (e) => {
      this.setState({
        editPage: e,
      });

      if (e !== null && e !== 0) {
        Meteor.call('getPageById', e, (error, result) => {
          this.setState({
            pageData: {
              _id: result._id,
              name: result.name,
              content: result.content,
              url: result.url,
              visibility: result.visibility,
            },
          });
        });
      } else {
        this.setState({
          pageData: {
            _id: null,
            name: null,
            content: null,
            url: null,
            visibility: null,
          },
        });
      }
    }

    formUpdateOrCreatePage = (e) => {
      e.preventDefault();
      const { pageData, elements } = this.state;
      const { alert } = this.props;

      if (pageData._id === null) { // Create a new page
        Meteor.call('createPage', {
          name: this.inputName.value,
          url: this.inputUrl.value,
          visibility: parseInt(this.inputVisibility.value, 10),
          content: pageData.content,
        },
        (error, result) => {
          if (error) { return alert.show(error.reason, { type: 'error' }); }

          this.setState({
            elements: [...elements, {
              _id: result,
              name: this.inputName.value,
              url: this.inputUrl.value,
              visibility: parseInt(this.inputVisibility.value, 10),
            }],
          });
          alert.show('Création de la page réussie !', { type: 'success' });
        });
      } else {
        Meteor.call('updatePage', {
          id: pageData._id,
          name: this.inputName.value,
          url: this.inputUrl.value,
          visibility: parseInt(this.inputVisibility.value, 10),
          content: pageData.content,
        },
        (error) => {
          if (error) { return alert.show(error.reason, { type: 'error' }); }

          alert.show('Modification de la page réussie !', { type: 'success' });
        });
      }
    };

    handleContent = (value) => {
      const { pageData } = this.state;

      this.setState({
        pageData: {
          ...pageData,
          content: value,
        },
      });
    }

    render() {
      document.title = 'Gestion des pages - Administration';
      const {
        elements, editPage, pageData,
      } = this.state;

      const TableRow = ({ row }) => (
        <tr>
          <td>{row.name}</td>
          <td><Link to={`/${row.url}`} target="_blank">{row.url}</Link></td>
          <td>{this.getVisibiltyString(row.visibility)}</td>
          <td className="text-right">
            <Button onClick={() => this.toggle(row._id)} color="primary" size="sm">Modifier</Button>
            {'  '}
            <Button
              onClick={() => {
                if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
                  Meteor.call('removePage', row._id);
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
            <h1 className="h2">Gestion des pages</h1>
            <div className="btn-toolbar mb-2 mb-md-0">
              { editPage === null ? (
                <Button onClick={() => this.toggle(0)} color="success" outline>Nouveau</Button>
              ) : (
                <div className="btn-group mr-2">
                  <Button onClick={() => this.toggle(null)} color="secondary" outline>Annuler</Button>
                  <Button color="success" form="pageForm" type="submit" outline>{editPage !== 0 ? 'Modifier' : 'Ajouter'}</Button>
                </div>
              )}
            </div>
          </div>

          { pageData._id === null && editPage !== 0 ? (
            <Table striped>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Url</th>
                  <th>Visibilité</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {elements !== null && elements.map(row => <TableRow key={row._id} row={row} />)}
              </tbody>
            </Table>
          ) : (
            <form id="pageForm" onSubmit={this.formUpdateOrCreatePage}>
              <div className="form-group">
                <input ref={(input) => { this.inputName = input; }} defaultValue={pageData.name} className="form-control" placeholder="Nom de la page" required type="text" />
              </div>

              <div className="form-group form-row">
                <div className="col">
                  <input ref={(input) => { this.inputUrl = input; }} defaultValue={pageData.url} className="form-control" placeholder="url" required type="text" />
                </div>
                <div className="col">
                  <select ref={(input) => { this.inputVisibility = input; }} defaultValue={pageData.visibility} className="form-control">
                    <option value="0">{this.getVisibiltyString(0)}</option>
                    <option value="1">{this.getVisibiltyString(1)}</option>
                  </select>
                </div>
              </div>

              <ReactQuill
                value={pageData.content}
                onChange={this.handleContent}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, { align: [] }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
              />
            </form>
          )}
        </Container>
      );
    }
}

export default withAlert(Pages);
