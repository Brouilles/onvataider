import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  Button, Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import styled from 'styled-components';
import { withAlert } from '../../../components/alert';
import Toggle from '../../../components/toggle';

class Login extends Component {
    login = (e) => {
      e.preventDefault();
      const { history, alert } = this.props;

      Meteor.loginWithPassword(
        this.email.value,
        this.password.value,
        (error) => {
          if (error) { return alert.show('Le compte n\'existe pas ou votre nom de compte / mot de passe est invalide.', { type: 'error' }); }

          history.push('/');
        },
      );
    }

    render() {
      document.title = 'Connexion - Onvataider.com';
      const { alert } = this.props;

      return (
        <Wrapper id="main-content">
          <form onSubmit={this.login}>
            <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
            <h1 className="h3 mb-3 font-weight-normal">Veuillez vous connecter</h1>

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

            <Button color="primary" size="lg" block type="submit">Se connecter</Button>
          </form>

          <hr />
          <p>
            Vous n&apos;avez pas de compte ? <Link to="/inscription">Inscrivez-vous</Link> <br />
            <Toggle>
              {({ on, toggle }) => (
                <React.Fragment>
                  {on
                    && (
                    <Modal isOpen={on} toggle={toggle}>
                      <ModalHeader toggle={toggle}>Réinitialisation du mot de passe</ModalHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();

                        Accounts.forgotPassword({ email: this.modal_forgotPassword_email.value }, (error) => {
                          if (error) {
                            alert.show('L\'utilisateur n\'existe pas.', { type: 'error' });
                            return;
                          }

                          alert.show('Une demande de réinitialisation de mot de passe a été demandée. Merci de vérifier votre boîte e-mail.', { type: 'success' });
                        });
                        toggle();
                      }}
                      >
                        <ModalBody>
                          <div className="form-group">
                            <input ref={(input) => { this.modal_forgotPassword_email = input; }} id="inputEmail" className="form-control" placeholder="Adresse e-mail" required type="email" />
                          </div>
                        </ModalBody>
                        <ModalFooter>
                          <Button color="secondary" onClick={toggle}>Annuler</Button>{' '}
                          <Button color="primary" type="submit">Lancer la réinitialisation</Button>
                        </ModalFooter>
                      </form>
                    </Modal>
                    )}

                  <a href="#" onClick={toggle}>Mot de passe perdu ›</a>
                </React.Fragment>
              )}
            </Toggle>
          </p>
        </Wrapper>
      );
    }
}

export default withAlert(withRouter(Login));

const Wrapper = styled.div`
    width: 100%;
    max-width: 460px;
    padding: 15px;
    margin: 0 auto;
    text-align: center;

    label { width: 100%; display: block; margin: 0; }
`;
