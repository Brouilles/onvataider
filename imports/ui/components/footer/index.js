import React from 'react';
import { Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';

const footer = () => (
  <Container id="footer" className="py-5 border-top" style={{ marginTop: '24px' }}>
    <Row>
      <div className="col-12 col-md">
        <img className="mb-2" src="/logo/onvataiderx24.png" alt="Onvataider.com" width="24" height="24" />
        <small className="d-block mb-3 text-muted">© { (new Date()).getFullYear() }</small>
        <small className="d-block mb-3"><a className="text-muted" href="https://stripe.com/fr" rel="noopener noreferrer" target="_blank">Paiements sécurisés par <strong>Stripe</strong></a></small>
        <small className="d-block mb-3"><a className="text-muted" href="https://www.facebook.com/Onvataider/" rel="noopener noreferrer" target="_blank">Soutenez-nous avec un <strong>LIKE</strong> sur notre page Facebook <FontAwesomeIcon icon={faFacebook} /></a></small>
      </div>
      <div className="col-7 col-md">
        <h5>Aide</h5>
        <ul className="list-unstyled text-small">
          <li><Link to="/presenter-un-projet" className="text-muted">Le Principe</Link></li>
          <li><Link to="/mode-emploi-du-createur-de-projet" className="text-muted">Mode d'emploi créateur</Link></li>
          <li><Link to="/mode-emploi-du-contributeur" className="text-muted">Mode d'emploi contributeurs</Link></li>
          <li><Link to="/conditions-generales-dutilisation" className="text-muted">CGU et Mentions Légales</Link></li>
        </ul>
      </div>
      <div className="col-7 col-md">
        <h5>Catégories</h5>
        <ul className="list-unstyled text-small">
          <li><Link to="/projets" className="text-muted">Projets</Link></li>
          <li><Link to="/collectes" className="text-muted">Collectes solidaires</Link></li>
          <li><Link to="/produits" className="text-muted">Ventes solidaires</Link></li>
        </ul>
      </div>
      <div className="col-7 col-md">
        <h5>À propos</h5>
        <ul className="list-unstyled text-small">
          <li><Link to="/qui-sommes-nous" className="text-muted">Qui sommes-nous ?</Link></li>
          <li><Link to="/faq" className="text-muted">FAQ</Link></li>
          <li><Link to="/contact" className="text-muted">Contact</Link></li>
        </ul>
      </div>
    </Row>
  </Container>
);

export default footer;
