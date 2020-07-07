import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { Button, Badge } from 'reactstrap';
import {
  CardElement, StripeProvider, Elements, injectStripe,
} from 'react-stripe-elements';
import { Meteor } from 'meteor/meteor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { withAlert } from '../../components/alert';
import CountrySelector from '../../components/countriesSelector';

class _CardForm extends Component {
    state = {
      waitingRequest: false,
    };

    handleSubmit = (e) => {
      e.preventDefault();
      const {
        alert, history, stripe, parentId, projectId, amount, isProduct,
      } = this.props;

      if (stripe) {
        // Purchase
        this.setState({ waitingRequest: true });
        stripe.createToken().then((payload) => {
          Meteor.call('createPurchase', {
            parentId,
            stripeTokenId: payload.token.id,
            stripeTokenCardZip: payload.token.card.address_zip,
            address: this.address.value,
            address_two: this.address_two.value,
            city: this.city.value,
            state: this.countryState.value,
            zip: this.zip.value,
            country: this.country.value,
            amount: parseInt(amount, 10),
            projectId,
            isProduct,
            comment: this.comment.value,
            anonymous: this.anonymous.checked,
          }, (error) => {
            if (error) {
              this.setState({ waitingRequest: false });
              return alert.show(error.message, { type: 'error' });
            }

            alert.show('Merci beaucoup ! Votre contribution vient d\'être prise en compte !', { type: 'success' });
            history.push(`/projet/redirect/${projectId}`);
          });
        });
      } else {
        console.log("Stripe.js hasn't loaded yet.");
      }
    }

    render() {
      const { projectId } = this.props;
      const { waitingRequest } = this.state;

      return (
        <React.Fragment>
          <h3 className="form-group"><span className="step">1</span> Informations postales</h3>
          <form>
            <div className="form-group">
              <label htmlFor="address">Adresse
                <input ref={(input) => { this.address = input; }} type="text" className="form-control" id="address" placeholder="75, Rue Bonnet" />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="address2">Adresse 2 (Optionnel)
                <input ref={(input) => { this.address_two = input; }} type="text" className="form-control" id="address2" />
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="Ville">Ville
                <input ref={(input) => { this.city = input; }} type="text" className="form-control" id="city" placeholder="Paris" />
              </label>
            </div>

            <div className="row">
              <div className="col-md-5 mb-3">
                <label htmlFor="country">Pays
                  <select ref={(input) => { this.country = input; }} className="custom-select d-block w-100" id="country">
                    <option value="">Choisir...</option>
                    <CountrySelector />
                  </select>
                </label>
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="state">Région
                  <input ref={(input) => { this.countryState = input; }} type="text" className="form-control" id="state" placeholder="Île-de-France" />
                </label>
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="state">Code Postal
                  <input ref={(input) => { this.zip = input; }} type="text" className="form-control" id="zip" placeholder="75000" />
                </label>
              </div>
            </div>
          </form>

          <hr />

          {(projectId != null
            && (
              <React.Fragment>
                <form>
                  <div className="form-group">
                    <label htmlFor="inputDescription">Commentaire (Optionnel)
                      <textarea ref={(input) => { this.comment = input; }} className="form-control" id="inputDescription" maxLength="260" rows="3" placeholder="Votre commentaire !" />
                    </label>
                  </div>
                </form>

                <hr />
              </React.Fragment>
            )
          )}

          <h3 className="form-group"><span className="step">2</span> Vos informations de paiement</h3>
          <form onSubmit={this.handleSubmit}>
            Carte de crédit
            <CardElement
              {...{
                hidePostalCode: false,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#495057',
                    letterSpacing: '0.025em',
                    '::placeholder': {
                      color: '#6c747d',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />

            <div className="form-group form-check" style={{ marginTop: '16px' }}>
              <input className="form-check-input" ref={(input) => { this.anonymous = input; }} type="checkbox" />
              <label className="form-check-label">
                Don anonyme (seul le porteur de projet aura connaissance de votre nom)
              </label>
            </div>

            <div className="form-group form-check" style={{ marginTop: '16px' }}>
              <input className="form-check-input" type="checkbox" required />
              <label className="form-check-label">
                J’accepte les <Link target="_blank" to="/conditions-generales-dutilisation">Conditions Générales d’Utilisation</Link>
              </label>
            </div>

            <div className="form-group text-right">
              {(waitingRequest === true
                ? <Button block size="lg" disabled color="primary"><FontAwesomeIcon icon={faSpinner} className="rotation-animation align-middle" />  <span className="align-middle">En cours ...</span></Button>
                : <Button block size="lg" color="primary">Terminer la commande</Button>)}
            </div>
          </form>

          <div style={{ textAlign: 'center' }}>
            <Badge className="badge-light">Paiements sécurisés par Stripe</Badge>
          </div>

        </React.Fragment>
      );
    }
}
const CardForm = withAlert(withRouter(injectStripe(_CardForm)));

const Purchase = (params) => {
  document.title = 'Contribution - Onvataider.com';
  return (
    <div id="main-content" className="small-content">
      <div className="py-5 text-center">
        <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
        <h2>{decodeURI(params.match.params.name)} - Confirmation</h2>
        <p className="lead">Votre carte sera débitée de {params.match.params.amount}€ et apparaîtra sur votre relevé sous le nom: onvataider.com.</p>
      </div>

      <StripeProvider apiKey={Meteor.settings.public.stripe}>
        <Elements>
          <CardForm
            amount={params.match.params.amount}
            parentId={params.match.params.elementId}
            projectId={params.match.params.projectId}
            isProduct={params.match.params.isProduct === 'true'}
          />
        </Elements>
      </StripeProvider>
    </div>
  );
};

export default Purchase;
