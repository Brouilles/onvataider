import React, { Component } from 'react';
import { Accounts } from 'meteor/accounts-base';
import { Button, Alert } from 'reactstrap';

export default class index extends Component {
    state = {
      error: null,
      success: null,
    };

      resetPassword = (e) => {
        e.preventDefault();

        if (this.password.value !== this.passwordAgain.value) { return this.setState({ error: 'Erreur, les mots de passe ne sont pas identiques.' }); }

        Accounts.resetPassword(this.props.match.params.token, this.password.value, (error) => {
          if (error) return this.setState({ error: error.reason, success: null });

          this.setState({ success: 'Modification du mot de passe réussi !', error: null });
        });
      };

      render() {
        document.title = 'Récupération de mot de passe - Onvataider.com';
        const { error, success } = this.state;

        return (
          <form id="main-content" className="form-registration text-center" onSubmit={this.resetPassword}>
            <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
            <h1 className="h3 mb-3 font-weight-normal">Réinitialisation du mot de passe</h1>

            {success !== null && <Alert color="success">{success}</Alert>}
            {error !== null && <Alert color="danger">{error}</Alert>}

            <div className="form-group">
              <label htmlFor="inputPassword" className="sr-only">Mot de passe
                <input ref={(input) => { this.password = input; }} id="inputPassword" className="form-control" placeholder="Mot de passe" required type="password" />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="inputPasswordAgain" className="sr-only">Confirmation mot de passe
                <input ref={(input) => { this.passwordAgain = input; }} id="inputPasswordAgain" className="form-control" placeholder="Confirmation mot de passe" required type="password" />
              </label>
            </div>

            <Button color="primary" size="lg" block type="submit">Validation</Button>
          </form>
        );
      }
}
