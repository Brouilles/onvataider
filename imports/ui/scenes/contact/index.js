import React, { Component } from 'react';
import MetaTags from 'react-meta-tags';
import { Container, Button, Alert } from 'reactstrap';
import { Meteor } from 'meteor/meteor';

export default class Contact extends Component {
    state = {
      error: null,
      success: null,
    };

      sendEmail = (e) => {
        e.preventDefault();

        Meteor.call('sendContactEmail',
          {
            name: this.name.value,
            email: this.email.value,
            msg: this.msg.value,
          },
          (error) => {
            if (error) {
              this.setState({ error: error.message });
              return;
            }

            this.setState({ success: 'L\'email a été envoyé avec succès !' });
            this.name.value = '';
            this.email.value = '';
            this.msg.value = '';
          },
        );
      }

      render() {
        const { error, success } = this.state;

        return (
          <Container id="main-content">
            <MetaTags>
              <title>Contact - Onvataider.com</title>
              <meta name="description" content="Onvataider.com - Crowdfunding pour des projets participatifs sociaux et solidaires pour le handicap, les actions collectives et les collectes solidaires" />
              <meta property="og:title" content="Contact - Onvataider.com" />
              <meta property="og:image" content="`https://onvataider.com/banner.jpg" />
            </MetaTags>

            <div className="py-5 text-center">
              <img className="d-block mx-auto mb-4" src="/logo/onvataiderx96.png" alt="Onvataider.com" width="72" height="72" />
              <h2>Vous avez des questions ?</h2>
              <p className="lead">N’hésitez pas à nous laisser un message ou à prendre rendez-vous pour échanger avec Onvataider.</p>

              {success != null && (
                <Alert color="success">{success}</Alert>
              )}

              {error != null && (
                <Alert color="danger">{error}</Alert>
              )}

              <form onSubmit={this.sendEmail}>
                <div className="form-group">
                  <input aria-label="Nom" ref={(input) => { this.name = input; }} id="inputName" className="form-control" placeholder="Nom" required type="text" />
                </div>

                <div className="form-group">
                  <input aria-label="Email" ref={(input) => { this.email = input; }} id="inputEmail" className="form-control" placeholder="Adresse e-mail" required type="email" />
                </div>

                <div className="form-group">
                  <textarea aria-label="Message" ref={(input) => { this.msg = input; }} className="form-control" placeholder="Votre message ici" required rows="6" />
                </div>

                <hr />
                <Button color="primary" size="lg" block type="submit">Envoyer</Button>
              </form>

            </div>
          </Container>
        );
      }
}
