import React, { Component } from 'react';
import {
  Container, Table, Button, Alert,
} from 'reactstrap';
import CountrySelector from '../../../components/countriesSelector';
import { withAlert } from '../../../components/alert';

class Accounts extends Component {
    state = {
      searchInput: '',
      elements: null,
      userData: {
        _id: null,
        name: null,
        familyName: null,
        email: null,
        emailVerified: false,
        website: null,
        facebook: null,
        instagram: null,
        biography: null,
        companyName: null,
        address: null,
        address_two: null,
        city: null,
        country: null,
        state: null,
        zip: null,
      },
    }

    formUpdateUser = (e) => {
      e.preventDefault();
    }

    handleSearchInput = (e) => {
      const { alert } = this.props;

      // Update input
      this.setState({ searchInput: e.target.value });

      // Request
      Meteor.call('getUsers', e.target.value, (error, result) => {
        if (error) return alert.show(error.reason, { type: 'error' });
        this.setState({ elements: result });
      });
    }

    onClickAbout = (e) => {
      if (e !== null && e !== 0) {
        const { alert } = this.props;

        Meteor.call('getUser', e, (error, result) => {
          if (error) return alert.show(error.reason, { type: 'error' });

          this.setState({
            userData: {
              _id: result._id,
              name: result.profile.name,
              familyName: result.profile.familyName,
              email: result.emails[0].address,
              emailVerified: result.emails[0].verified,
              website: result.profile.website,
              facebook: result.profile.facebook,
              instagram: result.profile.instagram,
              biography: result.profile.biography,
              companyName: result.profile.companyName,
              address: result.profile.billing.address,
              address_two: result.profile.billing.address_two,
              city: result.profile.billing.city,
              country: result.profile.billing.country,
              state: result.profile.billing.state,
              zip: result.profile.billing.zip,
            },
          });

          this.biography.value = result.profile.biography;
        });
      } else {
        this.setState({
          userData: {
            _id: null,
            name: null,
            familyName: null,
            email: null,
            emailVerified: false,
            website: null,
            facebook: null,
            instagram: null,
            biography: null,
            companyName: null,
            address: null,
            address_two: null,
            city: null,
            country: null,
            state: null,
            zip: null,
          },
        });
      }
    }

    getRankId = (e) => {
      if (e == null) { return 0; }

      if (e.indexOf('administrator') > -1) { return 2; }
      if (e.indexOf('ban') > -1) { return 1; }
      return 0;
    }

