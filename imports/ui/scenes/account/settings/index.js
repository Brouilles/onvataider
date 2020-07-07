import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import {
  Container, Button, Alert, Collapse,
  Card, CardBody, Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { withAlert } from '../../../components/alert';
import CountrySelector from '../../../components/countriesSelector';
import Toggle from '../../../components/toggle';

class Settings extends Component {
    state = {
      collapse: false,
      gdprData: null,
      waitingRequestStripe: null,
      userData: {
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
        haveStripeCustomAccount: null,
      },
    };

    componentDidMount() {
      const { alert } = this.props;

      Meteor.call('getUserData',
        (error, result) => {
          if (error) { return alert.show(error.message, { type: 'error' }); }

          this.setState({
            userData: {
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
              haveStripeCustomAccount: result.profile.stripeCustomAccountId != null,
            },
          });

          this.biography.value = result.profile.biography;
        },
      );
    }

    collapseToggle = () => {
      const { userData, collapse } = this.state;
      const { alert } = this.props;

      if (userData.haveStripeCustomAccount && collapse === false) {
        Meteor.call('getUserStripeData', (error, result) => {
          if (error) { return alert.show(error.message, { type: 'error' }); }

          this.stripeName.value = result[0];
          this.stripeFamilyName.value = result[1];

          this.stripeDobDay.value = result[2];
          this.stripeDobMonth.value = result[3];
          this.stripeDobYear.value = result[4];

          this.setState({ collapse: !collapse });
        });
      } else {
        this.setState({ collapse: !collapse });
      }
    }

    updateAccount = (e) => {
      e.preventDefault();
      const { alert } = this.props;

      Meteor.call('updateAccount',
        {
          name: this.name.value,
          familyName: this.familyName.value,
          email: this.email.value,
          website: this.website.value,
          facebook: this.facebook.value,
          instagram: this.instagram.value,
          biography: this.biography.value,
          companyName: this.companyName.value,
        },
        (error) => {
          if (error) {
            alert.show(error.message, { type: 'error' });
            return;
          }

          alert.show('Mise à jour du profil !', { type: 'success' });
        },
      );
    }

    resendVerificationLink = (e) => {
      e.preventDefault();
      const { alert } = this.props;

      Meteor.call('sendVerificationLink',
        (error) => {
          if (error) {
            alert.show('Erreur lors de l\'envoi de l\'email de vérification, veuillez réessayer.', { type: 'error' });
            return;
          }

          alert.show('Email de vérification envoyé', { type: 'success' });
        },
      );
    }

    updatePassword = (e) => {
      e.preventDefault();
      const { alert } = this.props;

      if (this.inputPassword.value !== this.inputPasswordAgain.value) { return alert.show('Erreur, les mots de passe ne sont pas identiques.', { type: 'error' }); }

      Accounts.changePassword(this.inputCurrentPassword.value, this.inputPassword.value, (error) => {
        if (error) return alert.show(error.message, { type: 'error' });

        alert.show('Modification du mot de passe réussi !', { type: 'success' });
      });
    }

    formStripeAccount = (e) => {
      e.preventDefault();
      this.setState({ waitingRequestStripe: true });
      const stripe = Stripe(Meteor.settings.public.stripe);

      const { userData } = this.state;
      const { alert } = this.props;

      if (userData.haveStripeCustomAccount === false) {
        const stripeFunction = async () => {
          const data = new FormData();
          data.append('file', document.querySelector('#id-file').files[0]);
          data.append('purpose', 'identity_document');
          const fileResult = await fetch('https://uploads.stripe.com/v1/files', {
            method: 'POST',
            headers: { Authorization: `Bearer ${Meteor.settings.public.stripe}` },
            body: data,
          });
          const fileData = await fileResult.json();

          const result = await stripe.createToken('account', {
            legal_entity: {
              first_name: this.stripeName.value,
              last_name: this.stripeFamilyName.value,
              type: 'individual',
              dob: {
                day: parseInt(this.stripeDobDay.value, 10),
                month: parseInt(this.stripeDobMonth.value, 10),
                year: parseInt(this.stripeDobYear.value, 10),
              },
              address: {
                line1: this.stripeAddress.value,
                city: this.stripeCity.value,
                state: this.stripeState.value,
                postal_code: this.stripeZip.value,
              },
              verification: {
                document: fileData.id,
              },
            },
            tos_shown_and_accepted: true,
          });

          if (result.token) {
            // Create bank token
            const bankToken = await stripe.createToken('bank_account', {
              country: 'FR',
              currency: 'eur',
              account_number: this.stripeIBAN.value,
              account_holder_name: this.stripeBankHolder.value,
              account_holder_type: 'individual',
            });

              // Call server
            if (bankToken.token) {
              Meteor.call('createStripeAccount', { token: result.token.id, btoken: bankToken.token.id }, (error) => {
                if (error) {
                  alert.show(error.message, { type: 'error' });
                  return this.setState({ waitingRequestStripe: false });
                }

                alert.show('Création de votre compte Stripe réussi !', { type: 'success' });
                this.setState({ waitingRequestStripe: false, collapse: false });
              });
            } else {
              alert.show('Erreur lors de la création du compte Stripe, vérifiez vos informations bancaires et ressayez.', { type: 'error' });
              this.setState({ waitingRequestStripe: false });
            }
          } else {
            alert.show('Erreur lors de la création du compte Stripe, vérifiez vos informations et ressayez.', { type: 'error' });
            this.setState({ waitingRequestStripe: false });
          }
        };
        stripeFunction();
      } else {
        const stripeFunction = async () => {
          const result = await stripe.createToken('account', {
            legal_entity: {
              address: {
                line1: this.stripeAddress.value,
                city: this.stripeCity.value,
                state: this.stripeState.value,
                postal_code: this.stripeZip.value,
              },
            },
          });

          let bankToken = null;
          if (this.stripeIBAN.value.length > 0) {
            const tempBankToken = await stripe.createToken('bank_account', {
              country: 'FR',
              currency: 'eur',
              account_number: this.stripeIBAN.value,
              account_holder_name: this.stripeBankHolder.value,
              account_holder_type: 'individual',
            });

            if (tempBankToken.token) { bankToken = tempBankToken.token.id; } else {
              alert.show('Erreur lors de la modification du compte en banque, vérifiez vos informations et ressayez.', { type: 'error' });
              return this.setState({ waitingRequestStripe: false });
            }
          }

          // Call server for update
          Meteor.call('updateStripeData', { token: result.token.id, btoken: bankToken }, (error) => {
            if (error) {
              alert.show(error.message, { type: 'error' });
              return this.setState({ waitingRequestStripe: false });
            }

            alert.show('Modification de votre compte Stripe réussi !', { type: 'success' });
            this.setState({ waitingRequestStripe: false });
          });
        };
        stripeFunction();
      }
    }

    updateBilling = (e) => {
      e.preventDefault();
      const { alert } = this.props;

      Meteor.call('updateBilling',
        {
          address: this.address.value,
          address_two: this.address_two.value,
          city: this.city.value,
          state: this.countryState.value,
          zip: this.zip.value,
          country: this.country.value,
        },
        (error) => {
          if (error) {
            alert.show(error.message, { type: 'error' });
            return;
          }

          alert.show('Mise à jour des informations de facturation !', { type: 'success' });
        },
      );
    }

    getGdprData = () => {
      const { alert } = this.props;

      Meteor.call('getAllDataAboutMe',
        (error, result) => {
          if (error) {
            alert.show('Erreur inattendue.', { type: 'error' });
            return;
          }

          this.setState({ gdprData: result });
        },
      );
    }

    render() {
      document.title = 'Mon compte - Onvataider.com';
      const {
        gdprData, userData, collapse, waitingRequestStripe,
      } = this.state;

      return (
        <Container id="main-content">
          <div className="py-5 text-center">
            <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
            <h2>Mon compte</h2>
            <p className="lead">Gérez vos paramètres de visibilité et les données que nous utilisons pour personnaliser votre expérience utilisateur.</p>
          </div>

          <div>
            <h4 className="mb-3">Mes informations</h4>

            <form onSubmit={this.updateAccount}>
              <div className="form-group form-row">
                <div className="col">
                  <input aria-label="Prénom" defaultValue={userData.name} ref={(input) => { this.name = input; }} className="form-control" placeholder="Prénom" required type="text" />
                </div>

                <div className="col">
                  <input aria-label="Nom de famille" defaultValue={userData.familyName} ref={(input) => { this.familyName = input; }} className="form-control" placeholder="Nom de famille" required type="text" />
                </div>
              </div>

              {!userData.emailVerified
                && (<Alert color="warning">Vous devez vérifier votre adresse e-mail. <a href="#" onClick={this.resendVerificationLink}>Renvoyer le lien de vérification ›</a>. </Alert>)}

              <div className="form-group">
                <input aria-label="Email" defaultValue={userData.email} ref={(input) => { this.email = input; }} className="form-control" placeholder="Adresse e-mail" required type="email" />
              </div>

              <h5 className="mb-3">Personnaliser votre boutique</h5>
              <div className="form-group form-row">
                <div className="col">
                  <div className="form-group">
                    <input aria-label="Nom de votre entreprise / association" defaultValue={userData.companyName} ref={(input) => { this.companyName = input; }} className="form-control" placeholder="Nom de votre entreprise / association (optionnel)" type="text" />
                  </div>

                  <div className="form-group">
                    <input aria-label="Instagram" defaultValue={userData.instagram} ref={(input) => { this.instagram = input; }} className="form-control" placeholder="Url page instagram (optionnel)" type="text" />
                  </div>
                </div>

                <div className="col">
                  <div className="form-group">
                    <input aria-label="Votre site internet" defaultValue={userData.website} ref={(input) => { this.website = input; }} className="form-control" placeholder="Url de votre site internet (optionnel)" type="text" />
                  </div>

                  <div className="form-group">
                    <input aria-label="Facebook" defaultValue={userData.facebook} ref={(input) => { this.facebook = input; }} className="form-control" placeholder="Url page facebook (optionnel)" type="text" />
                  </div>
                </div>
              </div>

              <textarea ref={(input) => { this.biography = input; }} placeholder="Votre biographie (optionnel)" className="form-control" maxLength="450" rows="4" /><br />

              <Button color="primary" size="lg" block type="submit">Mettre à jour</Button>
            </form>

            <hr />

            <h4 className="mb-3">Changer mon mot de passe</h4>
            <form onSubmit={this.updatePassword}>
              <div className="form-group">
                <input aria-label="Ancien mot de passe" ref={(input) => { this.inputCurrentPassword = input; }} id="inputCurrentPassword" className="form-control" placeholder="Mot de passe" required type="password" />
              </div>

              <div className="form-group">
                <input aria-label="Nouveau mot de passe" ref={(input) => { this.inputPassword = input; }} id="inputPassword" className="form-control" placeholder="Nouveau mot de passe" required type="password" />
              </div>

              <div className="form-group">
                <input aria-label="Confirmation du nouveau mot de passe" ref={(input) => { this.inputPasswordAgain = input; }} id="inputPasswordAgain" className="form-control" placeholder="Confirmation du nouveau mot de passe" required type="password" />
              </div>

              <Button color="primary" size="lg" block type="submit">Changement du mot de passe</Button>
            </form>

            <hr />

            <h4 className="mb-3">Mon adresse (Par défaut)</h4>
            <form onSubmit={this.updateBilling}>
              <div className="form-group">
                <input aria-label="Adresse" defaultValue={userData.address} ref={(input) => { this.address = input; }} type="text" className="form-control" id="address" placeholder="Adresse" />
              </div>

              <div className="form-group">
                <input aria-label="Adresse 2 (Optionnel)" defaultValue={userData.address_two} ref={(input) => { this.address_two = input; }} type="text" className="form-control" id="address2" placeholder="Adresse 2 (Optionnel)" />
              </div>

              <div className="form-group">
                <input aria-label="Ville" defaultValue={userData.city} ref={(input) => { this.city = input; }} type="text" className="form-control" id="city" placeholder="Ville" />
              </div>

              <div className="row">
                <div className="col-md-5 mb-3">
                  <select defaultValue={userData.country} aria-label="Pays" ref={(input) => { this.country = input; }} className="custom-select d-block w-100" id="country">
                    <option value="">Choisir...</option>
                    <CountrySelector />
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <input aria-label="Région" defaultValue={userData.state} ref={(input) => { this.countryState = input; }} type="text" className="form-control" placeholder="Région" id="state" />
                </div>
                <div className="col-md-3 mb-3">
                  <input aria-label="Code postal" defaultValue={userData.zip} ref={(input) => { this.zip = input; }} type="text" className="form-control" id="zip" placeholder="Code Postal" />
                </div>
              </div>

              <Button color="primary" size="lg" block type="submit">Mettre à jour</Button>
            </form>

            <hr />

            <h4 className="mb-3">Coordonnées bancaires</h4>
            <p>Vous souhaitez faire un projet sur onvataider.com ? Vendre un produit <strong>au profit d’une collecte solidaire ?</strong> Dans ce cas, merci de fournir Les informations nécessaires à tout virement bancaire.</p>
            <Button color="primary" onClick={this.collapseToggle}>Voir le formulaire</Button>
            <Collapse isOpen={collapse}>
              <br />
              <Card>
                <CardBody>
                  <form onSubmit={this.formStripeAccount}>
                    <div className="row form-group">
                      <div className="col-md-6">
                        <label htmlFor="stripeName">Prénom
                          <input ref={(input) => { this.stripeName = input; }} disabled={(userData.haveStripeCustomAccount === true && 'disabled')} required className="form-control" id="stripeName" />
                        </label>
                      </div>

                      <div className="col-md-6">
                        <label htmlFor="stripeFamilyName">Nom de famille
                          <input ref={(input) => { this.stripeFamilyName = input; }} disabled={(userData.haveStripeCustomAccount === true && 'disabled')} required className="form-control" id="stripeFamilyName" />
                        </label>
                      </div>
                    </div>

                    <div className="row form-group">
                      <div className="col-md-4">
                        <label htmlFor="stripeDobDay">Jour
                          <input ref={(input) => { this.stripeDobDay = input; }} disabled={(userData.haveStripeCustomAccount === true && 'disabled')} required type="number" step="1" className="form-control" id="stripeDobDay" />
                        </label>
                      </div>
                      <div className="col-md-4">
                        <label htmlFor="stripeDobMonth">Mois
                          <input ref={(input) => { this.stripeDobMonth = input; }} disabled={(userData.haveStripeCustomAccount === true && 'disabled')} required type="number" step="1" className="form-control" id="stripeDobMonth" />
                        </label>
                      </div>
                      <div className="col-md-4">
                        <label htmlFor="stripeDobYear">Année
                          <input ref={(input) => { this.stripeDobYear = input; }} disabled={(userData.haveStripeCustomAccount === true && 'disabled')} required type="number" step="1" min="1900" className="form-control" id="stripeDobYear" />
                        </label>
                      </div>
                    </div>

                    {userData.haveStripeCustomAccount === false && (
                      <React.Fragment>
                        <div className="form-group">
                          <label htmlFor="stripeAddress">Adresse
                            <input ref={(input) => { this.stripeAddress = input; }} required className="form-control" id="stripeAddress" />
                          </label>
                        </div>

                        <div className="row form-group">
                          <div className="col-md-4 mb-3">
                            <label htmlFor="stripeState">Région
                              <input ref={(input) => { this.stripeState = input; }} required type="text" className="form-control" id="stripeState" />
                            </label>
                          </div>
                          <div className="col-md-5 mb-3">
                            <label htmlFor="stripeCity">Ville
                              <input ref={(input) => { this.stripeCity = input; }} required type="text" className="form-control" id="stripeCity" />
                            </label>
                          </div>
                          <div className="col-md-3 mb-3">
                            <label htmlFor="stripeZip">Code postal
                              <input ref={(input) => { this.stripeZip = input; }} required type="text" className="form-control" id="stripeZip" />
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <span>Document d'identité</span><br />
                          <input type="file" id="id-file" required name="id-file" accept=".jpeg,.jpg,.png" />
                        </div>
                      </React.Fragment>
                    )}

                    {userData.haveStripeCustomAccount === true
                      ? (
                        <React.Fragment>
                          <hr />
                          <h5>Changement du compte en banque</h5>
                          <p className="text-muted">
                                            Vous avez déjà configuré un compte en banque, pour des raisons de sécurité les informations liées ne sont pas disponibles dans cet espace. Si vous voulez en savoir plus, prenez contact avec un administrateur du site.<br /><br />
                                            Cependant, vous pouvez rentrer de nouvelles informations et celles-ci remplaceront le compte actuellement utilisé.
                          </p>
                        </React.Fragment>
                      ) : null
                    }

                    <div className="row form-group">
                      <div className="col-md-6">
                        <label htmlFor="stripeIBAN">IBAN
                          <input ref={(input) => { this.stripeIBAN = input; }} required={userData.haveStripeCustomAccount === false} type="text" className="form-control" id="stripeIBAN" />
                        </label>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="stripeBankHolder">Nom du titulaire du compte.
                          <input ref={(input) => { this.stripeBankHolder = input; }} required={userData.haveStripeCustomAccount === false} type="text" className="form-control" id="stripeBankHolder" />
                        </label>
                      </div>
                    </div>

                    {userData.haveStripeCustomAccount === false ? (
                      <p>En cliquant sur ce bouton, vous acceptez <a href="/conditions-generales-dutilisation" target="_blank" rel="noopener noreferrer">nos Conditions Générales d'Utilisation</a> ainsi que les <a href="https://stripe.com/fr/connect-account/legal" target="_blank" rel="noopener noreferrer">Conditions d'Utilisation des Comptes Connectés Stripe.</a></p>
                    ) : null}

                    <div className="text-right">
                      {userData.haveStripeCustomAccount === false ? (
                        (waitingRequestStripe === true
                          ? <Button disabled color="primary" type="submit"><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours ...</span></Button>
                          : <Button type="submit" color="primary">Création du compte Stripe</Button>)
                      )
                        : (waitingRequestStripe === true
                          ? <Button disabled color="primary" type="submit"><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours ...</span></Button>
                          : <Button type="submit" color="primary">Modification</Button>)
                      }
                    </div>
                  </form>
                </CardBody>
              </Card>
            </Collapse>

            <hr />

            <h5>Règlementation GDPR</h5>
            <p>Règlement du Parlement européen et du Conseil relatif à la protection des personnes physiques à l&apos;égard du traitement des données à caractère personnel et à la libre circulation de ces données.</p>

            <Toggle>
              {({ on, toggle }) => (
                <React.Fragment>
                  {on
                    && (
                    <Modal isOpen={on} toggle={toggle}>
                      <ModalHeader toggle={toggle}>Suppression de votre compte Onvataider</ModalHeader>
                      <form onSubmit={(e) => {
                        e.preventDefault();

                        Meteor.call('removeMe');
                        toggle();

                        const { history } = this.props;
                        history.push('/');
                      }}
                      >
                        <ModalBody>
                                Voulez-vous vraiment supprimer cet élément ?
                        </ModalBody>
                        <ModalFooter>
                          <Button color="secondary" onClick={toggle} type="button">Annuler</Button>{' '}
                          <Button color="danger" type="submit">Supprimer</Button>
                        </ModalFooter>
                      </form>
                    </Modal>
                    )}
                  <Button color="danger" onClick={toggle}>Supprimer mon compte</Button>
                </React.Fragment>
              )}
            </Toggle>
            &nbsp;
            {(gdprData != null
              ? <a download="moncompte.csv" className="btn btn-success" href={gdprData}>Téléchargement</a>
              : <Button onClick={this.getGdprData} color="primary">Export des données</Button>)}
          </div>
        </Container>
      );
    }
}

export default withAlert(withRouter(Settings));
