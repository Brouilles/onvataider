import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Button, Alert } from 'reactstrap';
import { Meteor } from 'meteor/meteor';
import styled from 'styled-components';

class Register extends Component {
    state = {
      error: null,
    };

    register = (e) => {
      e.preventDefault();
      const { history } = this.props;

      if (this.password.value !== this.passwordAgain.value) {
        return this.setState({ error: 'Erreur, les mots de passe ne sont pas identiques.' });
      }

      Accounts.createUser(
        {
          email: this.email.value,
          password: this.password.value,
          profile: {
            name: this.name.value,
            familyName: this.familyName.value,
          },
        },
        (error) => {
          if (error) { return this.setState({ error: error.reason }); }

          Meteor.call('sendVerificationLink');
          history.push('/');
        },
      );
    }

    render() {
      document.title = 'Inscription - Onvataider.com';
      const { error } = this.state;

      return (
        <div id="main-content">
          <FormWrapper onSubmit={this.register}>
            <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
            <h1 className="h3 mb-3 font-weight-normal">Créer un compte</h1>

            {error != null && (
              <Alert color="danger">{error}</Alert>
            )}

            <div className="form-group form-row">
              <div className="col">
                <label htmlFor="inputName" aria-label="Prénom">
                  <input ref={(input) => { this.name = input; }} id="inputName" className="form-control" placeholder="Prénom" required type="text" />
                </label>
              </div>

              <div className="col">
                <label htmlFor="inputFamilyName" aria-label="Nom de famille">
                  <input ref={(input) => { this.familyName = input; }} id="inputFamilyName" className="form-control" placeholder="Nom de famille" required type="text" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inputEmail" aria-label="Email">
                <input ref={(input) => { this.email = input; }} id="inputEmail" className="form-control" placeholder="Adresse e-mail" required type="email" />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="inputPassword" aria-label="Mot de passe">
                <input ref={(input) => { this.password = input; }} id="inputPassword" className="form-control" placeholder="Mot de passe" required type="password" />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="inputPasswordAgain" aria-label="Confirmation mot de passe">
                <input ref={(input) => { this.passwordAgain = input; }} id="inputPasswordAgain" className="form-control" placeholder="Confirmation mot de passe" required type="password" />
              </label>
            </div>

            <Button color="primary" size="lg" block type="submit">Continuer</Button>
            <hr />
            <p>
                    Vous avez déjà un compte ? <Link to="/connexion">Connectez-vous</Link> <br />
            </p>
          </FormWrapper>
        </div>
      );
    }
}

export default withRouter(Register);

const FormWrapper = styled.form`
    width: 100%;
    max-width: 460px;
    padding: 15px;
    margin: 0 auto;
    text-align: center;

    label { width: 100%; display: block; margin: 0; }
`;