    render() {
      document.title = 'Gestion des utilisateurs - Administration';
      const { elements, userData, searchInput } = this.state;
      const { alert } = this.props;

      const TableRow = ({ row }) => (
        <tr>
          <td>{row.profile.name}</td>
          <td>{row.profile.familyName}</td>
          <td>{row.emails[0].address}</td>
          <td className="text-right">
            <Button onClick={() => this.onClickAbout(row._id)} color="primary" size="sm">Voir</Button>
          </td>
        </tr>
      );

      return (
        <Container id="main-content">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3">
            { userData._id !== null ? (
              <React.Fragment>
                <h1 className="h2">Gestion des comptes</h1>

                <div className="btn-toolbar mb-2 mb-md-0">
                  <div className="btn-group mr-2">
                    <Button onClick={() => this.onClickAbout(0)} color="secondary" outline>Annuler</Button>
                    <Button
                      onClick={() => {
                        if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
                          Meteor.call('removeUserAccount', userData._id, (error) => {
                            if (error) return alert.show(error.reason, { type: 'error' });
                          });
                          this.setState({ elements: elements.filter(e => e._id !== elements._id) });
                        }
                      }}
                      color="danger"
                      outline
                    >Supprimer
                    </Button>
                  </div>
                </div>
              </React.Fragment>
            ) : null}
          </div>

          { userData._id !== null ? (
            <form id="pageForm" onSubmit={this.formUpdateUser}>
              <h4>Compte de {userData.name} {userData.familyName}</h4>
              <div className="form-group">
                <select ref={(input) => { this.rank = input; }} defaultValue={this.getRankId(userData.roles)} className="form-control">
                  <option value="0">Normal</option>
                  <option value="1">Bannis</option>
                  <option value="2">Administrateur</option>
                </select>
              </div>

              <div className="form-group form-row">
                <div className="col">
                  <input defaultValue={userData.name} disabled className="form-control" placeholder="Prénom" required type="text" />
                </div>

                <div className="col">
                  <input defaultValue={userData.familyName} disabled className="form-control" placeholder="Nom de famille" required type="text" />
                </div>
              </div>

              {(!userData.emailVerified && <Alert color="warning">L'adresse email n'a pas encore été vérifiée par l'utilisateur.</Alert>)}
              <div className="form-group">
                <input defaultValue={userData.email} disabled className="form-control" placeholder="Adresse e-mail" required type="email" />
              </div>

              <div className="form-group form-row">
                <div className="col">
                  <div className="form-group">
                    <input aria-label="Nom de votre entreprise / association" defaultValue={userData.companyName} disabled className="form-control" placeholder="Nom de votre entreprise / association (optionnel)" type="text" />
                  </div>

                  <div className="form-group">
                    <input aria-label="Votre site internet" defaultValue={userData.website} disabled className="form-control" placeholder="Url de votre site internet (optionnel)" type="text" />
                  </div>
                </div>

                <div className="col">
                  <div className="form-group">
                    <input aria-label="Instagram" defaultValue={userData.instagram} disabled className="form-control" placeholder="Url page instagram (optionnel)" type="text" />
                  </div>

                  <div className="form-group">
                    <input aria-label="Facebook" defaultValue={userData.facebook} disabled className="form-control" placeholder="Url page facebook (optionnel)" type="text" />
                  </div>
                </div>
              </div>

              <textarea defaultValue={userData.biography} disabled placeholder="Votre biographie (optionnel)" className="form-control" maxLength="450" rows="4" /><br />

              <h4 className="mb-3">Mon adresse</h4>
              <div className="form-group">
                <input aria-label="Adresse" defaultValue={userData.address} disabled type="text" className="form-control" id="address" placeholder="Adresse" />
              </div>

              <div className="form-group">
                <input aria-label="Adresse 2 (Optionnel)" defaultValue={userData.address_two} disabled type="text" className="form-control" id="address2" placeholder="Adresse 2 (Optionnel)" />
              </div>

              <div className="form-group">
                <input aria-label="Ville" defaultValue={userData.city} disabled type="text" className="form-control" id="city" placeholder="Ville" />
              </div>

              <div className="row">
                <div className="col-md-5 mb-3">
                  <select defaultValue={userData.country} aria-label="Pays" disabled className="custom-select d-block w-100" id="country">
                    <option value="">Choisir...</option>
                    <CountrySelector />
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <input aria-label="Région" defaultValue={userData.state} disabled type="text" className="form-control" placeholder="Région" id="state" />
                </div>
                <div className="col-md-3 mb-3">
                  <input aria-label="Code postal" defaultValue={userData.zip} disabled type="text" className="form-control" id="zip" placeholder="Code Postal" />
                </div>
              </div>

            </form>
          ) : (
            <React.Fragment>
              <div className="text-center" style={{ marginTop: '16px', marginBottom: '24px' }}>
                <h3>Qui cherchez-vous ?</h3>
                <input value={searchInput} onChange={this.handleSearchInput} type="text" className="form-control" placeholder="Votre recherche (nom, prénom ou email)" style={{ width: '75%', margin: 'auto' }} />
              </div>

              {elements !== null && (
                <Table striped>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {elements.map(row => <TableRow key={row._id} row={row} />)}
                  </tbody>
                </Table>
              )}
            </React.Fragment>
          )}
        </Container>
      );
    }
}

export default withAlert(Accounts);
